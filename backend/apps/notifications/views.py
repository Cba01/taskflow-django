from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    # ReadOnlyModelViewSet en vez de ModelViewSet: solo expone list/retrieve.
    # No tiene sentido permitir create/update/delete genéricos porque las
    # notificaciones las genera el backend (ver services.py), no el cliente.
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Cada usuario ve únicamente sus propias notificaciones.
        return Notification.objects.filter(  # pylint: disable=no-member
            recipient=self.request.user
        )

    @action(detail=True, methods=['patch'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        # update() en vez de iterar y hacer .save() uno por uno: un solo
        # UPDATE en la base de datos en vez de N queries.
        updated = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'updated': updated}, status=status.HTTP_200_OK)
