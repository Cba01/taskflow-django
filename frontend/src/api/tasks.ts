import apiClient from './client'
import type { UserSummary } from './projects'

export const STATUS_LABELS: Record<string, string> = {
  todo: 'Pendiente',
  in_progress: 'En progreso',
  done: 'Completada',
}

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
}

export interface TaskListItem {
  id: number
  title: string
  status: string
  priority: string
  due_date: string | null
  assigned_to: UserSummary | null
  comments_count: number
  created_at: string
}

export interface Comment {
  id: number
  author: UserSummary
  content: string
  created_at: string
}

export interface Task {
  id: number
  title: string
  description: string
  status: string
  priority: string
  due_date: string | null
  project: number
  created_by: UserSummary
  assigned_to: UserSummary | null
  comments: Comment[]
  comments_count: number
  created_at: string
  updated_at: string
}

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function listTasks(projectId: string) {
  const { data } = await apiClient.get<PaginatedResponse<TaskListItem>>(
    `/projects/${projectId}/tasks/`
  )
  return data.results
}

export async function getTask(projectId: string, taskId: string) {
  const { data } = await apiClient.get<Task>(`/projects/${projectId}/tasks/${taskId}/`)
  return data
}

export async function changeTaskStatus(projectId: string, taskId: string, status: string) {
  const { data } = await apiClient.patch<Task>(
    `/projects/${projectId}/tasks/${taskId}/change-status/`,
    { status }
  )
  return data
}

export async function createComment(projectId: string, taskId: string, content: string) {
  const { data } = await apiClient.post<Comment>(
    `/projects/${projectId}/tasks/${taskId}/comments/`,
    { content }
  )
  return data
}
