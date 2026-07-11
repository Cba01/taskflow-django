import apiClient from './client'

export interface UserSummary {
  id: number
  username: string
  email: string
  avatar: string | null
}

export interface Project {
  id: number
  name: string
  description: string
  owner: UserSummary
  members_count: number
  tasks_count: number
  user_role: string | null
  created_at: string
  updated_at: string
}

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function listProjects() {
  const { data } = await apiClient.get<PaginatedResponse<Project>>('/projects/')
  return data.results
}
