from .base import *
from decouple import config

DEBUG = False

# Render expone el hostname público del servicio en esta variable
# automáticamente — no hace falta hardcodearlo ni pedírselo al usuario.
render_hostname = config('RENDER_EXTERNAL_HOSTNAME', default='')
if render_hostname:
    ALLOWED_HOSTS.append(render_hostname)
    # Django exige el origin completo (con esquema) para aceptar POSTs
    # con CSRF (p.ej. el login de /admin/) detrás de un proxy.
    CSRF_TRUSTED_ORIGINS = [f'https://{render_hostname}']

# Render termina el TLS en su proxy y reenvía a Django como HTTP interno.
# Sin esto, SECURE_SSL_REDIRECT ve cada request como HTTP y genera un
# loop infinito de redirects.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Neon exige SSL en la conexión.
DATABASES['default']['OPTIONS'] = {'sslmode': 'require'}
DATABASES['default']['CONN_MAX_AGE'] = 60

# Sin un CDN aparte, whitenoise sirve los estáticos (admin, API
# navegable de DRF, Swagger UI) directo desde el propio proceso.
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
STATIC_ROOT = BASE_DIR / 'staticfiles'
