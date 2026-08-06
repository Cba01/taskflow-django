import apiClient from './client'

export interface UserProfile {
  id: number
  username: string
  email: string
  avatar: string
  bio: string
  created_at: string
}

export async function getCurrentUser() {
  const { data } = await apiClient.get<UserProfile>('/users/me/')
  return data
}

export interface UpdateProfilePayload {
  username: string
  avatar: string
  bio: string
}

export async function updateCurrentUser(payload: UpdateProfilePayload) {
  const { data } = await apiClient.patch<UserProfile>('/users/me/', payload)
  return data
}
