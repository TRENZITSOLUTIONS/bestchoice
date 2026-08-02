from datetime import timedelta

from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import LoyaltyTransaction, LoyaltyConfig
from .serializers import LoyaltyTransactionSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def loyalty_balance(request):
    user = request.user
    earned = sum(t.points for t in LoyaltyTransaction.objects.filter(user=user, type='earned'))
    spent = sum(abs(t.points) for t in LoyaltyTransaction.objects.filter(user=user, type='spent'))

    soon = timezone.now() + timedelta(days=LoyaltyConfig.get_config().expiring_soon_window_days)
    expiring_soon_batches = LoyaltyTransaction.objects.filter(
        user=user, remaining__gt=0, expires_at__isnull=False, expires_at__lte=soon,
    ).order_by('expires_at')
    expiring_soon = sum(t.remaining for t in expiring_soon_batches)
    next_expiry = expiring_soon_batches.first()

    return Response({
        'points': user.loyalty_points,
        'lifetime_earned': earned,
        'lifetime_spent': spent,
        'expiring_soon': expiring_soon,
        'next_expiry_date': next_expiry.expires_at.date() if next_expiry else None,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def loyalty_transactions(request):
    transactions = LoyaltyTransaction.objects.filter(user=request.user)[:50]
    serializer = LoyaltyTransactionSerializer(transactions, many=True)
    return Response({'results': serializer.data})
