import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronLeft, ChevronRight, RefreshCw, X } from 'lucide-react'
import type { PaginatedResponse } from '../api/types'

// Primitivos de diseño "claymorphism" — el sistema visual de toda la
// app (empezó como prueba acotada a ProjectDetail/KanbanBoard, ya
// extendido a todas las páginas).
//
// En vez de un solo color primario, el color comunica categoría/acción:
// cada huella (hue) tiene un rol fijo (crear = sunshine, guardar = mint,
// eliminar = coral/rose, editar = sky, personas = violet), así la
// interfaz es colorida sin que ningún tono "sea la marca".

export type HueKey = 'coral' | 'sky' | 'mint' | 'violet' | 'sunshine' | 'rose' | 'stone'

interface Hue {
  base: string
  soft: string
  text: string
  rgb: string
}

export const CLAY: Record<HueKey, Hue> = {
  coral: { base: '#FB923C', soft: '#FFEDD5', text: '#9A3412', rgb: '251, 146, 60' },
  sky: { base: '#38BDF8', soft: '#E0F2FE', text: '#075985', rgb: '56, 189, 248' },
  mint: { base: '#34D399', soft: '#D1FAE5', text: '#065F46', rgb: '52, 211, 153' },
  violet: { base: '#A78BFA', soft: '#EDE9FE', text: '#5B21B6', rgb: '167, 139, 250' },
  sunshine: { base: '#FBBF24', soft: '#FEF3C7', text: '#92400E', rgb: '251, 191, 36' },
  rose: { base: '#FB7185', soft: '#FFE4E6', text: '#9F1239', rgb: '251, 113, 133' },
  stone: { base: '#94A3B8', soft: '#F1F5F9', text: '#334155', rgb: '100, 116, 139' },
}

// Identidad por proyecto/persona: rota entre las 6 huellas de color
// (sin "stone", que queda reservada para acciones neutrales).
const IDENTITY_HUES: HueKey[] = ['coral', 'sky', 'mint', 'violet', 'sunshine', 'rose']

export function hueFor(id: number): HueKey {
  return IDENTITY_HUES[id % IDENTITY_HUES.length]
}

export function clayVars(hue: HueKey): CSSProperties {
  return { '--clay-rgb': CLAY[hue].rgb } as CSSProperties
}

export function claySurfaceStyle(hue: HueKey): CSSProperties {
  return {
    '--clay-rgb': CLAY[hue].rgb,
    backgroundColor: CLAY[hue].soft,
    borderColor: `${CLAY[hue].base}66`,
  } as CSSProperties
}

export const STATUS_HUE: Record<string, HueKey> = { todo: 'sky', in_progress: 'sunshine', done: 'mint' }
export const PRIORITY_HUE: Record<string, HueKey> = { low: 'mint', medium: 'sunshine', high: 'rose' }
export const ROLE_HUE: Record<string, HueKey> = { owner: 'violet', admin: 'violet', member: 'stone' }

// El backend devuelve el rol crudo ('owner'/'admin'/'member'); esto lo
// traduce para no filtrar inglés en un badge (compromiso no negociable
// de PRODUCT.md). 'admin'/'member' coinciden con los labels que ya usa
// Membership.Role en el backend (apps/projects/models.py).
export const ROLE_LABEL: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  member: 'Miembro',
}

export const CLAY_CARD = 'clay-surface rounded-[22px] border-[3px] border-white bg-white'

// Igual que CLAY_CARD pero sin el rebote de hover/press — para
// contenedores de formularios (inputs de texto adentro), donde ese
// "crecer al pasar el mouse" queda molesto en vez de útil.
export const CLAY_PANEL = 'clay-panel rounded-[22px] border-[3px] border-white bg-white'

export const CLAY_BTN_BASE =
  'clay-surface inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border-[3px] px-4 py-2.5 text-sm font-bold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-40'

export const CLAY_BTN_SM_BASE =
  'clay-surface inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-[3px] px-3 py-1.5 text-xs font-bold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-40'

export const CLAY_FIELD =
  'w-full rounded-2xl border-[3px] border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.04)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400 focus-visible:border-sky-300 focus-visible:shadow-[0_0_0_4px_rgba(56,189,248,0.18)]'

interface ClayButtonProps {
  hue: HueKey
  size?: 'md' | 'sm'
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}

