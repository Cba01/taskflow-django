import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, FolderPlus } from 'lucide-react'
import { createProject } from '../api/projects'
import { CLAY, CLAY_FIELD, CLAY_PANEL, ClayButton, ClayErrorList, ClayField } from '../components/ui.clay'

function extractErrors(data: unknown): string[] {
  if (typeof data !== 'object' || data === null) return ['Algo salió mal. Inténtalo de nuevo.']
  return Object.values(data as Record<string, string[]>).flat()
}

export default function NewProject() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors([])
    setIsSubmitting(true)

    try {
      const project = await createProject(name, description)
      navigate(`/projects/${project.id}`, { replace: true })
    } catch (err) {
      const response = (err as { response?: { data?: unknown } }).response
      setErrors(extractErrors(response?.data))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="clay-canvas min-h-screen font-sans text-slate-800">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link
          to="/"
          className="clay-surface inline-flex items-center gap-1.5 rounded-2xl border-[3px] border-white bg-white px-3.5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a mis proyectos
        </Link>

        <form onSubmit={handleSubmit} className={`${CLAY_PANEL} mt-6 flex max-w-sm flex-col gap-4 p-6`}>
          <div className="flex items-center gap-3">
            <div
              className="clay-surface flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-[3px]"
              style={{ backgroundColor: CLAY.sunshine.soft, borderColor: CLAY.sunshine.base, color: CLAY.sunshine.text }}
            >
              <FolderPlus className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900">Nuevo proyecto</h1>
          </div>

          <ClayField label="Nombre" htmlFor="name">
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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

          <ClayErrorList messages={errors} />

          <ClayButton hue="sunshine" type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Creando...' : 'Crear proyecto'}
          </ClayButton>
        </form>
      </div>
    </div>
  )
}
