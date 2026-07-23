from django.db import models
from django.conf import settings


class Notification(models.Model):
    class Type(models.TextChoices):
        TASK_ASSIGNED = 'task_assigned', 'Tarea asignada'
        TASK_COMPLETED = 'task_completed', 'Tarea completada'
        COMMENT_ADDED = 'comment_added', 'Nuevo comentario'
        MEMBER_ADDED = 'member_added', 'Agregado al proyecto'
        MEMBER_REMOVED = 'member_removed', 'Removido del proyecto'

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(max_length=30, choices=Type.choices)
    message = models.CharField(max_length=255)
    # Referencia genérica al objeto relacionado (tarea o proyecto)
    related_task = models.ForeignKey(
        'tasks.Task', on_delete=models.CASCADE,
        null=True, blank=True
    )
    related_project = models.ForeignKey(
        'projects.Project', on_delete=models.CASCADE,
        null=True, blank=True
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'notificación'

    def __str__(self):
        return f'{self.notification_type} → {self.recipient.email}'# pylint: disable=no-member