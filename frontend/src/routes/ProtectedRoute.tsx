import { Navigate, Outlet } from 'react-router-dom'
import { isAuthenticated } from '../api/auth'

// Envuelve rutas que requieren sesión iniciada. <Outlet /> renderiza la
// ruta hija cuando hay token guardado; si no, redirige a /login. Esto
// centraliza el chequeo en un solo lugar en vez de repetirlo en cada
// página protegida.
export default function ProtectedRoute() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />
}
