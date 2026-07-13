import apiClient from './client'
import type { UserSummary } from './projects'

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
