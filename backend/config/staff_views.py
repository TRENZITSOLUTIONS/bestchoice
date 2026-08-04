"""Read and reporting endpoints for the staff dashboard.

All of these are staff-only. They live here rather than in a feature app because
each one deliberately reads across apps (orders + products + coupons + reviews),
which is exactly what a business dashboard needs and what no single app owns.
"""
from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, F, Q, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from coupons.models import Coupon
from delivery.models import DeliveryPincode
from orders.models import Order, OrderStatusHistory, Refund
from orders.serializers import OrderListSerializer, RefundSerializer
from products.models import Product
from reviews.models import Review

# Orders in these states are cancelled or never paid for, so they must not count
# toward revenue.
REVENUE_FILTER = Q(payment_status='paid') & ~Q(status='cancelled')


def _paginate(request, queryset, serializer_class, page_size=25):
    try:
        page = max(1, int(request.query_params.get('page', 1)))
    except ValueError:
        page = 1
    try:
        page_size = min(100, max(1, int(request.query_params.get('page_size', page_size))))
    except ValueError:
        pass

    total = queryset.count()
    start = (page - 1) * page_size
    rows = queryset[start:start + page_size]
    return Response({
        'count': total,
        'page': page,
        'page_size': page_size,
        'num_pages': (total + page_size - 1) // page_size or 1,
        'results': serializer_class(rows, many=True).data,
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_stats(request):
    """Headline numbers for the dashboard home."""
    try:
        days = min(365, max(1, int(request.query_params.get('days', 7))))
    except ValueError:
        days = 7

    today = timezone.now().date()
    since = today - timedelta(days=days - 1)

    paid = Order.objects.filter(REVENUE_FILTER)
    revenue = paid.aggregate(total=Sum('total'))['total'] or Decimal('0')
    revenue_period = paid.filter(created_at__date__gte=since).aggregate(
        total=Sum('total'))['total'] or Decimal('0')

    # One row per day, zero-filled, so the chart has no gaps.
    by_day = {
        row['day']: row for row in paid
        .filter(created_at__date__gte=since)
        .annotate(day=TruncDate('created_at'))
        .values('day')
        .annotate(revenue=Sum('total'), orders=Count('id'))
    }
    sales_chart = []
    for offset in range(days):
        day = since + timedelta(days=offset)
        row = by_day.get(day)
        sales_chart.append({
            'date': day.isoformat(),
            'revenue': str(row['revenue'] if row else Decimal('0')),
            'orders': row['orders'] if row else 0,
        })

    status_counts = {
        row['status']: row['n']
        for row in Order.objects.values('status').annotate(n=Count('id'))
    }

    return Response({
        'period_days': days,
        'revenue_total': str(revenue),
        'revenue_period': str(revenue_period),
        'orders_total': Order.objects.count(),
        'orders_period': paid.filter(created_at__date__gte=since).count(),
        'orders_awaiting_action': Order.objects.filter(
            status__in=['pending', 'confirmed', 'packed']).count(),
        'orders_by_status': status_counts,
        'refunds_pending': Refund.objects.filter(status='requested').count(),
        'reviews_pending': Review.objects.filter(is_approved=False).count(),
        'products_active': Product.objects.filter(is_active=True).count(),
        'products_out_of_stock': Product.objects.filter(
            is_active=True, total_stock__lte=0).count(),
        'customers_total': Order.objects.values('user').distinct().count(),
        'sales_chart': sales_chart,
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def reports(request):
    """Top sellers, revenue by category, and delivery-type split."""
    try:
        days = min(365, max(1, int(request.query_params.get('days', 30))))
    except ValueError:
        days = 30
    since = timezone.now().date() - timedelta(days=days - 1)

    paid_items = Q(order__payment_status='paid') & ~Q(order__status='cancelled') & Q(
        order__created_at__date__gte=since)

    from orders.models import OrderItem

    top_products = [
        {
            'product_id': row['product'],
            'name': row['product__name'] or 'Deleted product',
            'slug': row['product__slug'],
            'units': row['units'],
            'revenue': str(row['revenue'] or Decimal('0')),
        }
        for row in OrderItem.objects.filter(paid_items)
        .values('product', 'product__name', 'product__slug')
        .annotate(units=Sum('quantity'), revenue=Sum(F('price') * F('quantity')))
        .order_by('-units')[:10]
    ]

    revenue_by_category = [
        {
            'category': row['product__category__name'] or 'Uncategorised',
            'slug': row['product__category__slug'],
            'units': row['units'],
            'revenue': str(row['revenue'] or Decimal('0')),
        }
        for row in OrderItem.objects.filter(paid_items)
        .values('product__category__name', 'product__category__slug')
        .annotate(units=Sum('quantity'), revenue=Sum(F('price') * F('quantity')))
        .order_by('-revenue')
    ]

    by_delivery_type = [
        {
            'delivery_type': row['delivery_type'],
            'orders': row['orders'],
            'revenue': str(row['revenue'] or Decimal('0')),
        }
        for row in Order.objects.filter(REVENUE_FILTER, created_at__date__gte=since)
        .values('delivery_type')
        .annotate(orders=Count('id'), revenue=Sum('total'))
    ]

    return Response({
        'period_days': days,
        'top_products': top_products,
        'revenue_by_category': revenue_by_category,
        'by_delivery_type': by_delivery_type,
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def order_list(request):
    """Every order, filterable - the customer-facing /orders/ only shows their own."""
    qs = Order.objects.select_related('user').order_by('-created_at')

    order_status = request.query_params.get('status')
    if order_status:
        qs = qs.filter(status=order_status)
    payment_status = request.query_params.get('payment_status')
    if payment_status:
        qs = qs.filter(payment_status=payment_status)
    delivery_type = request.query_params.get('delivery_type')
    if delivery_type:
        qs = qs.filter(delivery_type=delivery_type)
    search = (request.query_params.get('search') or '').strip()
    if search:
        qs = qs.filter(
            Q(order_id__icontains=search)
            | Q(user__email__icontains=search)
            | Q(user__phone__icontains=search)
        )

    return _paginate(request, qs, OrderListSerializer)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def bulk_mark_shipped(request):
    """Mark several orders shipped in one go, with optional tracking details."""
    order_ids = request.data.get('order_ids') or []
    if not isinstance(order_ids, list) or not order_ids:
        return Response({'error': 'order_ids must be a non-empty list'},
                        status=status.HTTP_400_BAD_REQUEST)

    provider = (request.data.get('tracking_provider') or '').strip()
    tracking_id = (request.data.get('tracking_id') or '').strip()
    if len(order_ids) > 1 and tracking_id:
        return Response(
            {'error': 'A tracking id identifies one parcel - mark those orders '
                      'individually, or send only tracking_provider.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    updated, skipped = [], []
    for order in Order.objects.filter(order_id__in=order_ids):
        if order.status in ('shipped', 'delivered', 'cancelled'):
            skipped.append({'order_id': order.order_id, 'reason': f'already {order.status}'})
            continue

        order.status = 'shipped'
        if provider:
            order.tracking_provider = provider
        if tracking_id:
            order.tracking_id = tracking_id
        order.save()
        OrderStatusHistory.objects.create(
            order=order, status='shipped',
            note=f'Bulk marked shipped by {request.user.email}',
        )
        updated.append(order.order_id)

    missing = set(order_ids) - {o.order_id for o in Order.objects.filter(order_id__in=order_ids)}
    for order_id in sorted(missing):
        skipped.append({'order_id': order_id, 'reason': 'not found'})

    return Response({'updated': updated, 'skipped': skipped})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def refund_list(request):
    qs = Refund.objects.select_related('order', 'order__user').order_by('-created_at')
    refund_status = request.query_params.get('status')
    if refund_status:
        qs = qs.filter(status=refund_status)
    return _paginate(request, qs, RefundSerializer)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def inventory_list(request):
    """Stock across the catalogue, worst first so shortages surface immediately."""
    qs = Product.objects.select_related('category', 'brand').order_by('total_stock', 'name')
    if request.query_params.get('out_of_stock') == 'true':
        qs = qs.filter(total_stock__lte=0)
    search = (request.query_params.get('search') or '').strip()
    if search:
        qs = qs.filter(Q(name__icontains=search) | Q(auto_product_id__icontains=search))

    try:
        low_threshold = max(0, int(request.query_params.get('low_stock_below', 10)))
    except ValueError:
        low_threshold = 10

    def row(product):
        return {
            'id': product.id,
            'auto_product_id': product.auto_product_id,
            'name': product.name,
            'slug': product.slug,
            'category': product.category.name if product.category else None,
            'brand': product.brand.name if product.brand else None,
            'selling_price': str(product.selling_price),
            'total_stock': product.total_stock,
            'is_active': product.is_active,
            'variant_count': product.variants.count(),
            'stock_state': (
                'out' if product.total_stock <= 0
                else 'low' if product.total_stock < low_threshold
                else 'ok'
            ),
        }

    try:
        page = max(1, int(request.query_params.get('page', 1)))
    except ValueError:
        page = 1
    page_size = 25
    total = qs.count()
    start = (page - 1) * page_size
    return Response({
        'count': total,
        'page': page,
        'page_size': page_size,
        'num_pages': (total + page_size - 1) // page_size or 1,
        'out_of_stock_count': Product.objects.filter(is_active=True, total_stock__lte=0).count(),
        'results': [row(p) for p in qs[start:start + page_size]],
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def review_queue(request):
    """Reviews awaiting moderation, plus recently published ones."""
    qs = Review.objects.select_related('user', 'product').order_by('-created_at')
    if request.query_params.get('pending') == 'true':
        qs = qs.filter(is_approved=False)

    def row(review):
        return {
            'id': review.id,
            'product': review.product.name,
            'product_slug': review.product.slug,
            'user': review.user.email,
            'rating': review.rating,
            'text': review.text,
            'is_approved': review.is_approved,
            'is_verified_purchase': review.is_verified_purchase,
            'created_at': review.created_at.isoformat(),
        }

    try:
        page = max(1, int(request.query_params.get('page', 1)))
    except ValueError:
        page = 1
    page_size = 25
    total = qs.count()
    start = (page - 1) * page_size
    return Response({
        'count': total,
        'page': page,
        'page_size': page_size,
        'num_pages': (total + page_size - 1) // page_size or 1,
        'pending_count': Review.objects.filter(is_approved=False).count(),
        'results': [row(r) for r in qs[start:start + page_size]],
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def review_moderate(request, review_id):
    try:
        review = Review.objects.get(pk=review_id)
    except Review.DoesNotExist:
        return Response({'error': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)

    action = request.data.get('action')
    if action not in ('approve', 'reject'):
        return Response({'error': "action must be 'approve' or 'reject'"},
                        status=status.HTTP_400_BAD_REQUEST)

    review.is_approved = action == 'approve'
    review.save(update_fields=['is_approved'])
    return Response({'id': review.id, 'is_approved': review.is_approved})


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def coupon_collection(request):
    if request.method == 'GET':
        rows = []
        for coupon in Coupon.objects.order_by('-created_at'):
            rows.append({
                'id': coupon.id,
                'code': coupon.code,
                'discount_type': coupon.discount_type,
                'discount_value': str(coupon.discount_value),
                'min_cart_value': str(coupon.min_cart_value),
                'max_discount': str(coupon.max_discount) if coupon.max_discount else None,
                'valid_from': coupon.valid_from.isoformat(),
                'valid_till': coupon.valid_till.isoformat(),
                'usage_limit': coupon.usage_limit,
                'used_count': coupon.used_count,
                'per_user_limit': coupon.per_user_limit,
                'is_active': coupon.is_active,
                'description': coupon.description,
            })
        return Response({'results': rows})

    from .staff_serializers import CouponWriteSerializer

    serializer = CouponWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    coupon = serializer.save()
    return Response({'id': coupon.id, 'code': coupon.code}, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def coupon_detail(request, pk):
    try:
        coupon = Coupon.objects.get(pk=pk)
    except Coupon.DoesNotExist:
        return Response({'error': 'Coupon not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        # Deactivate rather than delete - CouponUsage rows reference it, and the
        # history of which orders used which code needs to survive.
        coupon.is_active = False
        coupon.save(update_fields=['is_active'])
        return Response({'id': coupon.id, 'is_active': False})

    from .staff_serializers import CouponWriteSerializer

    serializer = CouponWriteSerializer(coupon, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    coupon = serializer.save()
    return Response({'id': coupon.id, 'code': coupon.code, 'is_active': coupon.is_active})


@api_view(['GET'])
@permission_classes([IsAdminUser])
def pincode_list(request):
    qs = DeliveryPincode.objects.order_by('pincode')
    search = (request.query_params.get('search') or '').strip()
    if search:
        qs = qs.filter(Q(pincode__icontains=search) | Q(city__icontains=search))

    try:
        page = max(1, int(request.query_params.get('page', 1)))
    except ValueError:
        page = 1
    page_size = 50
    total = qs.count()
    start = (page - 1) * page_size
    return Response({
        'count': total,
        'page': page,
        'page_size': page_size,
        'num_pages': (total + page_size - 1) // page_size or 1,
        'results': [
            {
                'id': p.id,
                'pincode': p.pincode,
                'city': p.city,
                'delivery_type': p.delivery_type,
                'estimated_days_text': p.estimated_days_text,
                'store_pickup_available': p.store_pickup_available,
                'is_active': getattr(p, 'is_active', True),
            }
            for p in qs[start:start + page_size]
        ],
    })