export function ClayButton({ hue, size = 'md', children, onClick, type = 'button', disabled, className = '' }: ClayButtonProps) {
  const c = CLAY[hue]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...clayVars(hue), backgroundColor: c.soft, borderColor: c.base, color: c.text, outlineColor: c.base }}
      className={`${size === 'sm' ? CLAY_BTN_SM_BASE : CLAY_BTN_BASE} ${className}`}
    >
      {children}
    </button>
  )
}

export function clayButtonStyle(hue: HueKey): CSSProperties {
  const c = CLAY[hue]
  return { ...clayVars(hue), backgroundColor: c.soft, borderColor: c.base, color: c.text, outlineColor: c.base }
}

export function ClayBadge({ hue, children }: { hue: HueKey; children: ReactNode }) {
  const c = CLAY[hue]
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full border-2 px-2.5 py-0.5 text-xs font-bold"
      style={{ backgroundColor: c.soft, borderColor: `${c.base}80`, color: c.text }}
    >
      {children}
    </span>
  )
}

export interface ClaySelectOption {
  value: string
  label: string
}

interface ClaySelectProps {
  value: string
  onChange: (value: string) => void
  options: ClaySelectOption[]
  hue?: HueKey
  className?: string
  ariaLabel?: string
}

// El navegador no deja estilizar la lista desplegada de un <select>
// nativo (solo el control cerrado) — así que para que las opciones
// también tengan el look clay, esto reimplementa el patrón ARIA
// "listbox" a mano en vez de un <select>.
//
// La lista se renderiza en un portal a document.body con posición fija
// (no como "absolute" dentro del propio control): si quedara anidada
// dentro de un contenedor con scroll propio (como el modal de
// miembros), el navegador la recorta en el borde de ese contenedor en
// vez de dejarla flotar por encima.
export function ClaySelect({ value, onChange, options, hue = 'stone', className = '', ariaLabel }: ClaySelectProps) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const [position, setPosition] = useState<{ top: number; left: number; minWidth: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listboxId = useId()
  const c = CLAY[hue]
  const selectedIndex = options.findIndex((o) => o.value === value)
  const selected = options[selectedIndex]

  useEffect(() => {
    if (!open) return
    setHighlighted(Math.max(0, selectedIndex))

    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const estimatedHeight = Math.min(options.length * 40 + 12, 264)
      const openUpward = window.innerHeight - rect.bottom < estimatedHeight && rect.top > estimatedHeight
      setPosition({
        top: openUpward ? rect.top - estimatedHeight - 8 : rect.bottom + 8,
        left: rect.left,
        minWidth: rect.width,
      })
    }
    updatePosition()

    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function commit(index: number) {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    setOpen(false)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((i) => Math.min(options.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      commit(highlighted)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-activedescendant={open ? `${listboxId}-option-${highlighted}` : undefined}
        onClick={() => setOpen((o) => !o)}
        className={`${CLAY_FIELD} flex items-center justify-between gap-2 text-left`}
      >
        <span className="truncate">{selected?.label ?? ''}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open &&
        position &&
        createPortal(
          <ul
            ref={listRef}
            role="listbox"
            id={listboxId}
            aria-label={ariaLabel}
            style={{ position: 'fixed', top: position.top, left: position.left, minWidth: position.minWidth }}
            className="clay-enter z-50 max-h-64 overflow-auto rounded-2xl border-[3px] border-white bg-white p-1.5 shadow-[0_16px_32px_rgba(15,23,42,0.18)]"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value
              const isHighlighted = index === highlighted
              return (
                <li
                  key={option.value}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => commit(index)}
                  className="cursor-pointer rounded-xl px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors duration-100"
                  style={{
                    backgroundColor: isHighlighted || isSelected ? c.soft : 'transparent',
                    color: isHighlighted || isSelected ? c.text : '#334155',
                  }}
                >
                  {option.label}
                </li>
              )
            })}
          </ul>,
          document.body
        )}
    </div>
  )
}

interface ClayModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  maxWidthClassName?: string
  closeDisabled?: boolean
}

