import apiClient from './client'
import type { PaginatedResponse } from './types'

export interface Notification {
  id: number
  notification_type: string
  message: string
  related_task: number | null
  related_project: number | null
  is_read: boolean
  created_at: string
}

export async function listNotifications(page = 1) {
  const { data } = await apiClient.get<PaginatedResponse<Notification>>('/notifications/', {
    params: { page },
  })
  return data
}

export async function markRead(id: number) {
  const { data } = await apiClient.patch<Notification>(`/notifications/${id}/mark-read/`)
  return data
}

export async function markAllRead() {
  const { data } = await apiClient.post<{ updated: number }>('/notifications/mark-all-read/')
  return data
}
