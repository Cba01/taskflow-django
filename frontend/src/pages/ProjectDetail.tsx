import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProject, listMembers, type Project, type Membership } from '../api/projects'
import { listTasks, STATUS_LABELS, PRIORITY_LABELS, type TaskListItem } from '../api/tasks'
import type { PaginatedResponse } from '../api/types'
import Pagination from '../components/Pagination'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<Membership[]>([])
  const [taskResponse, setTaskResponse] = useState<PaginatedResponse<TaskListItem> | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    Promise.all([getProject(id), listMembers(id)])
      .then(([projectData, membersData]) => {
        setProject(projectData)
        setMembers(membersData)
      })
      .catch(() => setError('No se pudo cargar el proyecto.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return

    listTasks(id, page)
      .then(setTaskResponse)
      .catch(() => setError('No se pudieron cargar las tareas.'))
  }, [id, page])

  const tasks = taskResponse?.results ?? []

  if (loading) return <p className="mx-auto max-w-3xl px-4 py-8 text-gray-600">Cargando...</p>
  if (error) return <p className="mx-auto max-w-3xl px-4 py-8 text-red-600">{error}</p>
  if (!project) return null

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="text-sm text-gray-500 hover:underline">
        &larr; Volver a mis proyectos
      </Link>

      <div className="mt-4 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        {project.user_role && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {project.user_role}
          </span>
        )}
      </div>

      {project.description && <p className="mb-6 text-gray-600">{project.description}</p>}

      <h2 className="mb-3 text-lg font-medium">Miembros</h2>
      <ul className="mb-6 flex flex-col gap-2">
        {members.map((membership) => (
          <li
            key={membership.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
          >
            <span>{membership.user.username}</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {membership.role}
            </span>
          </li>
        ))}
      </ul>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-medium">Tareas</h2>
        <Link
          to={`/projects/${id}/tasks/new`}
          className="rounded-md bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700"
        >
          Nueva tarea
        </Link>
      </div>
      {tasks.length === 0 && <p className="text-gray-600">Todavía no hay tareas.</p>}
      <ul className="flex flex-col gap-2">
        {tasks.map((task) => (
          <li key={task.id}>
            <Link
              to={`/projects/${id}/tasks/${task.id}`}
              className="block rounded-lg border border-gray-200 p-3 hover:border-gray-300"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{task.title}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {STATUS_LABELS[task.status] ?? task.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Prioridad: {PRIORITY_LABELS[task.priority] ?? task.priority}
                {task.assigned_to && ` · Asignada a ${task.assigned_to.username}`}
                {task.due_date && ` · Vence ${task.due_date}`}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {taskResponse && <Pagination page={page} onPageChange={setPage} response={taskResponse} />}
    </div>
  )
}
