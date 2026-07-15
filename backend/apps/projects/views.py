from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Project, Membership
from .serializers import ProjectSerializer, MembershipSerializer
from apps.core.permissions import IsProjectAdmin, IsProjectMember
from apps.notifications.services import notify
from apps.notifications.models import Notification

User = get_user_model()


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

# Enpoint modificados para asegurar que los usuarios solo puedan acceder a proyectos donde son miembros o dueños, y para gestionar miembros con permisos adecuados.
    def get_queryset(self):
        """Solo proyectos donde el usuario es miembro o dueño."""
        user = self.request.user
        return Project.objects.filter(
            Q(owner=user) | Q(memberships__user=user)
        ).distinct()

# Al crear un proyecto, el usuario autenticado se establece como propietario y se crea una membresía con rol de admin
    def perform_create(self, serializer):
        project = serializer.save(owner=self.request.user)
        # El dueño se agrega automáticamente como admin
        # creando la membresía del propietario con rol de admin
        Membership.objects.create(
            project=project,
            user=self.request.user,
            role=Membership.Role.ADMIN
        )

# Endpoint personalizado para gestionar miembros del proyecto, con permisos adecuados para cada acción
    @action(detail=True, methods=['get', 'post'], url_path='members')
    def members(self, request, pk=None):
        project = self.get_object()

        if request.method == 'GET':
            memberships = project.memberships.select_related('user')
            serializer = MembershipSerializer(memberships, many=True)
            return Response(serializer.data)

        # POST: agregar miembro (solo admins)
        if not IsProjectAdmin().has_object_permission(request, self, project):
            return Response({'detail': 'Sin permisos.'}, status=status.HTTP_403_FORBIDDEN)

        # El frontend manda el email de la persona a invitar en vez de su
        # user_id, que nadie conoce de memoria. Lo resolvemos aquí.
        email = request.data.get('email', '').strip().lower()
        user = User.objects.filter(email=email).first()
        if not user:
            return Response(
                {'email': 'No existe un usuario registrado con ese email.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user == project.owner or project.memberships.filter(user=user).exists():
            return Response(
                {'email': 'Ese usuario ya es miembro del proyecto.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = MembershipSerializer(
            data={'user_id': user.id, 'role': request.data.get('role', Membership.Role.MEMBER)}
        )
        serializer.is_valid(raise_exception=True)
        membership = serializer.save(project=project)

        notify(
            recipient=membership.user,
            notification_type=Notification.Type.MEMBER_ADDED,
            message=f'Te agregaron al proyecto "{project.name}"',
            actor=request.user,
            project=project,
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)
