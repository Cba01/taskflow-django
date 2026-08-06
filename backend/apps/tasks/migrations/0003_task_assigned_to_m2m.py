# Paso 1 de 3 para convertir 'assigned_to' de ForeignKey (un solo
# usuario) a ManyToManyField (varios usuarios): agregamos el nuevo
# campo M2M con otro nombre, sin tocar todavía el campo viejo.
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('tasks', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='assigned_to_m2m',
            field=models.ManyToManyField(
                blank=True, related_name='assigned_tasks_m2m', to=settings.AUTH_USER_MODEL
            ),
        ),
    ]
