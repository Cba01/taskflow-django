import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { getCurrentUser, updateCurrentUser, type UserProfile } from '../api/users'
import { Avatar } from '../components/Avatar'
import {
  CLAY_CARD,
  CLAY_FIELD,
  CLAY_PANEL,
  ClayButton,
  ClayErrorBanner,
  ClayErrorList,
  ClayField,
  ClayPageLoading,
} from '../components/ui.clay'

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

  function fetchProfile() {
    setError(null)
    setLoading(true)
    getCurrentUser()
      .then(setProfile)
      .catch(() => setError('No se pudo cargar el perfil.'))
      .finally(() => setLoading(false))
  }

  useEffect(fetchProfile, [])

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

  if (loading) return <ClayPageLoading />

  return (
    <div className="clay-canvas min-h-screen font-sans text-slate-800">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link
          to="/"
          className="clay-surface inline-flex items-center gap-1.5 rounded-2xl border-[3px] border-white bg-white px-3.5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a mis proyectos
        </Link>

        {error && (
          <div className="mt-6">
            <ClayErrorBanner message={error} onRetry={fetchProfile} />
          </div>
        )}

        {profile && (
          <>
            <div className="mt-6 mb-6 flex items-center justify-between gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Mi perfil</h1>
              {!isEditing && (
                <ClayButton hue="sky" size="sm" onClick={startEditing}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  Editar
                </ClayButton>
              )}
            </div>

            <div className={`${CLAY_CARD} flex items-center gap-4 p-5`}>
              <Avatar username={profile.username} avatar={profile.avatar} size={64} />
              <div className="min-w-0">
                <p className="truncate text-lg font-extrabold text-slate-900">{profile.username}</p>
                <p className="truncate text-sm font-medium text-slate-500">{profile.email}</p>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveEdit} className={`${CLAY_PANEL} mt-4 flex flex-col gap-4 p-6`}>
                <ClayField label="Nombre de usuario" htmlFor="edit-username">
                  <input
                    id="edit-username"
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    required
                    className={CLAY_FIELD}
                  />
                </ClayField>

                <ClayField label="URL del avatar" htmlFor="edit-avatar">
                  <input
                    id="edit-avatar"
                    type="url"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="https://..."
                    className={CLAY_FIELD}
                  />
                </ClayField>

                <ClayField label="Bio" htmlFor="edit-bio" hint={`${editBio.length}/300`}>
                  <textarea
                    id="edit-bio"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    maxLength={300}
                    className={CLAY_FIELD}
                  />
                </ClayField>

                <ClayErrorList messages={editErrors} />

                <div className="flex gap-2">
                  <ClayButton hue="mint" type="submit" disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar'}
                  </ClayButton>
                  <ClayButton hue="stone" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </ClayButton>
                </div>
              </form>
            ) : (
              <p className="mt-4 text-sm font-medium text-slate-700">
                {profile.bio || <span className="text-slate-400">Todavía no agregaste una bio.</span>}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
