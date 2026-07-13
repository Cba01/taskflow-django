import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listNotifications, markRead, markAllRead, type Notification } from '../api/notifications'

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
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listNotifications()
      .then(setNotifications)
      .catch(() => setError('No se pudieron cargar las notificaciones.'))
      .finally(() => setLoading(false))
  }, [])

  function handleClick(notification: Notification) {
    if (!notification.is_read) {
      markRead(notification.id).then((updated) => {
        setNotifications((current) =>
          current.map((item) => (item.id === updated.id ? updated : item))
        )
      })
    }

    const link = linkFor(notification)
    if (link) navigate(link)
  }

  function handleMarkAllRead() {
    markAllRead().then(() => {
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })))
    })
  }

  const hasUnread = notifications.some((item) => !item.is_read)

  if (loading) return <p className="mx-auto max-w-3xl px-4 py-8 text-gray-600">Cargando...</p>
  if (error) return <p className="mx-auto max-w-3xl px-4 py-8 text-red-600">{error}</p>

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="text-sm text-gray-500 hover:underline">
        &larr; Volver a mis proyectos
      </Link>

      <div className="mt-4 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notificaciones</h1>
        {hasUnread && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-sm text-gray-500 hover:underline"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {notifications.length === 0 && (
        <p className="text-gray-600">No tenés notificaciones.</p>
      )}

      <ul className="flex flex-col gap-2">
        {notifications.map((notification) => (
          <li
            key={notification.id}
            onClick={() => handleClick(notification)}
            className={`cursor-pointer rounded-lg border border-gray-200 p-3 hover:border-gray-300 ${
              notification.is_read ? 'bg-white' : 'bg-gray-50 font-medium'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{notification.message}</span>
              {!notification.is_read && (
                <span className="h-2 w-2 rounded-full bg-gray-800" />
              )}
            </div>
            <p className="mt-1 text-xs font-normal text-gray-400">
              {new Date(notification.created_at).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
