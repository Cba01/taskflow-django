from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    # related_task/related_project van solo como IDs (no objetos anidados
    # completos) porque el cliente solo necesita el id para armar el link
    # ("ir a la tarea X"), no toda la data de la tarea de nuevo.
    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'message',
            'related_task', 'related_project',
            'is_read', 'created_at',
        ]
        # Todo read-only: una notificación no se crea ni edita desde el
        # cliente, solo el backend las genera (ver apps/notifications/services.py).
        # La única escritura permitida es marcarla como leída, y eso pasa
        # por una acción dedicada en la view, no por un PATCH genérico.
        read_only_fields = fields
