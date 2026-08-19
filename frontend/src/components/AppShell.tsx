import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, LayoutDashboard, LogOut, Menu, User, X } from 'lucide-react'
import { logout } from '../api/auth'
import { getUnreadCount } from '../api/notifications'
import { CLAY } from './ui.clay'

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard },
  { to: '/notifications', label: 'Notificaciones', icon: Bell },
  { to: '/profile', label: 'Mi perfil', icon: User },
] as const

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span
      className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white"
      style={{ backgroundColor: CLAY.rose.base }}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

function NavLinks({
  pathname,
  unreadCount,
  onNavigate,
}: {
  pathname: string
  unreadCount: number
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-col gap-1.5">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
        const active = pathname === to
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-2xl border-[3px] border-transparent px-3.5 py-2.5 text-sm font-bold text-slate-500 transition-colors duration-150 hover:text-slate-800"
            style={active ? { backgroundColor: CLAY.violet.soft, borderColor: CLAY.violet.base, color: CLAY.violet.text } : undefined}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            {label}
            {to === '/notifications' && <UnreadBadge count={unreadCount} />}
          </Link>
        )
      })}
    </nav>
  )
}

function BrandMark({ size = 10 }: { size?: 9 | 10 }) {
  return (
    <div
      className={`clay-surface flex ${size === 9 ? 'h-9 w-9' : 'h-10 w-10'} shrink-0 items-center justify-center rounded-2xl border-[3px]`}
      style={{ backgroundColor: CLAY.sunshine.soft, borderColor: CLAY.sunshine.base, color: CLAY.sunshine.text }}
    >
      <LayoutDashboard className={size === 9 ? 'h-4.5 w-4.5' : 'h-5 w-5'} aria-hidden="true" />
    </div>
  )
}

// Shell persistente de toda la app autenticada: sidebar fija en desktop
// (nav + logout) y drawer deslizable en mobile, en vez de que cada
// página repita sus propios botones de "Mi perfil"/"Notificaciones"/
// "Cerrar sesión" arriba de un contenido apilado y centrado. El
// contenido de cada página ya no necesita dibujar su propio fondo
// clay-canvas ni su propia columna centrada: eso vive acá.
export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    getUnreadCount().then(setUnreadCount).catch(() => {})
  }, [location.pathname])

  useEffect(() => {
    if (!mobileOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="clay-canvas min-h-screen font-sans text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r-[3px] border-white/70 bg-white/40 px-4 py-6 md:flex">
        <Link to="/" className="mb-8 flex items-center gap-2.5 px-1">
          <BrandMark />
          <span className="text-lg font-extrabold tracking-tight text-slate-900">TaskFlow</span>
        </Link>

        <NavLinks pathname={location.pathname} unreadCount={unreadCount} />

        <button
          type="button"
          onClick={handleLogout}
          className="mt-auto flex cursor-pointer items-center gap-3 rounded-2xl border-[3px] border-transparent px-3.5 py-2.5 text-left text-sm font-bold text-slate-500 transition-colors duration-150 hover:text-rose-600"
        >
          <LogOut className="h-4.5 w-4.5" aria-hidden="true" />
          Cerrar sesión
        </button>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b-[3px] border-white/70 bg-[#fbf9f5]/90 px-4 py-3 backdrop-blur-sm md:hidden">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandMark size={9} />
          <span className="text-base font-extrabold tracking-tight text-slate-900">TaskFlow</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          className="clay-surface relative flex h-10 w-10 items-center justify-center rounded-2xl border-[3px] border-white bg-white text-slate-600"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white"
              style={{ backgroundColor: CLAY.rose.base }}
              aria-hidden="true"
            />
          )}
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="clay-enter relative flex h-full w-72 max-w-[80vw] flex-col border-r-[3px] border-white bg-[#fbf9f5] px-4 py-6">
            <div className="mb-6 flex items-center justify-between px-1">
              <span className="text-lg font-extrabold tracking-tight text-slate-900">TaskFlow</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar menú"
                className="clay-surface flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-white text-slate-500"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <NavLinks pathname={location.pathname} unreadCount={unreadCount} onNavigate={() => setMobileOpen(false)} />

            <button
              type="button"
              onClick={handleLogout}
              className="mt-auto flex cursor-pointer items-center gap-3 rounded-2xl border-[3px] border-transparent px-3.5 py-2.5 text-left text-sm font-bold text-slate-500 transition-colors duration-150 hover:text-rose-600"
            >
              <LogOut className="h-4.5 w-4.5" aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      <main className="md:pl-64">
        <div className="max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  )
}
