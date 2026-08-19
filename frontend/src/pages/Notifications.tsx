import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, CheckCheck } from 'lucide-react'
import { listNotifications, markRead, markAllRead, type Notification } from '../api/notifications'
import type { PaginatedResponse } from '../api/types'
import {
  CLAY,
  CLAY_CARD,
  ClayButton,
  ClayErrorBanner,
  ClayPageLoading,
  ClayPagination,
} from '../components/ui.clay'

function linkFor(notification: Notification) {
  if (notification.related_project && notification.related_task) {
    return `/projects/${notification.related_project}/tasks/${notification.related_task}`
  }
  if (notification.related_project) {
    return `/projects/${notification.related_project}`
  }
  return null
}

export default function Notifications() {
  const navigate = useNavigate()
  const [response, setResponse] = useState<PaginatedResponse<Notification> | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function fetchNotifications() {
    setError(null)
    setLoading(true)
    listNotifications(page)
      .then(setResponse)
      .catch(() => setError('No se pudieron cargar las notificaciones.'))
      .finally(() => setLoading(false))
  }

  useEffect(fetchNotifications, [page])

  const notifications = response?.results ?? []

  function handleClick(notification: Notification) {
    if (!notification.is_read) {
      markRead(notification.id).then((updated) => {
        setResponse((current) =>
          current
            ? {
                ...current,
                results: current.results.map((item) =>
                  item.id === updated.id ? updated : item
                ),
              }
            : current
        )
      })
    }

    const link = linkFor(notification)
    if (link) navigate(link)
  }

  function handleMarkAllRead() {
    markAllRead().then(() => {
      setResponse((current) =>
        current
          ? { ...current, results: current.results.map((item) => ({ ...item, is_read: true })) }
          : current
      )
    })
  }

  const hasUnread = notifications.some((item) => !item.is_read)

  if (loading) return <ClayPageLoading />

  return (
    <div className="max-w-3xl">
      <Link
        to="/"
        className="clay-surface inline-flex items-center gap-1.5 rounded-2xl border-[3px] border-white bg-white px-3.5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a mis proyectos
      </Link>

        <div className="mt-6 mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Notificaciones</h1>
          {hasUnread && (
            <ClayButton hue="mint" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Marcar todas como leídas
            </ClayButton>
          )}
        </div>

        {error && <ClayErrorBanner message={error} onRetry={fetchNotifications} />}

        {!error && notifications.length === 0 && (
          <div className={`${CLAY_CARD} flex flex-col items-center gap-3 px-4 py-12 text-center`}>
            <Bell className="h-8 w-8 text-slate-400" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-500">No tienes notificaciones.</p>
          </div>
        )}

        {!error && notifications.length > 0 && (
          <ul className="flex flex-col gap-2.5">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => handleClick(notification)}
                  className={`${CLAY_CARD} flex w-full items-start justify-between gap-3 p-4 text-left`}
                  style={
                    notification.is_read
                      ? undefined
                      : { backgroundColor: CLAY.violet.soft, borderColor: CLAY.violet.base }
                  }
                >
                  <div>
                    <p className={`text-sm text-slate-800 ${notification.is_read ? 'font-medium' : 'font-bold'}`}>
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <span
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: CLAY.violet.base }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

      {response && <ClayPagination page={page} onPageChange={setPage} response={response} />}
    </div>
  )
}
