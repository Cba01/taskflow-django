# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary audience: recruiters and technical evaluators reviewing TaskFlow as a portfolio piece — they judge it by using it like a real product, so the interface must hold up to that scrutiny even though there is no real multi-tenant user base yet.

Simulated end user (the persona the UI itself is designed for, since the app models real collaboration): a member of a small team using TaskFlow to run one or more shared projects — creating tasks, assigning them to teammates (single or multiple assignees), commenting, tracking status on a list or Kanban board, and getting notified when something changes. Roles within a project are `admin` and `member` (`Membership.role`).

## Product Purpose

TaskFlow is a project/task management app (Django REST Framework backend + React/TypeScript/Vite frontend) built by Sebastian Chuquimia as a learning project and portfolio demonstration of full-stack, production-style engineering practices. Success means the app functions correctly as a believable team task manager and demonstrates solid engineering (clean API design, auth, permissions, notifications, pagination) to anyone evaluating the code or the live UI.

## Positioning

Intentionally generic: TaskFlow does not claim a differentiated mechanism versus tools like Trello or Asana. It replicates the standard task-management pattern (projects → membership/roles → tasks → comments → notifications, list and Kanban views) as a well-executed reference implementation, not a novel product angle. Do not invent competitive claims, benchmarks, or a unique value proposition.

## Operating Context

- A project has one owner and a set of members with `admin`/`member` roles (`Membership`).
- Tasks belong to a project; have status (`todo` / `in_progress` / `done`), priority (`low` / `medium` / `high`), an optional due date, a creator, and zero or more assignees (many-to-many).
- Tasks support threaded comments.
- Notifications are triggered directly from view code (not signals) for: task assigned, task completed, comment added, member added, member removed.
- Two task views exist: a paginated list (with filters/search/ordering) and an unpaginated Kanban board (loads per status column).
- Auth is email-based (custom user model, `USERNAME_FIELD = 'email'`), JWT via SimpleJWT, with a refresh-and-retry interceptor on the frontend.
- Users have a profile: avatar (URL), bio, and a dedicated profile page.

## Capabilities and Constraints

- Backend: Django REST Framework, DRF pagination (`PageNumberPagination`, page size 20) on every list endpoint, drf-spectacular API docs.
- Frontend: React + TypeScript + Vite, Tailwind CSS v4 (`@tailwindcss/vite`, no `tailwind.config.js`), React Router.
- Celery/Redis broker settings exist but no Celery task is defined yet — unconfigured/unused; do not design around background job behavior that doesn't exist.
- This is a solo learning project, not a funded product with a design team or marketing budget — visual work should read as a credible, polished team tool, not require invented brand assets (logos, illustrations, stock photography) beyond what's reasonable for a developer to produce or source themselves.

## Brand Commitments

- Product name: TaskFlow.
- **UI language is Spanish (neutral, no voseo) and this is a durable, fixed commitment** — all user-visible text (labels, statuses, roles, notifications, error/validation messages) must stay in Spanish. Do not introduce English strings into the UI, and do not treat this as a candidate for future bilingual/i18n work unless the user explicitly changes this.
- Existing Spanish terminology already in use and to be preserved consistently: status (`Pendiente`, `En progreso`, `Completada`), priority (`Baja`, `Media`, `Alta`), roles (`Administrador`, `Miembro`), notification types (`Tarea asignada`, `Tarea completada`, `Nuevo comentario`, `Agregado al proyecto`, `Removido del proyecto`).

## Evidence on Hand

No logo, illustration set, marketing copy, testimonials, or brand assets exist beyond the product name and the Spanish terminology already implemented in code. Do not fabricate any of these.

## Product Principles

1. Read as a credible, production-quality team tool first — since the real audience evaluates it as an engineering artifact, sloppy or half-finished UI undermines the demo more than a missing feature would.
2. Preserve the generic task-manager pattern faithfully rather than inventing differentiating gimmicks; craft and polish are the differentiator, not novel mechanics.
3. Spanish UI text is non-negotiable; never let English creep in through new components, copy, or generated content.
4. Favor solutions that don't require assets or budget the user doesn't have (no stock photography, no commissioned illustration, no paid fonts/services) — build credibility through layout, type, and interaction craft instead.
5. Respect the existing role/permission model (admin vs. member) in any UI that exposes actions — affordances should reflect what the current user's role actually permits.

## Accessibility & Inclusion

No project-specific accessibility requirement has been established; follow standard web accessibility practice (WCAG-level contrast, keyboard navigation, semantic markup) as a baseline.
