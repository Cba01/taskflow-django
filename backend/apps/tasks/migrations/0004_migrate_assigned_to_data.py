# Paso 2 de 3: copiamos el usuario asignado (FK vieja) al nuevo
# campo M2M, para no perder datos ya cargados en la base.
from django.db import migrations


def copy_assigned_to(apps, schema_editor):
    Task = apps.get_model('tasks', 'Task')
    for task in Task.objects.exclude(assigned_to__isnull=True):
        task.assigned_to_m2m.add(task.assigned_to_id)


def reverse_copy(apps, schema_editor):
    Task = apps.get_model('tasks', 'Task')
    for task in Task.objects.all():
        first_user = task.assigned_to_m2m.first()
        if first_user:
            task.assigned_to_id = first_user.id
            task.save(update_fields=['assigned_to'])


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0003_task_assigned_to_m2m'),
    ]

    operations = [
        migrations.RunPython(copy_assigned_to, reverse_copy),
    ]
