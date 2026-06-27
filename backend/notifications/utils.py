from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string


def send_order_confirmation(order):
    subject = f'Order Confirmed - {order.order_id}'
    items = [{
        'name': item.product_snapshot.get('name', 'Product'),
        'sku': item.product_snapshot.get('sku', ''),
        'quantity': item.quantity,
        'price': item.price,
    } for item in order.items.all()]

    html_message = render_to_string('notifications/order_confirmation.html', {
        'order': order,
        'items': items,
        'subtotal': order.subtotal,
        'discount': order.discount,
        'delivery_charge': order.delivery_charge,
        'total': order.total,
    })

    send_mail(
        subject=subject,
        message=f'Your order {order.order_id} has been confirmed. Total: ₹{order.total}',
        html_message=html_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[order.user.email],
        fail_silently=True,
    )


def send_order_shipped(order):
    subject = f'Order Shipped - {order.order_id}'
    tracking_info = ''
    if order.tracking_id:
        tracking_info = f'\nTracking ID: {order.tracking_id}\nTrack: {order.tracking_url or "N/A"}'

    send_mail(
        subject=subject,
        message=f'Your order {order.order_id} has been shipped!{tracking_info}\nEstimated delivery: {order.estimated_delivery}',
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[order.user.email],
        fail_silently=True,
    )
