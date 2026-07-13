import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getTask,
  changeTaskStatus,
  createComment,
  STATUS_LABELS,
  PRIORITY_LABELS,
  type Task,
} from '../api/tasks'

export default function TaskDetail() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!projectId || !taskId) return

    getTask(projectId, taskId)
      .then(setTask)
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

  if (loading) return <p className="mx-auto max-w-3xl px-4 py-8 text-gray-600">Cargando...</p>
  if (error) return <p className="mx-auto max-w-3xl px-4 py-8 text-red-600">{error}</p>
  if (!task) return null

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to={`/projects/${projectId}`} className="text-sm text-gray-500 hover:underline">
        &larr; Volver al proyecto
      </Link>

      <div className="mt-4 mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{task.title}</h1>
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
      </div>

      <p className="mb-1 text-sm text-gray-500">
        Prioridad: {PRIORITY_LABELS[task.priority] ?? task.priority}
        {task.assigned_to && ` · Asignada a ${task.assigned_to.username}`}
        {task.due_date && ` · Vence ${task.due_date}`}
      </p>

      {task.description && <p className="mt-4 text-gray-700">{task.description}</p>}

      <h2 className="mt-8 mb-3 text-lg font-medium">Comentarios</h2>
      <ul className="flex flex-col gap-2">
        {task.comments.map((comment) => (
          <li key={comment.id} className="rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{comment.author.username}</span>
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
          placeholder="Escribí un comentario..."
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
