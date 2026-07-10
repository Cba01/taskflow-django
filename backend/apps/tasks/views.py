from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .filters import TaskFilter

from .models import Task, Comment
from .serializers import TaskSerializer, TaskListSerializer, CommentSerializer
from apps.projects.models import Project, Membership
from apps.core.permissions import IsProjectMember


class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsProjectMember]

    def get_project(self):
        # Método helper — lo usamos varias veces en esta view.
        # get_object_or_404 devuelve 404 automáticamente si no existe
        # en vez de un error 500 que confunde al frontend.
        return get_object_or_404(Project, pk=self.kwargs['project_pk'])

    def get_serializer_class(self):
        # DRF permite elegir el serializer dinámicamente según la acción.
        # 'list' → versión liviana (TaskListSerializer)
        # cualquier otra acción → versión completa (TaskSerializer)
        if self.action == 'list':
            return TaskListSerializer
        return TaskSerializer

    def get_serializer_context(self):
        # Extendemos el contexto que DRF pasa al serializer.
        # Así el serializer puede acceder al proyecto para validar
        # que el usuario asignado sea miembro.
        context = super().get_serializer_context()
        context['project'] = self.get_project()
        return context

    def get_queryset(self):
        project = self.get_project()

        # Verificamos que el usuario sea miembro antes de mostrar tareas.
        # Esto es defensa en profundidad — los permisos ya lo verifican,
        # pero es buena práctica también filtrarlo en el queryset.
        if not project.memberships.filter(user=self.request.user).exists():
            if project.owner != self.request.user:
                raise PermissionDenied('No eres miembro de este proyecto.')

        # select_related hace un JOIN en SQL para traer los usuarios relacionados
        # en una sola query. Sin esto, Django haría N queries adicionales
        # (una por cada tarea para obtener created_by, otra para assigned_to).
        # Eso se llama el problema N+1 y es un error muy común en entrevistas.
        return Task.objects.filter(project=project).select_related(
            'created_by', 'assigned_to'
        ).prefetch_related('comments__author')
        # prefetch_related es para relaciones muchos-a-muchos o FK reversas
        # (como comments). Hace 2 queries totales en vez de N.

    def perform_create(self, serializer):
        project = self.get_project()
        # Verificamos membresía antes de crear
        if not project.memberships.filter(user=self.request.user).exists():
            if project.owner != self.request.user:
                raise PermissionDenied('No eres miembro de este proyecto.')

        serializer.save(
            project=project,
            created_by=self.request.user
            # Así el cliente no puede falsificar quién creó la tarea
        )

    def perform_update(self, serializer):
        task = self.get_object()
        # Solo el creador, el asignado, o un admin del proyecto puede editar
        project = task.project
        is_admin = project.owner == self.request.user or \
            project.memberships.filter(
                user=self.request.user, role=Membership.Role.ADMIN
            ).exists()
        is_involved = task.created_by == self.request.user or \
            task.assigned_to == self.request.user

        if not (is_admin or is_involved):
            raise PermissionDenied('Solo puedes editar tareas que creaste o tienes asignadas.')

        serializer.save()

    # Acción personalizada para cambiar solo el estado de una tarea.
    # En vez de hacer PATCH con todo el body, el frontend puede enviar
    # solo {"status": "done"} a /tasks/5/change_status/
    @action(detail=True, methods=['patch'], url_path='change-status')
    def change_status(self, request, project_pk=None, pk=None):
        task = self.get_object()
        new_status = request.data.get('status')

        # Validamos que el valor sea uno de los permitidos
        valid_statuses = [choice[0] for choice in Task.Status.choices]
        if new_status not in valid_statuses:
            return Response(
                {'status': f'Valor inválido. Opciones: {valid_statuses}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        task.status = new_status
        task.save(update_fields=['status', 'updated_at'])
        # update_fields le dice a Django que solo actualice esos campos
        # en la BD, en vez de hacer UPDATE de toda la fila. Más eficiente
        # y evita condiciones de carrera en entornos con muchos usuarios.

        return Response(TaskSerializer(task, context={'request': request}).data)

    @action(detail=True, methods=['get', 'post'], url_path='comments')
    def comments(self, request, project_pk=None, pk=None):
        task = self.get_object()

        if request.method == 'GET':
            comments = task.comments.select_related('author')
            serializer = CommentSerializer(comments, many=True)
            return Response(serializer.data)

        # POST: crear comentario
        serializer = CommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(task=task, author=request.user)
        # raise_exception=True hace que DRF devuelva 400 automáticamente
        # con los errores de validación si is_valid() falla.
        # Sin esto tendrías que hacer el if/else manualmente.

        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = TaskFilter
    search_fields = ['title', 'description']   # ?search=login
    ordering_fields = ['created_at', 'due_date', 'priority']  # ?ordering=-due_date
    ordering = ['-created_at']                 # orden por defecto