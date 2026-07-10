from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

# Serializers para mostrar informacion basica de User
class UserSummarySerializer(serializers.ModelSerializer):
   
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar']
        read_only_fields = fields  # nunca se puede modificar un usuario desde aquí

# Serializer para mostrar el perfil completo del usuario autenticado
class UserDetailSerializer(serializers.ModelSerializer):
   
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar', 'bio', 'created_at']
        read_only_fields = ['id', 'email', 'created_at']

# Serializer para registro de nuevos usuarios
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)