// Modal genérico (overlay + foco + Escape) usado tanto para confirmar
// acciones destructivas como para paneles de gestión más largos (p.ej.
// miembros del proyecto), en vez de duplicar esa mecánica en cada caso.
export function ClayModal({
  open,
  title,
  onClose,
  children,
  maxWidthClassName = 'max-w-lg',
  closeDisabled = false,
}: ClayModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  // Solo la primera vez que el modal se abre — no en cada re-render del
  // padre. onClose suele ser un arrow function inline (() =>
  // setX(false)), así que cambia de identidad en cada render; si este
  // efecto dependiera de él, escribir en un campo del propio modal
  // (que re-renderiza al padre) volvía a robarle el foco al botón de
  // cerrar en cada tecla.
  useEffect(() => {
    if (!open) return
    closeRef.current?.focus({ preventScroll: true })
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape' && !closeDisabled) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, closeDisabled, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={() => !closeDisabled && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className={`${CLAY_CARD} clay-enter flex w-full ${maxWidthClassName} max-h-[85vh] flex-col p-6`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-lg font-extrabold text-slate-900">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Cerrar"
            className="clay-surface flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-white text-slate-500 transition-colors duration-150 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-40"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  )
}

interface ClayConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  hue?: HueKey
  pending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// Reemplaza window.confirm() (el diálogo del navegador, sin estilo
// propio posible) por un modal clay con el mismo par cancelar/confirmar.
export function ClayConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  hue = 'rose',
  pending = false,
  onConfirm,
  onCancel,
}: ClayConfirmDialogProps) {
  return (
    <ClayModal open={open} title={title} onClose={onCancel} closeDisabled={pending} maxWidthClassName="max-w-sm">
      {description && <p className="text-sm font-medium text-slate-600">{description}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          style={clayButtonStyle('stone')}
          className={CLAY_BTN_SM_BASE}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          style={clayButtonStyle(hue)}
          className={CLAY_BTN_SM_BASE}
        >
          {pending ? `${confirmLabel}...` : confirmLabel}
        </button>
      </div>
    </ClayModal>
  )
}

export function ClayErrorList({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null
  const c = CLAY.rose
  return (
    <div
      className="flex flex-col gap-1 rounded-2xl border-[3px] px-4 py-3 text-sm font-semibold"
      style={{ backgroundColor: c.soft, borderColor: c.base, color: c.text }}
    >
      {messages.map((message) => (
        <p key={message}>{message}</p>
      ))}
    </div>
  )
}

// Banner de error de página completa (con reintentar), a diferencia de
// ClayErrorList que es para errores de validación de un formulario.
export function ClayErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const c = CLAY.rose
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-[3px] px-4 py-3 text-sm font-semibold"
      style={{ backgroundColor: c.soft, borderColor: c.base, color: c.text }}
    >
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={clayButtonStyle('rose')}
          className={CLAY_BTN_SM_BASE}
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Reintentar
        </button>
      )}
    </div>
  )
}

interface ClayFieldProps {
  label: string
  htmlFor: string
  children: ReactNode
  hint?: string
}

export function ClayField({ label, htmlFor, children, hint }: ClayFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-bold text-slate-600">
        {label}
      </label>
      {children}
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  )
}

interface ClayPaginationProps {
  page: number
  onPageChange: (page: number) => void
  response: Pick<PaginatedResponse<unknown>, 'count' | 'next' | 'previous'>
  pageSize?: number
}

export function ClayPagination({ page, onPageChange, response, pageSize = 20 }: ClayPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(response.count / pageSize))
  if (totalPages <= 1) return null

  return (
    <div className="mt-6 flex items-center justify-between text-sm">
      <ClayButton hue="stone" size="sm" onClick={() => onPageChange(page - 1)} disabled={!response.previous}>
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Anterior
      </ClayButton>
      <span className="font-bold tabular-nums text-slate-500">
        Página {page} de {totalPages}
      </span>
      <ClayButton hue="violet" size="sm" onClick={() => onPageChange(page + 1)} disabled={!response.next}>
        Siguiente
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      </ClayButton>
    </div>
  )
}

// Usada dentro de páginas protegidas (siempre montadas bajo AppShell,
// ver ProtectedRoute) mientras cargan sus datos — por eso no dibuja su
// propio fondo ni columna, solo el esqueleto de contenido.
export function ClayPageLoading() {
  return (
    <div className="flex flex-col gap-3">
      <div className="tf-shimmer h-4 w-32 rounded-xl bg-white" />
      <div className="tf-shimmer h-8 w-64 rounded-2xl bg-white" />
      <div className="tf-shimmer h-32 rounded-[22px] bg-white" style={{ '--shimmer-delay': '80ms' } as CSSProperties} />
      <div className="tf-shimmer h-24 rounded-[22px] bg-white" style={{ '--shimmer-delay': '160ms' } as CSSProperties} />
    </div>
  )
}
