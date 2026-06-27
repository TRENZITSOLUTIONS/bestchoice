from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .serializers import UserSerializer, RegisterSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    from rest_framework_simplejwt.tokens import RefreshToken
    from loyalty.models import LoyaltyTransaction

    # Welcome bonus
    user.loyalty_points = 50
    user.save()
    LoyaltyTransaction.objects.create(
        user=user, points=50, type='earned',
        description='Welcome bonus'
    )

    refresh = RefreshToken.for_user(user)

    return Response({
        'user': UserSerializer(user).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def me(request):
    if request.method == 'GET':
        return Response(UserSerializer(request.user).data)

    data = request.data
    user = request.user
    for field in ['first_name', 'last_name', 'phone']:
        if field in data:
            setattr(user, field, data[field])
    user.save()
    return Response(UserSerializer(user).data)
