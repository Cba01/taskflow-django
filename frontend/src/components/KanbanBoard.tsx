import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  listAllTasks,
  changeTaskStatus,
  STATUS_LABELS,
  PRIORITY_LABELS,
  type TaskListItem,
  type TaskFilters,
} from '../api/tasks'
import { AvatarStack } from './Avatar'

const COLUMNS = ['todo', 'in_progress', 'done']

interface KanbanBoardProps {
  projectId: string
  filters: TaskFilters
}

export default function KanbanBoard({ projectId, filters }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<TaskListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null)

  // Los filtros se recrean como objeto nuevo en cada render del padre;
  // comparamos su contenido serializado para no volver a pedir las
  // tareas cuando en realidad no cambiaron.
  const filtersKey = JSON.stringify(filters)

  useEffect(() => {
    setLoading(true)
    listAllTasks(projectId, filters)
      .then(setTasks)
      .catch(() => setError('No se pudieron cargar las tareas.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, filtersKey])

  async function handleDrop(newStatus: string) {
    if (draggedTaskId === null) return
    const taskId = draggedTaskId
    setDraggedTaskId(null)

    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return

    const previousTasks = tasks
    setTasks((current) => current.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)))

    try {
      await changeTaskStatus(projectId, String(taskId), newStatus)
    } catch {
      setTasks(previousTasks)
      setError('No se pudo mover la tarea.')
    }
  }

  if (loading) return <p className="text-gray-600">Cargando...</p>
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {COLUMNS.map((columnStatus) => {
        const columnTasks = tasks.filter((task) => task.status === columnStatus)
        return (
          <div
            key={columnStatus}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(columnStatus)}
            className="flex min-h-32 flex-col gap-2 rounded-lg bg-gray-50 p-3"
          >
            <h3 className="mb-1 text-sm font-medium text-gray-600">
              {STATUS_LABELS[columnStatus]} ({columnTasks.length})
            </h3>

            {columnTasks.map((task) => (
              <Link
                key={task.id}
                to={`/projects/${projectId}/tasks/${task.id}`}
                draggable
                onDragStart={() => setDraggedTaskId(task.id)}
                className="block cursor-grab rounded-lg border border-gray-200 bg-white p-3 hover:border-gray-300"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{task.title}</p>
                  <AvatarStack users={task.assigned_to} size={18} />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {PRIORITY_LABELS[task.priority] ?? task.priority}
                  {task.due_date && ` · Vence ${task.due_date}`}
                </p>
              </Link>
            ))}

            {columnTasks.length === 0 && <p className="text-xs text-gray-400">Sin tareas</p>}
          </div>
        )
      })}
    </div>
  )
}
