from .models import Notification


def notify(recipient, notification_type, message, *, actor=None, task=None, project=None):
    """
    Crea una notificación para `recipient`, salvo que sea la misma persona
    que disparó la acción (`actor`). Evita el caso molesto de "te llegó
    una notificación por algo que hiciste vos mismo" (ej: te asignás una
    tarea a vos mismo, comentás tu propia tarea, etc.).
    """
    if actor is not None and recipient == actor:
        return None

    return Notification.objects.create(  # pylint: disable=no-member
        recipient=recipient,
        notification_type=notification_type,
        message=message,
        related_task=task,
        related_project=project,
    )
