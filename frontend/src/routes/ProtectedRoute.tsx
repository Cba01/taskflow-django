import { Navigate, Outlet } from 'react-router-dom'
import { isAuthenticated } from '../api/auth'
import AppShell from '../components/AppShell'

// Envuelve rutas que requieren sesión iniciada. <Outlet /> renderiza la
// ruta hija cuando hay token guardado; si no, redirige a /login. Esto
// centraliza el chequeo en un solo lugar en vez de repetirlo en cada
// página protegida. AppShell (sidebar + fondo + columna de contenido)
// también se centraliza acá: cada página protegida solo devuelve su
// contenido, no su propio wrapper de página.
export default function ProtectedRoute() {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
