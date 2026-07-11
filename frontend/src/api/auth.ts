import apiClient from './client'
import { setTokens, clearTokens, getAccessToken } from './tokens'

// El User de Django usa 'email' como USERNAME_FIELD (ver
// backend/apps/users/models.py), por eso TokenObtainPairView espera
// 'email' y no 'username' en el body.
export async function login(email: string, password: string) {
  const { data } = await apiClient.post('/auth/token/', { email, password })
  setTokens(data.access, data.refresh)
}

export function logout() {
  clearTokens()
}

export function isAuthenticated() {
  return Boolean(getAccessToken())
}
