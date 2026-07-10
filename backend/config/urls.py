from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include([
        # Auth
        path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain'),
        path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
        # Apps
        path('', include('apps.users.urls')),
        path('', include('apps.projects.urls')),
        path('', include('apps.tasks.urls')),
    ])),
    # Documentación automática con drf-spectacular
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    #path('', include('apps.tasks.urls')),
]