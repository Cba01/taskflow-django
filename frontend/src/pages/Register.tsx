import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { register } from '../api/auth'
import { CLAY, CLAY_FIELD, CLAY_PANEL, ClayButton, ClayErrorList, ClayField } from '../components/ui.clay'

// El backend devuelve errores de validación como { campo: ["mensaje", ...] }.
// Esta función los aplana a una sola lista de strings para mostrarlos todos.
function extractErrors(data: unknown): string[] {
  if (typeof data !== 'object' || data === null) return ['Algo salió mal. Inténtalo de nuevo.']
  return Object.values(data as Record<string, string[]>).flat()
}

export default function Register() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrors([])
    setIsSubmitting(true)

    try {
      await register(username, email, password)
      navigate('/', { replace: true })
    } catch (err) {
      const response = (err as { response?: { data?: unknown } }).response
      setErrors(extractErrors(response?.data))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="clay-canvas flex min-h-screen items-center justify-center p-4 font-sans text-slate-800">
      <form onSubmit={handleSubmit} className={`${CLAY_PANEL} flex w-full max-w-sm flex-col gap-5 p-7`}>
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div
            className="clay-surface flex h-14 w-14 items-center justify-center rounded-[18px] border-[3px]"
            style={{ backgroundColor: CLAY.sunshine.soft, borderColor: CLAY.sunshine.base, color: CLAY.sunshine.text }}
          >
            <UserPlus className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Crear cuenta</h1>
          <p className="text-sm font-medium text-slate-500">Empieza a organizar tus proyectos.</p>
        </div>

        <ClayField label="Usuario" htmlFor="username">
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            className={CLAY_FIELD}
          />
        </ClayField>

        <ClayField label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={CLAY_FIELD}
          />
        </ClayField>

        <ClayField label="Contraseña" htmlFor="password">
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={CLAY_FIELD}
          />
        </ClayField>

        <ClayErrorList messages={errors} />

        <ClayButton hue="sunshine" type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
        </ClayButton>

        <p className="text-center text-sm font-medium text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-bold" style={{ color: CLAY.violet.text }}>
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  )
}
