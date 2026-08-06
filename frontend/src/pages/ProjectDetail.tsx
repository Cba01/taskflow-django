import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  getProject,
  listMembers,
  addMember,
  removeMember,
  updateProject,
  deleteProject,
  type Project,
  type Membership,
} from '../api/projects'
import {
  listTasks,
  STATUS_LABELS,
  PRIORITY_LABELS,
  type TaskListItem,
  type TaskFilters,
} from '../api/tasks'
import type { PaginatedResponse } from '../api/types'
import Pagination from '../components/Pagination'
import KanbanBoard from '../components/KanbanBoard'

function extractErrors(data: unknown): string[] {
  if (typeof data !== 'object' || data === null) return ['Algo salió mal. Inténtalo de nuevo.']
  return Object.values(data as Record<string, string[] | string>).flat()
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<Membership[]>([])
  const [taskResponse, setTaskResponse] = useState<PaginatedResponse<TaskListItem> | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [view, setView] = useState<'list' | 'board'>('list')

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [assignedToFilter, setAssignedToFilter] = useState('')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [ordering, setOrdering] = useState('-created_at')

  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState('member')
  const [memberErrors, setMemberErrors] = useState<string[]>([])
  const [addingMember, setAddingMember] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editErrors, setEditErrors] = useState<string[]>([])
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  // Espera 400ms sin cambios antes de aplicar la búsqueda, para no
  // disparar un pedido al backend en cada tecla.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(timeout)
  }, [searchInput])

  // Cualquier cambio de filtro vuelve a la página 1: la página actual
  // puede dejar de existir con el nuevo resultado filtrado.
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, priorityFilter, assignedToFilter, overdueOnly, ordering])

  useEffect(() => {
    if (!id || view !== 'list') return

    const filters: TaskFilters = {
      search,
      status: statusFilter,
      priority: priorityFilter,
      assigned_to: assignedToFilter ? Number(assignedToFilter) : undefined,
      ordering,
      ...(overdueOnly ? { overdue: true } : {}),
    }

    listTasks(id, page, filters)
      .then(setTaskResponse)
      .catch(() => setError('No se pudieron cargar las tareas.'))
  }, [id, view, page, search, statusFilter, priorityFilter, assignedToFilter, overdueOnly, ordering])

  const tasks = taskResponse?.results ?? []
  const hasActiveFilters =
    search !== '' || statusFilter !== '' || priorityFilter !== '' || assignedToFilter !== '' || overdueOnly

  // El tablero no tiene columna "todos los estados" ni orden manual:
  // la columna ya es el estado, y el orden dentro de cada una no aplica.
  const boardFilters: TaskFilters = {
    search,
    priority: priorityFilter,
    assigned_to: assignedToFilter ? Number(assignedToFilter) : undefined,
    ...(overdueOnly ? { overdue: true } : {}),
  }
  const isAdmin = project?.user_role === 'owner' || project?.user_role === 'admin'

  async function handleAddMember(event: FormEvent) {
    event.preventDefault()
    if (!id) return
    setMemberErrors([])
    setAddingMember(true)

    try {
      const membership = await addMember(id, memberEmail, memberRole)
      setMembers((current) => [...current, membership])
      setMemberEmail('')
      setMemberRole('member')
    } catch (err) {
      const response = (err as { response?: { data?: unknown } }).response
      setMemberErrors(extractErrors(response?.data))
    } finally {
      setAddingMember(false)
    }
  }

  async function handleRemoveMember(membershipId: number) {
    if (!id) return
    setMemberErrors([])
    setRemovingMemberId(membershipId)

    try {
      await removeMember(id, membershipId)
      setMembers((current) => current.filter((m) => m.id !== membershipId))
    } catch (err) {
      const response = (err as { response?: { data?: unknown } }).response
      setMemberErrors(extractErrors(response?.data))
    } finally {
      setRemovingMemberId(null)
    }
  }

  function startEditing() {
    if (!project) return
    setEditName(project.name)
    setEditDescription(project.description)
    setEditErrors([])
    setIsEditing(true)
  }

  async function handleSaveEdit(event: FormEvent) {
    event.preventDefault()
    if (!id) return
    setEditErrors([])
    setSavingEdit(true)

    try {
      const updated = await updateProject(id, editName, editDescription)
      setProject(updated)
      setIsEditing(false)
    } catch (err) {
      const response = (err as { response?: { data?: unknown } }).response
      setEditErrors(extractErrors(response?.data))
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleDeleteProject() {
    if (!id) return
    if (!window.confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.')) return

    setDeleting(true)
    try {
      await deleteProject(id)
      navigate('/', { replace: true })
    } catch {
      setError('No se pudo eliminar el proyecto.')
      setDeleting(false)
    }
  }

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
        <div className="flex items-center gap-2">
          {project.user_role && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {project.user_role}
            </span>
          )}
          {isAdmin && !isEditing && (
            <>
              <button
                type="button"
                onClick={startEditing}
                className="text-xs text-gray-600 hover:underline"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={deleting}
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <form
          onSubmit={handleSaveEdit}
          className="mb-6 flex flex-col gap-3 rounded-lg border border-gray-200 p-4"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="edit-name" className="text-sm text-gray-600">
              Nombre
            </label>
            <input
              id="edit-name"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="edit-description" className="text-sm text-gray-600">
              Descripción
            </label>
            <textarea
              id="edit-description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
            />
          </div>

          {editErrors.map((message) => (
            <p key={message} className="text-sm text-red-600">
              {message}
            </p>
          ))}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={savingEdit}
              className="rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {savingEdit ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:border-gray-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        project.description && <p className="mb-6 text-gray-600">{project.description}</p>
      )}

      <h2 className="mb-3 text-lg font-medium">Miembros</h2>
      <ul className="mb-6 flex flex-col gap-2">
        {members.map((membership) => (
          <li
            key={membership.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
          >
            <span>{membership.user.username}</span>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {membership.role}
              </span>
              {isAdmin && membership.user.id !== project.owner.id && (
                <button
                  type="button"
                  onClick={() => handleRemoveMember(membership.id)}
                  disabled={removingMemberId === membership.id}
                  className="text-xs text-red-600 hover:underline disabled:opacity-50"
                >
                  {removingMemberId === membership.id ? 'Sacando...' : 'Sacar'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {isAdmin && (
        <form onSubmit={handleAddMember} className="mb-6 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            placeholder="Email del usuario a agregar"
            required
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
          />
          <select
            value={memberRole}
            onChange={(e) => setMemberRole(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
          >
            <option value="member">Miembro</option>
            <option value="admin">Administrador</option>
          </select>
          <button
            type="submit"
            disabled={addingMember}
            className="rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {addingMember ? 'Agregando...' : 'Agregar'}
          </button>
        </form>
      )}

      {memberErrors.map((message) => (
        <p key={message} className="mb-4 text-sm text-red-600">
          {message}
        </p>
      ))}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-medium">Tareas</h2>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-md border border-gray-300 text-sm">
            <button
              type="button"
              onClick={() => setView('list')}
              className={`px-3 py-1.5 ${view === 'list' ? 'bg-gray-800 text-white' : 'hover:bg-gray-50'}`}
            >
              Lista
            </button>
            <button
              type="button"
              onClick={() => setView('board')}
              className={`px-3 py-1.5 ${view === 'board' ? 'bg-gray-800 text-white' : 'hover:bg-gray-50'}`}
            >
              Tablero
            </button>
          </div>
          <Link
            to={`/projects/${id}/tasks/new`}
            className="rounded-md bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700"
          >
            Nueva tarea
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por título o descripción"
          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-gray-500 sm:min-w-50"
        />
        {view === 'list' && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-gray-500"
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        )}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-gray-500"
        >
          <option value="">Toda prioridad</option>
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={assignedToFilter}
          onChange={(e) => setAssignedToFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-gray-500"
        >
          <option value="">Cualquier asignado</option>
          {members.map((membership) => (
            <option key={membership.user.id} value={membership.user.id}>
              {membership.user.username}
            </option>
          ))}
        </select>
        {view === 'list' && (
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-gray-500"
          >
            <option value="-created_at">Más recientes primero</option>
            <option value="due_date">Vencimiento más próximo</option>
            <option value="-priority_rank">Prioridad más alta</option>
          </select>
        )}
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
          />
          Solo vencidas
        </label>
      </div>

      {view === 'list' ? (
        <>
          {tasks.length === 0 && (
            <p className="text-gray-600">
              {hasActiveFilters ? 'No hay tareas que coincidan con los filtros.' : 'Todavía no hay tareas.'}
            </p>
          )}
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
                    {task.assigned_to.length > 0 &&
                      ` · Asignada a ${task.assigned_to.map((user) => user.username).join(', ')}`}
                    {task.due_date && ` · Vence ${task.due_date}`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {taskResponse && <Pagination page={page} onPageChange={setPage} response={taskResponse} />}
        </>
      ) : (
        <KanbanBoard projectId={id as string} filters={boardFilters} />
      )}
    </div>
  )
}
