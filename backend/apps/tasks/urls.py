from django.urls import path, include
from rest_framework_nested import routers
from apps.projects.urls import router as projects_router
from .views import TaskViewSet

# drf-nested-routers genera URLs anidadas automáticamente:
# /api/v1/projects/{project_pk}/tasks/
# /api/v1/projects/{project_pk}/tasks/{pk}/
# /api/v1/projects/{project_pk}/tasks/{pk}/comments/
# /api/v1/projects/{project_pk}/tasks/{pk}/change-status/

tasks_router = routers.NestedSimpleRouter(
    projects_router, 'projects', lookup='project'
)
tasks_router.register('tasks', TaskViewSet, basename='project-tasks')

urlpatterns = [
    path('', include(tasks_router.urls)),
]