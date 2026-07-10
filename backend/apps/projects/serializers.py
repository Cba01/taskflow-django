from rest_framework import serializers
from .models import Project, Membership
from apps.users.serializers import UserSummarySerializer


# Serializer para el modelo Membership, que incluye información del usuario y su rol en el proyecto
class MembershipSerializer(serializers.ModelSerializer):
    # El campo 'user' es de solo lectura y se muestra como un resumen del usuario, mientras que 'user_id' es un campo de escritura que se utiliza para asignar un usuario a la membresía.
    user = UserSummarySerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Membership
        fields = ['id', 'user', 'user_id', 'role', 'joined_at']

# Serializer para el modelo Project, que incluye información del propietario, conteo de miembros y tareas, y el rol del usuario en el proyecto
class ProjectSerializer(serializers.ModelSerializer):
    owner = UserSummarySerializer(read_only=True)
    members_count = serializers.SerializerMethodField()
    tasks_count = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'owner',
            'members_count', 'tasks_count', 'user_role',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['owner', 'created_at', 'updated_at']


# Métodos personalizados para calcular el número de miembros, tareas y el rol del usuario en el proyecto
    def get_members_count(self, obj):
        return obj.memberships.count()

    def get_tasks_count(self, obj):
        return obj.tasks.count()

    def get_user_role(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        if obj.owner == request.user:
            return 'owner'
        membership = obj.memberships.filter(user=request.user).first()
        return membership.role if membership else None