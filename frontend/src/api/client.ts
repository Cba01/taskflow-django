import axios from 'axios'
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokens'

// Instancia central de axios: todas las llamadas a la API pasan por aquí,
// así el baseURL y el manejo de tokens se configuran una sola vez en vez
// de repetirlo en cada componente que hace un fetch.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Antes de cada request, si hay un access token guardado, lo mandamos en
// el header Authorization. Así los componentes nunca tienen que acordarse
// de hacerlo manualmente.
apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// El access token de SimpleJWT expira rápido (por diseño, para limitar el
// daño si se filtra). Si una request falla con 401, probamos renovarlo con
// el refresh token (que dura más) y reintentamos la request original una
// sola vez. Si el refresh también falla, recién ahí mandamos al usuario
// a loguearse de nuevo.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const alreadyRetried = originalRequest._retry

    if (error.response?.status === 401 && !alreadyRetried) {
      originalRequest._retry = true
      const refreshToken = getRefreshToken()

      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/token/refresh/`,
            { refresh: refreshToken }
          )
          setTokens(data.access, refreshToken)
          originalRequest.headers.Authorization = `Bearer ${data.access}`
          return apiClient(originalRequest)
        } catch {
          clearTokens()
        }
      } else {
        clearTokens()
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
