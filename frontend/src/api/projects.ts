import apiClient from './client'
import type { PaginatedResponse } from './types'

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

export interface Membership {
  id: number
  user: UserSummary
  role: string
  joined_at: string
}

export async function listProjects(page = 1) {
  const { data } = await apiClient.get<PaginatedResponse<Project>>('/projects/', {
    params: { page },
  })
  return data
}

export async function getProject(id: string) {
  const { data } = await apiClient.get<Project>(`/projects/${id}/`)
  return data
}

export async function listMembers(id: string) {
  const { data } = await apiClient.get<Membership[]>(`/projects/${id}/members/`)
  return data
}

export async function createProject(name: string, description: string) {
  const { data } = await apiClient.post<Project>('/projects/', { name, description })
  return data
}
