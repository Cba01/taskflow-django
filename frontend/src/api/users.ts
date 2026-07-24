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
