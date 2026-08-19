# TaskFlow

Task manager por proyectos: tareas con estado y prioridad, asignación a varias personas, comentarios, notificaciones y un tablero Kanban con drag & drop real. Backend en Django REST Framework, frontend en React + TypeScript.

Lo armé como pieza de portfolio para practicar un stack completo de punta a punta (auth con JWT, permisos por rol, paginación, notificaciones, un sistema de diseño propio) en vez de quedarme en un CRUD de ejemplo. No busca ser una herramienta diferenciada frente a Trello o Asana — el objetivo era resolver bien el patrón clásico de gestión de tareas.

## Ver en vivo

- App: https://taskp-flow.netlify.app
- API / docs: https://taskflow-backend-io2a.onrender.com/api/docs/

En el login hay un botón "Probar con cuenta demo" que entra directo con una cuenta de ejemplo (ya tiene un proyecto con tareas, comentarios y notificaciones cargados), así no hace falta registrarse con tu propio email para mirarlo. Es una cuenta compartida entre quien la visite, así que de tanto en tanto la reseteo si queda muy revuelta.

El backend corre en el plan free de Render, así que si nadie lo usó en un rato el primer request puede tardar unos 30-40 segundos en levantar.

## Qué tiene

- Proyectos con miembros y dos roles (administrador / miembro), cada acción respeta lo que ese rol puede hacer.
- Tareas con estado (pendiente / en progreso / completada), prioridad, fecha límite y uno o varios asignados.
- Comentarios por tarea.
- Notificaciones cuando te asignan una tarea, la completan, comentan algo tuyo, o te agregan/sacan de un proyecto.
- Vista de lista (con filtros, búsqueda y orden) o tablero Kanban por proyecto — el tablero usa GSAP para el arrastre real, no es solo un hover con CSS.
- Login por email (no por username) con JWT y refresh de sesión automático.
- Perfil con avatar y bio.

## Stack

**Backend** — Django 6 + Django REST Framework, autenticación JWT (SimpleJWT), drf-spectacular para la documentación de la API, Postgres, permisos en capas (a nivel de vista y reforzados en el queryset). Suite de tests con pytest.

**Frontend** — React 19 + TypeScript + Vite, Tailwind CSS v4, React Router. Sistema de diseño propio ("claymorphism": bordes gruesos, sombra doble, todo con rebote al tocarlo) documentado en [`DESIGN.md`](DESIGN.md).

**Infra** — Postgres/Redis vía Docker Compose en desarrollo; en producción, backend en Render, base de datos en Neon, frontend en Netlify.

## Estructura

```
backend/
  apps/
    core/           # permisos compartidos (IsProjectMember, IsProjectAdmin)
    users/          # modelo de usuario custom, login por email
    projects/       # proyectos y membresías
    tasks/          # tareas y comentarios (anidado bajo projects/)
    notifications/
  config/
    settings/       # base.py + development.py + production.py

frontend/
  src/
    api/            # cliente axios + un módulo por recurso
    components/     # AppShell, KanbanBoard, Avatar, primitivas del sistema de diseño (ui.clay.tsx)
    pages/
    routes/         # ProtectedRoute
```

## Correrlo en local

Hace falta Docker (para Postgres y Redis), Python 3.13 y Node.

```bash
# Postgres + Redis
docker compose up -d

# Backend
cd backend
python -m venv venv
venv\Scripts\activate        # source venv/bin/activate en Linux/Mac
pip install -r requirements.txt
copy .env.example .env       # cp en Linux/Mac
python manage.py migrate --settings=config.settings.development
python manage.py seed_demo_data --settings=config.settings.development   # opcional, carga datos de ejemplo
python manage.py runserver --settings=config.settings.development

# Frontend (en otra terminal)
cd frontend
npm install
copy .env.example .env
npm run dev
```

Con eso: la app queda en `localhost:5173`, la API en `localhost:8000/api/v1`, y la documentación interactiva de la API en `localhost:8000/api/docs/`.

### Tests

```bash
cd backend
python -m pytest
```

## Deploy

`render.yaml` y `netlify.toml`, en la raíz del repo, dejan ambos servicios configurados solos al conectar el repositorio — lo único que hay que cargar a mano son las credenciales de conexión a Neon en el dashboard de Render.
