from rest_framework import generics, permissions
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserDetailSerializer

User = get_user_model()

# Endpoint publico para registrar nuevos usuarios
class RegisterView(generics.CreateAPIView):

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    # AllowAny permite acceso sin token — necesario para registrarse

# Endpoint protegido para que el usuario autenticado vea y edite su propio perfil
class MeView(generics.RetrieveUpdateAPIView):

    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # En vez de buscar por PK en la URL, devolvemos
        # directamente al usuario del token JWT
        return self.request.user
