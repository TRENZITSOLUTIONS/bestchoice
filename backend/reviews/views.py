from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Review, ReviewConfig, find_verifying_order
from .serializers import ReviewSerializer, ReviewCreateSerializer
from products.models import Product


@api_view(['GET', 'POST'])
def product_reviews(request, product_slug):
    try:
        product = Product.objects.get(slug=product_slug)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        reviews = Review.objects.filter(product=product, is_approved=True)
        serializer = ReviewSerializer(reviews, many=True)
        ratings = [r.rating for r in reviews]
        avg = round(sum(ratings) / len(ratings), 1) if ratings else 0
        dist = {str(i): 0 for i in range(1, 6)}
        for r in ratings:
            dist[str(r)] += 1
        return Response({
            'average_rating': avg,
            'total_reviews': len(ratings),
            'distribution': dist,
            'results': serializer.data,
        })

    # POST
    if not request.user.is_authenticated:
        return Response({'error': 'Login required'}, status=status.HTTP_401_UNAUTHORIZED)

    serializer = ReviewCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    if Review.objects.filter(user=request.user, product=product).exists():
        return Response({'error': 'Already reviewed'}, status=status.HTTP_400_BAD_REQUEST)

    verifying_order = find_verifying_order(request.user, product)
    review = Review.objects.create(
        user=request.user,
        product=product,
        order=verifying_order,
        rating=serializer.validated_data['rating'],
        text=serializer.validated_data.get('text', ''),
        images=serializer.validated_data.get('images', []),
        is_verified_purchase=verifying_order is not None,
        is_approved=ReviewConfig.get_config().auto_approve_reviews,
    )
    return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_reviews(request):
    reviews = Review.objects.filter(user=request.user)
    serializer = ReviewSerializer(reviews, many=True)
    return Response(serializer.data)
