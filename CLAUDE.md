# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

TaskFlow: a project/task management app. Django REST Framework backend (`backend/`) + React/TypeScript/Vite frontend (`frontend/`). Postgres + Redis run via Docker Compose (`docker-compose.yml` at repo root).

## Commands

### Environment setup

Docker Desktop must be started manually (it does not auto-start). Then from the repo root:

```
docker compose up -d          # starts Postgres (5432) and Redis (6379)
```

Backend env vars come from `backend/.env` (copy from `backend/.env.example`; gitignored). Frontend env vars come from `frontend/.env` (copy from `frontend/.env.example`; gitignored) — only var is `VITE_API_URL`, default `http://localhost:8000/api/v1`.

### Backend (`backend/`)

Always invoke the venv's Python directly — `source venv/Scripts/activate` does not reliably put it first on PATH on Windows:

```
backend/venv/Scripts/python.exe manage.py runserver --settings=config.settings.development
backend/venv/Scripts/python.exe manage.py migrate --settings=config.settings.development
backend/venv/Scripts/python.exe manage.py createsuperuser --settings=config.settings.development
backend/venv/Scripts/python.exe -m pip install -r requirements.txt
```

Run from inside `backend/` (where `pytest.ini` and `conftest.py` live — settings module is already configured there, no `--settings` flag needed for tests):

```
python -m pytest                                    # full suite
python -m pytest apps/tasks/tests.py                 # one file
python -m pytest apps/tasks/tests.py::TestChangeStatus::test_change_status_updates_task   # one test
```

API docs (drf-spectacular): schema at `/api/schema/`, Swagger UI at `/api/docs/`.

### Frontend (`frontend/`)

```
npm run dev       # Vite dev server, http://localhost:5173
npm run build      # tsc -b && vite build
npm run lint       # oxlint
```

## Architecture

### Backend

- Settings are split: `config/settings/base.py` (shared), `development.py`, `production.py` — always pass `--settings=config.settings.development` for local work. Env vars are read via `python-decouple`.
- Custom user model: `apps.users.User` (`AUTH_USER_MODEL = 'users.User'`), authenticates by **email**, not username (`USERNAME_FIELD = 'email'`). Any auth-related code (login payloads, token requests) must send `email`.
- Local apps: `core`, `users`, `projects`, `tasks`, `notifications`. `apps/core` holds only shared permission classes (no models) — `IsProjectMember`/`IsProjectAdmin` in `apps/core/permissions.py`, which check `Membership` for either the object itself (if it has a `.memberships` attr, i.e. a `Project`) or `obj.project` (i.e. a `Task`/nested object).
- URL structure (all under `/api/v1/`): auth (`auth/token/`, `auth/token/refresh/` — SimpleJWT) and app URLs are flat-included at root in `config/urls.py`. `tasks` is the exception — it's nested under `projects` via `drf-nested-routers`, giving `/projects/{project_pk}/tasks/...`; `TaskViewSet.get_project()` reads `project_pk` from `self.kwargs`. `notifications` is deliberately root-level (not nested) since notifications belong to a user, not a project.
- **Notification triggers are wired directly into view code, not Django signals** — this is an intentional style choice to keep the cause of each notification visible next to the action that creates it, rather than hidden in a signal handler elsewhere. Follow this pattern for any new notification type: call `apps.notifications.services.notify()` explicitly from the view/action that causes it (see `TaskViewSet.perform_create`/`perform_update`/`change_status`/`comments` in `apps/tasks/views.py`, and the `members` action in `apps/projects/views.py`).
- Permission checks are layered: DRF `permission_classes` (object-level) plus explicit membership/ownership checks inside `get_queryset`/`perform_create`/`perform_update` as defense-in-depth (see comments in `apps/tasks/views.py`).
- `TaskViewSet` picks its serializer dynamically (`TaskListSerializer` for `list`, full `TaskSerializer` otherwise) and uses `select_related`/`prefetch_related` to avoid N+1 queries — follow this pattern when adding list endpoints over related data.
- Pagination is global: `PageNumberPagination`, `PAGE_SIZE = 20` (`config/settings/base.py`). Any new list endpoint returns `{count, next, previous, results}`.
- Celery/Redis broker settings exist in `base.py` (`CELERY_BROKER_URL`/`CELERY_RESULT_BACKEND`) but there is no Celery app instance or task defined yet — treat this as unconfigured/unused until that's built out.

### Frontend

- `src/api/client.ts`: single shared axios instance. Request interceptor attaches `Authorization: Bearer <token>` from `localStorage` if present. Response interceptor catches 401s, attempts one token refresh via `/auth/token/refresh/`, retries the original request once, and clears tokens if the refresh also fails. New API modules should route through this instance rather than calling axios directly.
- `src/api/tokens.ts`: the only place that touches `localStorage` for auth tokens.
- `src/api/auth.ts`: `login`/`logout`/`isAuthenticated`, built on the two files above.
- `src/api/projects.ts`: pattern to follow for new resources — hand-written TypeScript interfaces mirroring the backend serializer's fields (including a generic `PaginatedResponse<T>` for DRF's pagination envelope), plus a thin async function per endpoint that unwraps `.data`.
- `src/routes/ProtectedRoute.tsx`: gates nested routes behind `isAuthenticated()`, redirecting to `/login` otherwise (see `App.tsx` for how it wraps routes).
- Tailwind CSS v4 via the `@tailwindcss/vite` plugin — no `tailwind.config.js` needed for basic usage.
- Client-side pagination is not yet implemented anywhere (list calls always fetch page 1 and discard `next`/`previous`/`count`) — fine while data volumes are low, but will need addressing once any list can exceed `PAGE_SIZE`.
