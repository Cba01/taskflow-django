from django.db import models

from django.db import models
from django.conf import settings

# Clase proyecto, con campos para nombre, descripción, propietario y fechas de creación/actualización
class Project(models.Model):
    
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_projects'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'proyecto'

    def __str__(self):
        return str(self.name)

# Clase membresía, que relaciona usuarios con proyectos y define su rol (administrador o miembro) dentro del proyecto
class Membership(models.Model):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Administrador'
        MEMBER = 'member', 'Miembro'

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Garantiza que un usuario solo pueda tener una membresía por proyecto
        unique_together = ('project', 'user')
        verbose_name = 'membresía'

    def __str__(self):
        return f'{str(self.user.email)} → {str(self.project.name)} ({self.role})' # pylint: disable=no-member