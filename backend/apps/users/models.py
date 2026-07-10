from django.contrib.auth.models import AbstractUser
from django.db import models



class User(AbstractUser):
    email = models.EmailField(unique=True)
    avatar = models.URLField(blank=True)
    bio = models.TextField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Configuración para usar el email como campo de autenticación (para Django admin y autenticación general integrados con JWT)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    # Opciones de visualización en el admin)
    class Meta:
        verbose_name = 'usuario'
        verbose_name_plural = 'usuarios'

    def __str__(self):
        return self.email