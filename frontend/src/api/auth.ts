import apiClient from './client'
import { setTokens, clearTokens, getAccessToken } from './tokens'

// El User de Django usa 'email' como USERNAME_FIELD (ver
// backend/apps/users/models.py), por eso TokenObtainPairView espera
// 'email' y no 'username' en el body.
export async function login(email: string, password: string) {
  const { data } = await apiClient.post('/auth/token/', { email, password })
  setTokens(data.access, data.refresh)
}

// El endpoint de registro no devuelve tokens (solo confirma username/email),
// así que después de crear la cuenta hay que loguearse con esas mismas
// credenciales para conseguir el access/refresh token.
export async function register(username: string, email: string, password: string) {
  await apiClient.post('/auth/register/', { username, email, password })
  await login(email, password)
}

export function logout() {
  clearTokens()
}

export function isAuthenticated() {
  return Boolean(getAccessToken())
}
