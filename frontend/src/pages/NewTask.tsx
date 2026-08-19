import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ListPlus } from 'lucide-react'
import { listMembers, type Membership } from '../api/projects'
import { createTask, PRIORITY_LABELS } from '../api/tasks'
import { Avatar } from '../components/Avatar'
import { CLAY, CLAY_FIELD, CLAY_PANEL, ClayButton, ClayErrorList, ClayField, ClaySelect } from '../components/ui.clay'

function extractErrors(data: unknown): string[] {
  if (typeof data !== 'object' || data === null) return ['Algo salió mal. Inténtalo de nuevo.']
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
  const [assignedTo, setAssignedTo] = useState<number[]>([])
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
        assigned_to_ids: assignedTo,
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
    <>
      <Link
        to={`/projects/${id}`}
        className="clay-surface inline-flex items-center gap-1.5 rounded-2xl border-[3px] border-white bg-white px-3.5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al proyecto
      </Link>

      <form onSubmit={handleSubmit} className={`${CLAY_PANEL} mt-6 flex max-w-sm flex-col gap-4 p-6`}>
          <div className="flex items-center gap-3">
            <div
              className="clay-surface flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-[3px]"
              style={{ backgroundColor: CLAY.sunshine.soft, borderColor: CLAY.sunshine.base, color: CLAY.sunshine.text }}
            >
              <ListPlus className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900">Nueva tarea</h1>
          </div>

          <ClayField label="Título" htmlFor="title">
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={CLAY_FIELD}
            />
          </ClayField>

          <ClayField label="Descripción" htmlFor="description">
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={CLAY_FIELD}
            />
          </ClayField>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-bold text-slate-600">Prioridad</span>
            <ClaySelect
              value={priority}
              onChange={setPriority}
              ariaLabel="Prioridad"
              options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </div>

          <ClayField label="Fecha límite" htmlFor="dueDate">
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
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
                    checked={assignedTo.includes(membership.user.id)}
                    onChange={(e) =>
                      setAssignedTo((current) =>
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

          <ClayErrorList messages={errors} />

          <ClayButton hue="sunshine" type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creando...' : 'Crear tarea'}
          </ClayButton>
        </form>
    </>
  )
}
