import django_filters
from .models import Task


class TaskFilter(django_filters.FilterSet):
    # Filtros exactos — el valor debe coincidir exactamente
    status = django_filters.ChoiceFilter(choices=Task.Status.choices)
    priority = django_filters.ChoiceFilter(choices=Task.Priority.choices)
    assigned_to = django_filters.NumberFilter(field_name='assigned_to__id')

    # Filtros de rango de fecha — permite ?due_date_before=2025-12-31
    due_date_before = django_filters.DateFilter(field_name='due_date', lookup_expr='lte')
    due_date_after = django_filters.DateFilter(field_name='due_date', lookup_expr='gte')

    # Filtro booleano calculado — no existe en el modelo pero lo computamos
    overdue = django_filters.BooleanFilter(method='filter_overdue')

    def filter_overdue(self, queryset, name, value):
        from django.utils import timezone
        today = timezone.now().date()
        if value:
            # Tareas vencidas: tienen fecha límite, ya pasó, y no están completadas
            return queryset.filter(
                due_date__lt=today
            ).exclude(status=Task.Status.DONE)
        return queryset

    class Meta:
        model = Task
        fields = ['status', 'priority', 'assigned_to']