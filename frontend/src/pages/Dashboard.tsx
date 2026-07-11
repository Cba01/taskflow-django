import { useNavigate } from 'react-router-dom'
import { logout } from '../api/auth'

// Placeholder: acá va a vivir la lista de proyectos/tareas. Por ahora
// solo confirma que el login funcionó y que la ruta está protegida.
export default function Dashboard() {
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">TaskFlow</h1>
      <p className="text-gray-600">Sesión iniciada correctamente.</p>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-md bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
      >
        Cerrar sesión
      </button>
    </div>
  )
}
