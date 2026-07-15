import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createProject } from '../api/projects'

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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="text-sm text-gray-500 hover:underline">
        &larr; Volver a mis proyectos
      </Link>

      <form
        onSubmit={handleSubmit}
        className="mt-4 flex max-w-sm flex-col gap-4 rounded-lg border border-gray-200 p-6"
      >
        <h1 className="text-xl font-semibold">Nuevo proyecto</h1>

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm text-gray-600">
            Nombre
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
          {isSubmitting ? 'Creando...' : 'Crear proyecto'}
        </button>
      </form>
    </div>
  )
}
