from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet

# Nivel raíz, no anidado bajo /projects/ como tasks — las notificaciones
# son del usuario, no de un proyecto en particular.
# Genera: /api/v1/notifications/, /api/v1/notifications/{pk}/mark-read/,
# /api/v1/notifications/mark-all-read/
router = DefaultRouter()
router.register('notifications', NotificationViewSet, basename='notification')

urlpatterns = [path('', include(router.urls))]
