import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Pencil, Send, Trash2 } from 'lucide-react'
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
import {
  CLAY_CARD,
  CLAY_FIELD,
  CLAY_PANEL,
  ClayBadge,
  ClayButton,
  ClayConfirmDialog,
  ClayErrorBanner,
  ClayErrorList,
  ClayField,
  ClayPageLoading,
  ClaySelect,
  PRIORITY_HUE,
  STATUS_HUE,
} from '../components/ui.clay'

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
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  function fetchTask() {
    if (!projectId || !taskId) return
    setError(null)
    setLoading(true)

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
  }

  useEffect(fetchTask, [projectId, taskId])

  function handleStatusChange(newStatus: string) {
    if (!projectId || !taskId) return

    changeTaskStatus(projectId, taskId, newStatus).then(setTask)
  }

  function handleCommentSubmit(event: FormEvent) {
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

    setDeleting(true)
    try {
      await deleteTask(projectId, taskId)
      navigate(`/projects/${projectId}`, { replace: true })
    } catch {
      setError('No se pudo eliminar la tarea.')
      setDeleting(false)
      setConfirmDeleteOpen(false)
    }
  }

  if (loading) return <ClayPageLoading />

  if (error) {
    return (
      <div className="clay-canvas min-h-screen font-sans text-slate-800">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Link
            to={projectId ? `/projects/${projectId}` : '/'}
            className="clay-surface inline-flex items-center gap-1.5 rounded-2xl border-[3px] border-white bg-white px-3.5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al proyecto
          </Link>
          <div className="mt-6">
            <ClayErrorBanner message={error} onRetry={fetchTask} />
          </div>
        </div>
      </div>
    )
  }

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
    <div className="clay-canvas min-h-screen font-sans text-slate-800">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link
          to={`/projects/${projectId}`}
          className="clay-surface inline-flex items-center gap-1.5 rounded-2xl border-[3px] border-white bg-white px-3.5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al proyecto
        </Link>

        <div className="mt-6 mb-4 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{task.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <ClaySelect
              value={task.status}
              onChange={handleStatusChange}
              hue={STATUS_HUE[task.status] ?? 'stone'}
              ariaLabel="Estado de la tarea"
              className="w-44"
              options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
            />
            {canEdit && !isEditing && (
              <ClayButton hue="sky" size="sm" onClick={startEditing}>
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                Editar
              </ClayButton>
            )}
            {canDelete && (
              <ClayButton hue="rose" size="sm" onClick={() => setConfirmDeleteOpen(true)} disabled={deleting}>
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </ClayButton>
            )}
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveEdit} className={`${CLAY_PANEL} mb-6 flex flex-col gap-4 p-5`}>
            <ClayField label="Título" htmlFor="edit-title">
              <input
                id="edit-title"
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className={CLAY_FIELD}
              />
            </ClayField>

            <ClayField label="Descripción" htmlFor="edit-description">
              <textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className={CLAY_FIELD}
              />
            </ClayField>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-slate-600">Prioridad</span>
              <ClaySelect
                value={editPriority}
                onChange={setEditPriority}
                ariaLabel="Prioridad"
                options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </div>

            <ClayField label="Fecha límite" htmlFor="edit-due-date">
              <input
                id="edit-due-date"
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className={CLAY_FIELD}
              />
            </ClayField>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-slate-600">Asignar a</span>
              <div className={`${CLAY_PANEL} flex flex-col gap-0.5 p-1.5`}>
                {members.map((membership) => (
                  <label
                    key={membership.user.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm font-medium text-slate-800 transition-colors duration-150 hover:bg-slate-50"
                  >
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
                      className="h-4 w-4 rounded border-2 border-slate-300 accent-violet-400"
                    />
                    <Avatar username={membership.user.username} avatar={membership.user.avatar} size={20} />
                    {membership.user.username}
                  </label>
                ))}
                {members.length === 0 && <p className="px-2 py-1.5 text-xs font-medium text-slate-400">Sin miembros</p>}
              </div>
            </div>

            <ClayErrorList messages={editErrors} />

            <div className="flex gap-2">
              <ClayButton hue="mint" type="submit" disabled={savingEdit}>
                {savingEdit ? 'Guardando...' : 'Guardar'}
              </ClayButton>
              <ClayButton hue="stone" onClick={() => setIsEditing(false)}>
                Cancelar
              </ClayButton>
            </div>
          </form>
        ) : (
          <div className={`${CLAY_CARD} mb-6 p-5`}>
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
              <ClayBadge hue={PRIORITY_HUE[task.priority] ?? 'stone'}>
                {PRIORITY_LABELS[task.priority] ?? task.priority}
              </ClayBadge>
              {task.due_date && <span>Vence {task.due_date}</span>}
              {task.assigned_to.length > 0 && <AvatarStack users={task.assigned_to} size={22} />}
            </div>
            {task.description && <p className="mt-4 text-sm font-medium text-slate-700">{task.description}</p>}
          </div>
        )}

        <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-slate-800">
          <MessageSquare className="h-4 w-4 text-slate-400" aria-hidden="true" />
          Comentarios
        </h2>
        <ul className="flex flex-col gap-2.5">
          {task.comments.map((comment) => (
            <li key={comment.id} className={`${CLAY_CARD} p-3.5`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Avatar username={comment.author.username} avatar={comment.author.avatar} size={20} />
                  <span className="text-sm font-bold text-slate-800">{comment.author.username}</span>
                </div>
                <span className="text-xs font-medium text-slate-400">
                  {new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-medium text-slate-700">{comment.content}</p>
            </li>
          ))}
          {task.comments.length === 0 && (
            <div className={`${CLAY_CARD} px-4 py-8 text-center`}>
              <p className="text-sm font-semibold text-slate-500">Todavía no hay comentarios.</p>
            </div>
          )}
        </ul>

        <form onSubmit={handleCommentSubmit} className="mt-4 flex flex-col gap-2">
          <textarea
            value={newComment}
            onChange={(event) => setNewComment(event.target.value)}
            placeholder="Escribe un comentario..."
            className={CLAY_FIELD}
            rows={3}
          />
          <ClayButton hue="sunshine" type="submit" disabled={submitting || !newComment.trim()} className="self-end">
            <Send className="h-4 w-4" aria-hidden="true" />
            Comentar
          </ClayButton>
        </form>
      </div>

      <ClayConfirmDialog
        open={confirmDeleteOpen}
        title="¿Eliminar esta tarea?"
        description="Esta acción no se puede deshacer."
        pending={deleting}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteTask}
      />
    </div>
  )
}
