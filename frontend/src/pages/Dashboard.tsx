import { useEffect, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, FolderKanban, ListChecks, LogOut, Plus, Search, User, Users } from 'lucide-react'
import { logout } from '../api/auth'
import { getUnreadCount } from '../api/notifications'
import { listProjects, type Project } from '../api/projects'
import type { PaginatedResponse } from '../api/types'
import {
  CLAY,
  CLAY_CARD,
  CLAY_FIELD,
  ClayBadge,
  ClayButton,
  ClayErrorBanner,
  ClayPagination,
  hueFor,
  ROLE_LABEL,
} from '../components/ui.clay'

const PAGE_SIZE = 20

export default function Dashboard() {
  const navigate = useNavigate()
  const [response, setResponse] = useState<PaginatedResponse<Project> | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    getUnreadCount().then(setUnreadCount).catch(() => {})
  }, [])

  // Espera 400ms sin cambios antes de aplicar la búsqueda, para no
  // disparar un pedido al backend en cada tecla.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(timeout)
  }, [searchInput])

  // La búsqueda vuelve a la página 1: la página actual puede dejar
  // de existir con el nuevo resultado filtrado.
  useEffect(() => {
    setPage(1)
  }, [search])

  function fetchProjects() {
    setError(null)
    setLoading(true)
    setVisible(false)
    listProjects(page, search)
      .then(setResponse)
      .catch(() => setError('No se pudieron cargar los proyectos.'))
      .finally(() => setLoading(false))
  }

  useEffect(fetchProjects, [page, search])

  // Dispara la entrada escalonada de las tarjetas un frame después de
  // que la lista está lista, para que el navegador arranque desde el
  // estado "oculto" y la animación de rebote sea visible.
  useEffect(() => {
    if (loading) return
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [loading, response])

  const projects = response?.results ?? []
  const totalPages = response ? Math.max(1, Math.ceil(response.count / PAGE_SIZE)) : 1

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="clay-canvas min-h-screen font-sans text-slate-800">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <header className="mb-8 flex flex-col gap-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Mis proyectos</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Los espacios de trabajo donde participás.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <ClayButton hue="stone" onClick={() => navigate('/profile')}>
              <User className="h-4 w-4" aria-hidden="true" />
              Mi perfil
            </ClayButton>

            <ClayButton hue="stone" onClick={() => navigate('/notifications')} className="relative">
              <Bell className="h-4 w-4" aria-hidden="true" />
              Notificaciones
              {unreadCount > 0 && (
                <span
                  className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white px-1 text-[11px] font-bold text-white"
                  style={{ backgroundColor: CLAY.rose.base }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </ClayButton>

            <Link
              to="/projects/new"
              className="clay-surface inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border-[3px] px-4 py-2.5 text-sm font-bold"
              style={{ backgroundColor: CLAY.sunshine.soft, borderColor: CLAY.sunshine.base, color: CLAY.sunshine.text }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nuevo proyecto
            </Link>

            <ClayButton hue="stone" onClick={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Cerrar sesión
            </ClayButton>
          </div>
        </header>

        <div className="relative mb-6">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre o descripción"
            className={`${CLAY_FIELD} pl-10`}
          />
        </div>

        {loading && (
          <ul className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="tf-shimmer h-24 rounded-[22px] border-[3px] border-white bg-white"
                style={{ '--shimmer-delay': `${i * 80}ms` } as CSSProperties}
              />
            ))}
          </ul>
        )}

        {error && <ClayErrorBanner message={error} onRetry={fetchProjects} />}

        {!loading && !error && projects.length === 0 && (
          <div className={`${CLAY_CARD} flex flex-col items-center gap-3 px-4 py-12 text-center`}>
            <FolderKanban className="h-8 w-8 text-slate-400" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-500">
              {search
                ? 'No hay proyectos que coincidan con la búsqueda.'
                : 'Todavía no formás parte de ningún proyecto.'}
            </p>
          </div>
        )}

        {!loading && !error && (
          <ul className="flex flex-col gap-3">
            {projects.map((project, idx) => {
              const hue = hueFor(project.id)
              const c = CLAY[hue]
              return (
                <li
                  key={project.id}
                  className={visible ? 'clay-enter' : 'opacity-0'}
                  style={{ '--clay-delay': `${idx * 45}ms` } as CSSProperties}
                >
                  <Link to={`/projects/${project.id}`} className={`${CLAY_CARD} flex items-start gap-4 p-5`}>
                    <div
                      className="clay-surface flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-[3px] text-sm font-extrabold"
                      style={{ backgroundColor: c.soft, borderColor: c.base, color: c.text }}
                    >
                      {project.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h2 className="truncate text-base font-extrabold text-slate-900">{project.name}</h2>
                        {project.user_role && (
                          <ClayBadge hue={hue}>{ROLE_LABEL[project.user_role] ?? project.user_role}</ClayBadge>
                        )}
                      </div>
                      {project.description && (
                        <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-500">{project.description}</p>
                      )}
                      <div className="mt-3 flex items-center gap-4 text-xs font-bold text-slate-500">
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                          <Users className="h-3.5 w-3.5" aria-hidden="true" />
                          {project.members_count}
                        </span>
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                          <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
                          {project.tasks_count}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        {response && totalPages > 1 && <ClayPagination page={page} onPageChange={setPage} response={response} />}
      </div>
    </div>
  )
}
