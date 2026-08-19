from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.notifications.models import Notification
from apps.notifications.services import notify
from apps.projects.models import Membership, Project
from apps.tasks.models import Comment, Task

User = get_user_model()

# Credenciales públicas a propósito: esta cuenta existe para que un
# reclutador entre a ver el portafolio sin tener que registrarse con su
# propio email. Si se cambian acá, hay que actualizar el botón "Probar
# con cuenta demo" en frontend/src/pages/Login.tsx (mismo valor a mano
# en los dos lados, no vale la pena una fuente de verdad compartida
# para dos constantes).
DEMO_EMAIL = 'demo@taskflow.dev'
DEMO_PASSWORD = 'demo1234'

TEAMMATES = [
    ('ana.torres@taskflow.dev', 'ana.torres', 'Diseñadora de producto.'),
    ('carlos.mendez@taskflow.dev', 'carlos.mendez', 'Desarrollador backend.'),
]


class Command(BaseCommand):
    help = 'Crea la cuenta demo (y datos de ejemplo) usada por el botón "Probar con cuenta demo" del login.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Borra los proyectos existentes de la cuenta demo y los recrea desde cero.',
        )

    def handle(self, *args, **options):
        reset = options['reset']

        demo = self._get_or_create_user(DEMO_EMAIL, 'demo', DEMO_PASSWORD,
            'Cuenta demo del portafolio de TaskFlow — probá crear tareas, comentar y armar tu propio tablero.',
            reset=reset)
        teammates = [
            self._get_or_create_user(email, username, DEMO_PASSWORD, bio, reset=reset)
            for email, username, bio in TEAMMATES
        ]
        ana, carlos = teammates

        if reset:
            Project.objects.filter(owner=demo).delete()
        elif Project.objects.filter(owner=demo).exists():
            self.stdout.write(self.style.WARNING(
                f'La cuenta demo ({DEMO_EMAIL}) ya tiene datos — usá --reset para recrearlos desde cero.'
            ))
            return

        project = Project.objects.create(
            owner=demo,
            name='Lanzamiento de la app móvil',
            description='Coordinación del lanzamiento: diseño, backend y marketing.',
        )
        Membership.objects.create(project=project, user=demo, role=Membership.Role.ADMIN)
        Membership.objects.create(project=project, user=ana, role=Membership.Role.MEMBER)
        Membership.objects.create(project=project, user=carlos, role=Membership.Role.MEMBER)

        today = timezone.localdate()
        tasks_data = [
            dict(
                title='Definir flujo de onboarding',
                description='Bocetar las pantallas de bienvenida y primer uso.',
                status=Task.Status.DONE, priority=Task.Priority.MEDIUM,
                assigned_to=[ana], due_date=today - timedelta(days=5),
            ),
            dict(
                title='Diseñar pantallas de login y registro',
                description='Incluir estado de error y de carga.',
                status=Task.Status.DONE, priority=Task.Priority.HIGH,
                assigned_to=[ana, demo], due_date=today - timedelta(days=2),
            ),
            dict(
                title='Endpoint de notificaciones push',
                description='Integrar con el servicio de push del backend.',
                status=Task.Status.IN_PROGRESS, priority=Task.Priority.HIGH,
                assigned_to=[carlos], due_date=today + timedelta(days=2),
            ),
            dict(
                title='Optimizar queries del dashboard',
                description='Reducir consultas N+1 en el listado de proyectos.',
                status=Task.Status.IN_PROGRESS, priority=Task.Priority.MEDIUM,
                assigned_to=[carlos, demo], due_date=today + timedelta(days=4),
            ),
            dict(
                title='Armar plan de lanzamiento en redes',
                description='Calendario de publicaciones para la semana del lanzamiento.',
                status=Task.Status.TODO, priority=Task.Priority.MEDIUM,
                assigned_to=[demo], due_date=today + timedelta(days=7),
            ),
            dict(
                title='Escribir copy de la tienda de apps',
                description='',
                status=Task.Status.TODO, priority=Task.Priority.LOW,
                assigned_to=[], due_date=None,
            ),
            dict(
                title='Revisar accesibilidad del checkout',
                description='Contraste de colores y navegación por teclado.',
                status=Task.Status.TODO, priority=Task.Priority.HIGH,
                assigned_to=[ana], due_date=today + timedelta(days=1),
            ),
        ]

        tasks = []
        for data in tasks_data:
            assignees = data.pop('assigned_to')
            task = Task.objects.create(project=project, created_by=demo, **data)
            task.assigned_to.set(assignees)
            tasks.append(task)

        _onboarding, login_screens, push_endpoint, dashboard_queries, _plan, _copy, checkout_a11y = tasks

        Comment.objects.create(
            task=push_endpoint, author=carlos,
            content='Ya integré el SDK, falta probar en Android.',
        )
        Comment.objects.create(
            task=push_endpoint, author=demo,
            content='Buenísimo, avisame cuando esté listo para probarlo.',
        )
        Comment.objects.create(
            task=checkout_a11y, author=ana,
            content='Encontré dos botones sin suficiente contraste, lo corrijo hoy.',
        )

        notify(
            recipient=demo, notification_type=Notification.Type.TASK_COMPLETED,
            message=f'Ana completó "{login_screens.title}"',
            actor=ana, task=login_screens, project=project,
        )
        notify(
            recipient=demo, notification_type=Notification.Type.COMMENT_ADDED,
            message=f'Carlos comentó en "{push_endpoint.title}"',
            actor=carlos, task=push_endpoint, project=project,
        )
        notify(
            recipient=demo, notification_type=Notification.Type.TASK_ASSIGNED,
            message=f'Te asignaron la tarea "{login_screens.title}"',
            actor=ana, task=login_screens, project=project,
        )
        notify(
            recipient=demo, notification_type=Notification.Type.TASK_ASSIGNED,
            message=f'Te asignaron la tarea "{dashboard_queries.title}"',
            actor=carlos, task=dashboard_queries, project=project,
        )

        self.stdout.write(self.style.SUCCESS(f'Cuenta demo lista: {DEMO_EMAIL} / {DEMO_PASSWORD}'))

    def _get_or_create_user(self, email, username, password, bio, *, reset):
        user, created = User.objects.get_or_create(email=email, defaults={'username': username, 'bio': bio})
        if created:
            user.set_password(password)
            user.save()
        elif reset:
            # Quien esté usando la cuenta demo puede haberle cambiado el
            # nombre/avatar/bio desde "Mi perfil" — --reset también
            # restaura eso, no solo el proyecto, para que el próximo
            # visitante encuentre la cuenta como se la dejamos.
            user.username = username
            user.avatar = ''
            user.bio = bio
            user.save()
        return user
