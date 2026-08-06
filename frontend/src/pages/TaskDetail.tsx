import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  getTask,
  changeTaskStatus,
  createComment,
  updateTask,
  deleteTask,
  STATUS_LABELS,
  PRIORITY_LABELS,
  type Task,
} from '../api/tasks'
import { getProject, listMembers, type Project, type Membership } from '../api/projects'
import { getCurrentUser, type UserProfile } from '../api/users'
import { Avatar, AvatarStack } from '../components/Avatar'

function extractErrors(data: unknown): string[] {
  if (typeof data !== 'object' || data === null) return ['Algo salió mal. Inténtalo de nuevo.']
  return Object.values(data as Record<string, string[] | string>).flat()
}

export default function TaskDetail() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>()
  const navigate = useNavigate()
  const [task, setTask] = useState<Task | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<Membership[]>([])
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState('medium')
  const [editDueDate, setEditDueDate] = useState('')
  const [editAssignedTo, setEditAssignedTo] = useState<number[]>([])
  const [editErrors, setEditErrors] = useState<string[]>([])
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!projectId || !taskId) return

    Promise.all([
      getTask(projectId, taskId),
      getProject(projectId),
      listMembers(projectId),
      getCurrentUser(),
    ])
      .then(([taskData, projectData, membersData, userData]) => {
        setTask(taskData)
        setProject(projectData)
        setMembers(membersData)
        setCurrentUser(userData)
      })
      .catch(() => setError('No se pudo cargar la tarea.'))
      .finally(() => setLoading(false))
  }, [projectId, taskId])

  function handleStatusChange(newStatus: string) {
    if (!projectId || !taskId) return

    changeTaskStatus(projectId, taskId, newStatus).then(setTask)
  }

  function handleCommentSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!projectId || !taskId || !newComment.trim()) return

    setSubmitting(true)
    createComment(projectId, taskId, newComment)
      .then((comment) => {
        setTask((current) => current && { ...current, comments: [...current.comments, comment] })
        setNewComment('')
      })
      .finally(() => setSubmitting(false))
  }

  function startEditing() {
    if (!task) return
    setEditTitle(task.title)
    setEditDescription(task.description)
    setEditPriority(task.priority)
    setEditDueDate(task.due_date ?? '')
    setEditAssignedTo(task.assigned_to.map((user) => user.id))
    setEditErrors([])
    setIsEditing(true)
  }

  async function handleSaveEdit(event: FormEvent) {
    event.preventDefault()
    if (!projectId || !taskId) return
    setEditErrors([])
    setSavingEdit(true)

    try {
      const updated = await updateTask(projectId, taskId, {
        title: editTitle,
        description: editDescription,
        priority: editPriority,
        due_date: editDueDate || null,
        assigned_to_ids: editAssignedTo,
      })
      setTask(updated)
      setIsEditing(false)
    } catch (err) {
      const response = (err as { response?: { data?: unknown } }).response
      setEditErrors(extractErrors(response?.data))
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleDeleteTask() {
    if (!projectId || !taskId) return
    if (!window.confirm('¿Eliminar esta tarea? Esta acción no se puede deshacer.')) return

    setDeleting(true)
    try {
      await deleteTask(projectId, taskId)
      navigate(`/projects/${projectId}`, { replace: true })
    } catch {
      setError('No se pudo eliminar la tarea.')
      setDeleting(false)
    }
  }

  if (loading) return <p className="mx-auto max-w-3xl px-4 py-8 text-gray-600">Cargando...</p>
  if (error) return <p className="mx-auto max-w-3xl px-4 py-8 text-red-600">{error}</p>
  if (!task || !project || !currentUser) return null

  // Mismas reglas que el backend (ver TaskViewSet.perform_update/perform_destroy):
  // admins/dueño pueden todo; el creador o el asignado pueden editar (no borrar);
  // borrar queda reservado a admins/dueño o a quien creó la tarea.
  const isAdmin = project.user_role === 'owner' || project.user_role === 'admin'
  const isCreator = task.created_by.id === currentUser.id
  const isAssignee = task.assigned_to.some((user) => user.id === currentUser.id)
  const canEdit = isAdmin || isCreator || isAssignee
  const canDelete = isAdmin || isCreator

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to={`/projects/${projectId}`} className="text-sm text-gray-500 hover:underline">
        &larr; Volver al proyecto
      </Link>

      <div className="mt-4 mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{task.title}</h1>
        <div className="flex items-center gap-3">
          <select
            value={task.status}
            onChange={(event) => handleStatusChange(event.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {canEdit && !isEditing && (
            <button
              type="button"
              onClick={startEditing}
              className="text-xs text-gray-600 hover:underline"
            >
              Editar
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={handleDeleteTask}
              disabled={deleting}
              className="text-xs text-red-600 hover:underline disabled:opacity-50"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <form
          onSubmit={handleSaveEdit}
          className="mt-4 flex flex-col gap-3 rounded-lg border border-gray-200 p-4"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="edit-title" className="text-sm text-gray-600">
              Título
            </label>
            <input
              id="edit-title"
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
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

          <div className="flex flex-col gap-1">
            <label htmlFor="edit-priority" className="text-sm text-gray-600">
              Prioridad
            </label>
            <select
              id="edit-priority"
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
            >
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="edit-due-date" className="text-sm text-gray-600">
              Fecha límite
            </label>
            <input
              id="edit-due-date"
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">Asignar a</span>
            <div className="flex flex-col gap-1 rounded-md border border-gray-300 p-2">
              {members.map((membership) => (
                <label key={membership.user.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editAssignedTo.includes(membership.user.id)}
                    onChange={(e) =>
                      setEditAssignedTo((current) =>
                        e.target.checked
                          ? [...current, membership.user.id]
                          : current.filter((id) => id !== membership.user.id)
                      )
                    }
                  />
                  <Avatar username={membership.user.username} avatar={membership.user.avatar} size={20} />
                  {membership.user.username}
                </label>
              ))}
              {members.length === 0 && <p className="text-xs text-gray-400">Sin miembros</p>}
            </div>
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
        <>
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
            <span>
              Prioridad: {PRIORITY_LABELS[task.priority] ?? task.priority}
              {task.due_date && ` · Vence ${task.due_date}`}
            </span>
            {task.assigned_to.length > 0 && <AvatarStack users={task.assigned_to} size={22} />}
          </div>

          {task.description && <p className="mt-4 text-gray-700">{task.description}</p>}
        </>
      )}

      <h2 className="mt-8 mb-3 text-lg font-medium">Comentarios</h2>
      <ul className="flex flex-col gap-2">
        {task.comments.map((comment) => (
          <li key={comment.id} className="rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar username={comment.author.username} avatar={comment.author.avatar} size={20} />
                <span className="text-sm font-medium">{comment.author.username}</span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(comment.created_at).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-700">{comment.content}</p>
          </li>
        ))}
        {task.comments.length === 0 && (
          <p className="text-gray-600">Todavía no hay comentarios.</p>
        )}
      </ul>

      <form onSubmit={handleCommentSubmit} className="mt-4 flex flex-col gap-2">
        <textarea
          value={newComment}
          onChange={(event) => setNewComment(event.target.value)}
          placeholder="Escribe un comentario..."
          className="rounded-md border border-gray-300 p-2 text-sm"
          rows={3}
        />
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="self-end rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
        >
          Comentar
        </button>
      </form>
    </div>
  )
}
