from rest_framework.permissions import BasePermission
from apps.projects.models import Membership


class IsProjectMember(BasePermission):
    """Permite acceso solo a miembros del proyecto."""

    # Si el objeto tiene un atributo 'memberships', se asume que es un proyecto; de lo contrario, se asume que es una tarea y se accede al proyecto a través de la relación.
    def has_object_permission(self, request, view, obj):
        project = obj if hasattr(obj, 'memberships') else obj.project
        # Si el usuario es parte del proyecto, se le concede acceso (return true). Esto se verifica buscando una membresía que relacione al usuario con el proyecto.
        return Membership.objects.filter( # pylint: disable=no-member
            project=project,
            user=request.user
        ).exists()


class IsProjectAdmin(BasePermission):
    """Permite acceso solo a admins o dueños del proyecto."""

    def has_object_permission(self, request, view, obj):
        project = obj if hasattr(obj, 'memberships') else obj.project
        # Si el usuario es el dueño del proyecto, se le concede acceso (return true). De lo contrario, se verifica si el usuario tiene una membresía con rol de administrador en el proyecto.
        if project.owner == request.user:
            return True
        return Membership.objects.filter( # pylint: disable=no-member
            project=project,
            user=request.user,
            role=Membership.Role.ADMIN
        ).exists()