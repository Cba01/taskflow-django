// Guardamos los tokens JWT en localStorage para que sobrevivan a un
// refresh de página (a diferencia de una variable en memoria, que se
// perdería). La contra de localStorage es que es accesible por cualquier
// script (riesgo de XSS) — para este proyecto de aprendizaje es un
// trade-off aceptable frente a la complejidad de cookies httpOnly.
const ACCESS_TOKEN_KEY = 'taskflow_access_token'
const REFRESH_TOKEN_KEY = 'taskflow_refresh_token'

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access)
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}
