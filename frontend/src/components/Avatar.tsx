interface AvatarProps {
  username: string
  avatar?: string | null
  size?: number
  className?: string
}

export function Avatar({ username, avatar, size = 32, className = '' }: AvatarProps) {
  const dimension = `${size}px`

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={username}
        title={username}
        style={{ width: dimension, height: dimension }}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <div
      title={username}
      style={{ width: dimension, height: dimension, fontSize: size * 0.4 }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-slate-200 font-medium text-slate-600 ${className}`}
    >
      {username.charAt(0).toUpperCase()}
    </div>
  )
}

interface AvatarUser {
  id: number
  username: string
  avatar: string | null
}

interface AvatarStackProps {
  users: AvatarUser[]
  size?: number
  max?: number
}

// Fila de avatares superpuestos con contador "+N" para los que no
// entran — patrón común para mostrar varios asignados en poco espacio.
export function AvatarStack({ users, size = 24, max = 3 }: AvatarStackProps) {
  if (users.length === 0) return null

  const visible = users.slice(0, max)
  const overflow = users.length - visible.length

  return (
    <div className="flex -space-x-2">
      {visible.map((user) => (
        <Avatar
          key={user.id}
          username={user.username}
          avatar={user.avatar}
          size={size}
          className="border-2 border-white"
        />
      ))}
      {overflow > 0 && (
        <div
          style={{ width: size, height: size, fontSize: size * 0.35 }}
          className="flex shrink-0 items-center justify-center rounded-full border-2 border-white bg-slate-300 font-medium text-slate-600"
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
