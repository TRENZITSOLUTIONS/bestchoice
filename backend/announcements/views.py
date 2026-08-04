from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import AnnouncementMessage
from .serializers import AnnouncementMessageSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def announcement_list(request):
    messages = AnnouncementMessage.objects.filter(is_active=True)
    return Response({'results': AnnouncementMessageSerializer(messages, many=True).data})
