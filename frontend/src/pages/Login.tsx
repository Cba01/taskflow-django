import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, Sparkles } from 'lucide-react'
import { login } from '../api/auth'
import { CLAY, CLAY_FIELD, CLAY_PANEL, ClayButton, ClayErrorList, ClayField } from '../components/ui.clay'

// Credenciales públicas a propósito: es la cuenta demo del portafolio,
// no una cuenta real — así un reclutador puede entrar sin tener que
// registrarse con su propio email. Tiene que coincidir con
// backend/apps/core/management/commands/seed_demo_data.py.
const DEMO_EMAIL = 'demo@taskflow.dev'
const DEMO_PASSWORD = 'demo1234'

export default function Login() {
  const navigate = useNavigate()

  // Estado local del formulario. Para un formulario de dos campos no hace
  // falta una librería de forms (react-hook-form, etc.) — eso se justifica
  // recién cuando hay muchos campos o validaciones complejas.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function fillDemoCredentials() {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch {
      // No distinguimos "usuario no existe" de "contraseña incorrecta":
      // decirle al atacante cuál de las dos falló facilita adivinar
      // usuarios válidos por fuerza bruta.
      setError('Email o contraseña incorrectos.')
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
            style={{ backgroundColor: CLAY.violet.soft, borderColor: CLAY.violet.base, color: CLAY.violet.text }}
          >
            <LogIn className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Iniciar sesión</h1>
          <p className="text-sm font-medium text-slate-500">Ingresa a tus proyectos de TaskFlow.</p>
        </div>

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
            autoComplete="current-password"
            className={CLAY_FIELD}
          />
        </ClayField>

        {error && <ClayErrorList messages={[error]} />}

        <ClayButton hue="violet" type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Ingresando...' : 'Ingresar'}
        </ClayButton>

        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-bold text-slate-400">o</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <ClayButton hue="stone" type="button" onClick={fillDemoCredentials} className="w-full">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Probar con cuenta demo
        </ClayButton>

        <p className="text-center text-sm font-medium text-slate-500">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-bold" style={{ color: CLAY.violet.text }}>
            Regístrate
          </Link>
        </p>
      </form>
    </div>
  )
}
