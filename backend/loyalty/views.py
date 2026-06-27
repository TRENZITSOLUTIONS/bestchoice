from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import LoyaltyTransaction
from .serializers import LoyaltyTransactionSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def loyalty_balance(request):
    user = request.user
    earned = sum(t.points for t in LoyaltyTransaction.objects.filter(user=user, type='earned'))
    spent = sum(abs(t.points) for t in LoyaltyTransaction.objects.filter(user=user, type='spent'))
    return Response({
        'points': user.loyalty_points,
        'lifetime_earned': earned,
        'lifetime_spent': spent,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def loyalty_transactions(request):
    transactions = LoyaltyTransaction.objects.filter(user=request.user)[:50]
    serializer = LoyaltyTransactionSerializer(transactions, many=True)
    return Response({'results': serializer.data})
