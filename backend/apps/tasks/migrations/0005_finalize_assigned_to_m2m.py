# Paso 3 de 3: borramos la FK vieja, y el campo M2M nuevo pasa a
# llamarse 'assigned_to' (con el related_name definitivo).
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0004_migrate_assigned_to_data'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='task',
            name='assigned_to',
        ),
        migrations.RenameField(
            model_name='task',
            old_name='assigned_to_m2m',
            new_name='assigned_to',
        ),
        migrations.AlterField(
            model_name='task',
            name='assigned_to',
            field=models.ManyToManyField(
                blank=True, related_name='assigned_tasks', to=settings.AUTH_USER_MODEL
            ),
        ),
    ]
