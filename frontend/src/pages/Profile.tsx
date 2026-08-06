import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentUser, updateCurrentUser, type UserProfile } from '../api/users'
import { Avatar } from '../components/Avatar'

function extractErrors(data: unknown): string[] {
  if (typeof data !== 'object' || data === null) return ['Algo salió mal. Inténtalo de nuevo.']
  return Object.values(data as Record<string, string[] | string>).flat()
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editErrors, setEditErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getCurrentUser()
      .then(setProfile)
      .catch(() => setError('No se pudo cargar el perfil.'))
      .finally(() => setLoading(false))
  }, [])

  function startEditing() {
    if (!profile) return
    setEditUsername(profile.username)
    setEditAvatar(profile.avatar)
    setEditBio(profile.bio)
    setEditErrors([])
    setIsEditing(true)
  }

  async function handleSaveEdit(event: FormEvent) {
    event.preventDefault()
    setEditErrors([])
    setSaving(true)

    try {
      const updated = await updateCurrentUser({
        username: editUsername,
        avatar: editAvatar,
        bio: editBio,
      })
      setProfile(updated)
      setIsEditing(false)
    } catch (err) {
      const response = (err as { response?: { data?: unknown } }).response
      setEditErrors(extractErrors(response?.data))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="mx-auto max-w-3xl px-4 py-8 text-gray-600">Cargando...</p>
  if (error) return <p className="mx-auto max-w-3xl px-4 py-8 text-red-600">{error}</p>
  if (!profile) return null

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="text-sm text-gray-500 hover:underline">
        &larr; Volver a mis proyectos
      </Link>

      <div className="mt-4 mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mi perfil</h1>
        {!isEditing && (
          <button
            type="button"
            onClick={startEditing}
            className="text-xs text-gray-600 hover:underline"
          >
            Editar
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Avatar username={profile.username} avatar={profile.avatar} size={64} />
        <div>
          <p className="text-lg font-medium">{profile.username}</p>
          <p className="text-sm text-gray-500">{profile.email}</p>
        </div>
      </div>

      {isEditing ? (
        <form
          onSubmit={handleSaveEdit}
          className="mt-6 flex flex-col gap-3 rounded-lg border border-gray-200 p-4"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="edit-username" className="text-sm text-gray-600">
              Nombre de usuario
            </label>
            <input
              id="edit-username"
              type="text"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              required
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="edit-avatar" className="text-sm text-gray-600">
              URL del avatar
            </label>
            <input
              id="edit-avatar"
              type="url"
              value={editAvatar}
              onChange={(e) => setEditAvatar(e.target.value)}
              placeholder="https://..."
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="edit-bio" className="text-sm text-gray-600">
              Bio
            </label>
            <textarea
              id="edit-bio"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              rows={3}
              maxLength={300}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
            />
            <span className="text-xs text-gray-400">{editBio.length}/300</span>
          </div>

          {editErrors.map((message) => (
            <p key={message} className="text-sm text-red-600">
              {message}
            </p>
          ))}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:border-gray-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-6 text-gray-700">
          {profile.bio || <span className="text-gray-400">Todavía no agregaste una bio.</span>}
        </p>
      )}
    </div>
  )
}
