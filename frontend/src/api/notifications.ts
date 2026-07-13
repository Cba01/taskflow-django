import apiClient from './client'

export interface Notification {
  id: number
  notification_type: string
  message: string
  related_task: number | null
  related_project: number | null
  is_read: boolean
  created_at: string
}

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function listNotifications() {
  const { data } = await apiClient.get<PaginatedResponse<Notification>>('/notifications/')
  return data.results
}

export async function markRead(id: number) {
  const { data } = await apiClient.patch<Notification>(`/notifications/${id}/mark-read/`)
  return data
}

export async function markAllRead() {
  const { data } = await apiClient.post<{ updated: number }>('/notifications/mark-all-read/')
  return data
}
