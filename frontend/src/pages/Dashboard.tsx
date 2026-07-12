import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../api/auth'
import { listProjects, type Project } from '../api/projects'

export default function Dashboard() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(() => setError('No se pudieron cargar los proyectos.'))
      .finally(() => setLoading(false))
  }, [])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mis proyectos</h1>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
        >
          Cerrar sesión
        </button>
      </div>

      {loading && <p className="text-gray-600">Cargando...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && projects.length === 0 && (
        <p className="text-gray-600">Todavía no formás parte de ningún proyecto.</p>
      )}

      <ul className="flex flex-col gap-3">
        {projects.map((project) => (
          <li key={project.id}>
            <Link
              to={`/projects/${project.id}`}
              className="block rounded-lg border border-gray-200 p-4 shadow-sm hover:border-gray-300"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">{project.name}</h2>
                {project.user_role && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {project.user_role}
                  </span>
                )}
              </div>
              {project.description && (
                <p className="mt-1 text-sm text-gray-600">{project.description}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                {project.members_count} miembro{project.members_count !== 1 && 's'} ·{' '}
                {project.tasks_count} tarea{project.tasks_count !== 1 && 's'}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
