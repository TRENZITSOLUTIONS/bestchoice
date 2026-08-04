from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import UserSerializer


def _award_signup_bonuses(user):
    from loyalty.models import LoyaltyConfig
    from loyalty.utils import earn_points

    config = LoyaltyConfig.get_config()
    earn_points(user, config.welcome_bonus_points, description='Welcome bonus')

    if user.referred_by:
        earn_points(user.referred_by, config.referral_bonus_points,
                    description=f'Referral bonus for {user.email}')
        earn_points(user, config.referral_bonus_points, description='Referred by friend')


def _merge_guest_cart(request, user):
    """Carry a pre-sign-in guest cart over to the account."""
    from cart.views import merge_session_cart

    session_id = request.session.session_key
    if session_id:
        merge_session_cart(user, session_id)


def _token_response(user, created):
    refresh = RefreshToken.for_user(user)
    return Response({
        'user': UserSerializer(user).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def staff_login(request):
    """Password login for staff only. Customers authenticate via Google."""
    email = (request.data.get('email') or '').strip().lower()
    password = request.data.get('password') or ''
    if not email or not password:
        return Response({'detail': 'Email and password are required.'},
                        status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=email, password=password)
    if user is None:
        return Response({'detail': 'Invalid email or password.'},
                        status=status.HTTP_401_UNAUTHORIZED)
    if not user.is_staff:
        return Response({'detail': 'This sign-in is for staff accounts only.'},
                        status=status.HTTP_403_FORBIDDEN)

    _merge_guest_cart(request, user)
    return _token_response(user, created=False)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    if not settings.GOOGLE_OAUTH_CLIENT_ID:
        return Response({'detail': 'Google sign-in is not configured.'},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE)

    credential = request.data.get('credential') or ''
    if not credential:
        return Response({'detail': 'credential is required.'},
                        status=status.HTTP_400_BAD_REQUEST)

    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token

    try:
        payload = id_token.verify_oauth2_token(
            credential, google_requests.Request(), settings.GOOGLE_OAUTH_CLIENT_ID
        )
    except ValueError:
        return Response({'detail': 'Invalid Google credential.'},
                        status=status.HTTP_401_UNAUTHORIZED)

    email = (payload.get('email') or '').lower()
    if not email or not payload.get('email_verified'):
        return Response({'detail': 'Google account has no verified email address.'},
                        status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(email__iexact=email).first()
    if user:
        _merge_guest_cart(request, user)
        return _token_response(user, created=False)

    user = User.objects.create_user(
        username=email,
        email=email,
        first_name=payload.get('given_name', ''),
        last_name=payload.get('family_name', ''),
    )

    referral_code = request.data.get('referral_code') or ''
    if referral_code:
        referrer = User.objects.filter(referral_code=referral_code).first()
        if referrer:
            user.referred_by = referrer
            user.save(update_fields=['referred_by'])

    _award_signup_bonuses(user)
    _merge_guest_cart(request, user)
    return _token_response(user, created=True)


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
