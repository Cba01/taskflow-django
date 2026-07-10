from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Task, Comment
from apps.users.serializers import UserSummarySerializer

User = get_user_model()


class CommentSerializer(serializers.ModelSerializer):
    author = UserSummarySerializer(read_only=True)
    # read_only=True porque el autor lo asignamos nosotros en la view,
    # no el cliente. Si fuera writable, cualquiera podría crear
    # comentarios "de parte de" otro usuario.

    class Meta:
        model = Comment
        fields = ['id', 'author', 'content', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']


class TaskSerializer(serializers.ModelSerializer):
    created_by = UserSummarySerializer(read_only=True)
    assigned_to = UserSummarySerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    comments_count = serializers.SerializerMethodField()

    # Este campo permite recibir el ID del usuario a asignar (write),
    # mientras que assigned_to muestra el objeto completo (read).
    # Es el patrón estándar para FKs en DRF: leer objeto, escribir ID.
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='assigned_to',   # le dice al serializer que este campo
        write_only=True,        # mapea al campo 'assigned_to' del modelo
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description',
            'status', 'priority', 'due_date',
            'project',
            'created_by', 'assigned_to', 'assigned_to_id',
            'comments', 'comments_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'project', 'created_at', 'updated_at']
        # 'project' es read_only porque se asigna desde la URL,
        # no desde el body del request. Ej: POST /projects/3/tasks/

    def get_comments_count(self, obj):
        # SerializerMethodField llama a este método automáticamente.
        # El nombre siempre debe ser get_<nombre_del_campo>.
        # Útil para agregar datos calculados sin crear un campo en la BD.
        return obj.comments.count()

    def validate(self, data):
        # validate() es el lugar correcto para validaciones que involucran
        # múltiples campos a la vez. Para un solo campo, usarías validate_<campo>().
        assigned_to = data.get('assigned_to')
        if assigned_to:
            # Verificamos que el usuario asignado sea miembro del proyecto.
            # self.context['project'] lo inyectamos desde la view.
            project = self.context.get('project')
            if project and not project.memberships.filter(user=assigned_to).exists():
                raise serializers.ValidationError(
                    {'assigned_to_id': 'El usuario no es miembro de este proyecto.'}
                )
        return data


class TaskListSerializer(serializers.ModelSerializer):
    """
    Versión liviana para listar muchas tareas (ej: vista kanban).
    No incluye comentarios completos para no matar la performance.
    Cuando tienes 200 tareas, devolver todos los comentarios de cada
    una en un solo request es un desastre — esto se llama over-fetching.
    """
    assigned_to = UserSummarySerializer(read_only=True)
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'status', 'priority',
            'due_date', 'assigned_to', 'comments_count',
            'created_at',
        ]

    def get_comments_count(self, obj):
        return obj.comments.count()