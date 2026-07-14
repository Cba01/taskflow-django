import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { listMembers, type Membership } from '../api/projects'
import { createTask, PRIORITY_LABELS } from '../api/tasks'

function extractErrors(data: unknown): string[] {
  if (typeof data !== 'object' || data === null) return ['Algo salió mal. Intentá de nuevo.']
  return Object.values(data as Record<string, string[]>).flat()
}

export default function NewTask() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [members, setMembers] = useState<Membership[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  //Se saca la ID del proyecto por medio de los parametros del url y por medio de eso se saca la lista de los miembros del proyecto
  useEffect(() => {
    if (!id) return
    listMembers(id).then(setMembers)
  }, [id])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!id) return
    setErrors([])
    setIsSubmitting(true)

    try {
      const task = await createTask(id, {
        title,
        description,
        priority,
        due_date: dueDate || null,
        assigned_to_id: assignedTo ? Number(assignedTo) : null,
      })
      navigate(`/projects/${id}/tasks/${task.id}`, { replace: true })
    } catch (err) {
      const response = (err as { response?: { data?: unknown } }).response
      setErrors(extractErrors(response?.data))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to={`/projects/${id}`} className="text-sm text-gray-500 hover:underline">
        &larr; Volver al proyecto
      </Link>

      <form
        onSubmit={handleSubmit}
        className="mt-4 flex max-w-sm flex-col gap-4 rounded-lg border border-gray-200 p-6"
      >
        <h1 className="text-xl font-semibold">Nueva tarea</h1>

        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-sm text-gray-600">
            Título
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-gray-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm text-gray-600">
            Descripción
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-gray-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="priority" className="text-sm text-gray-600">
            Prioridad
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-gray-500"
          >
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="dueDate" className="text-sm text-gray-600">
            Fecha límite
          </label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-gray-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="assignedTo" className="text-sm text-gray-600">
            Asignar a
          </label>
          <select
            id="assignedTo"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-gray-500"
          >
            <option value="">Sin asignar</option>
            {members.map((membership) => (
              <option key={membership.user.id} value={membership.user.id}>
                {membership.user.username}
              </option>
            ))}
          </select>
        </div>

        {errors.map((message) => (
          <p key={message} className="text-sm text-red-600">
            {message}
          </p>
        ))}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-gray-800 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Creando...' : 'Crear tarea'}
        </button>
      </form>
    </div>
  )
}
