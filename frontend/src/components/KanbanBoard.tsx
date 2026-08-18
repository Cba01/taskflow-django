import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, CircleDashed, Loader2 } from 'lucide-react'
import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { Flip } from 'gsap/Flip'
import {
  listAllTasks,
  changeTaskStatus,
  STATUS_LABELS,
  PRIORITY_LABELS,
  type TaskListItem,
  type TaskFilters,
} from '../api/tasks'
import { AvatarStack } from './Avatar'
import { CLAY, CLAY_CARD, ClayBadge, ClayErrorList, PRIORITY_HUE, STATUS_HUE } from './ui.clay'

gsap.registerPlugin(Draggable, Flip)

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const COLUMNS = ['todo', 'in_progress', 'done']
const COLUMN_ICON: Record<string, typeof CircleDashed> = {
  todo: CircleDashed,
  in_progress: Loader2,
  done: CheckCircle2,
}

interface KanbanBoardProps {
  projectId: string
  filters: TaskFilters
}

export default function KanbanBoard({ projectId, filters }: KanbanBoardProps) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<TaskListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const dragOverColumnRef = useRef<string | null>(null)
  const flipStateRef = useRef<Flip.FlipState | null>(null)
  const pendingEntranceRef = useRef(false)
  const fetchIdRef = useRef(0)

  function updateDragOverColumn(status: string | null) {
    dragOverColumnRef.current = status
    setDragOverColumn(status)
  }

  // Los filtros se recrean como objeto nuevo en cada render del padre;
  // comparamos su contenido serializado para no volver a pedir las
  // tareas cuando en realidad no cambiaron.
  const filtersKey = JSON.stringify(filters)

  // React StrictMode monta los efectos dos veces en desarrollo, lo que
  // dispara dos pedidos superpuestos. Sin esta guarda, la respuesta del
  // primero podía llegar después que la del segundo, o pisar a mitad de
  // camino la animación de entrada que dispara la del otro (dejando las
  // tarjetas en opacity:0). Solo la última solicitud en curso puede
  // actualizar el estado.
  function fetchTasks() {
    const requestId = ++fetchIdRef.current
    setError(null)
    setLoading(true)
    listAllTasks(projectId, filters)
      .then((data) => {
        if (fetchIdRef.current !== requestId) return
        pendingEntranceRef.current = true
        setTasks(data)
      })
      .catch(() => {
        if (fetchIdRef.current !== requestId) return
        setError('No se pudieron cargar las tareas.')
      })
      .finally(() => {
        if (fetchIdRef.current !== requestId) return
        setLoading(false)
      })
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(fetchTasks, [projectId, filtersKey])

  function attemptMove(taskId: number, newStatus: string) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === newStatus) return

    const previousTasks = tasks
    flipStateRef.current = Flip.getState('.kanban-card')
    setTasks((current) => current.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)))

    changeTaskStatus(projectId, String(taskId), newStatus).catch(() => {
      flipStateRef.current = Flip.getState('.kanban-card')
      setTasks(previousTasks)
      setError('No se pudo mover la tarea.')
    })
  }

  // Reacomoda las tarjetas que quedan en su lugar con FLIP (First-Last-
  // Invert-Play) cuando una tarea entra o sale de una columna, y hace
  // la entrada escalonada al cargar/filtrar. La tarjeta que en sí se
  // mueve de columna se anima aparte (ver onDragEnd): FLIP no puede
  // seguir un nodo del DOM que React desmonta de una columna y vuelve
  // a montar en otra.
  useLayoutEffect(() => {
    if (pendingEntranceRef.current) {
      pendingEntranceRef.current = false
      if (!reducedMotion()) {
        gsap.from('.kanban-card', {
          opacity: 0,
          y: 16,
          scale: 0.9,
          duration: 0.4,
          stagger: { each: 0.05, from: 'start' },
          ease: 'back.out(1.4)',
          // Si algo interrumpe esta animación (otro efecto disparado a
          // mitad de camino), igual queda una tarjeta visible en vez de
          // una tarjeta con opacity:0 pegado para siempre.
          clearProps: 'opacity,transform',
        })
      }
      return
    }

    if (flipStateRef.current) {
      const state = flipStateRef.current
      flipStateRef.current = null
      // Sin "absolute": las tarjetas se reacomodan solo verticalmente
      // dentro de su propia columna, así que no hace falta sacarlas del
      // flujo del documento para animarlas — y evitamos que la columna
      // colapse su altura mientras dura la transición (bug anterior).
      Flip.from(state, {
        duration: reducedMotion() ? 0 : 0.45,
        ease: 'power3.out',
      })
    }
  }, [tasks])

  // Instancia un Draggable por tarjeta: arrastre libre con giro/escala al
  // levantarla, detección de columna por hitTest mientras se mueve, y un
  // click "de verdad" (sin arrastre) sigue navegando al detalle.
  useEffect(() => {
    if (loading) return

    const draggables = Draggable.create('.kanban-card', {
      type: 'x,y',
      allowNativeTouchScrolling: true,
      onPress: function () {
        gsap.set(this.target, { zIndex: 50 })
      },
      onDragStart: function () {
        const id = Number((this.target as HTMLElement).dataset.taskId)
        setDraggedTaskId(id)
        if (!reducedMotion()) {
          gsap.to(this.target, { scale: 1.06, rotate: 3, duration: 0.15, ease: 'power2.out' })
        }
      },
      onDrag: function () {
        let hovered: string | null = null
        for (const status of COLUMNS) {
          const columnEl = columnRefs.current[status]
          if (columnEl && this.hitTest(columnEl, '30%')) {
            hovered = status
            break
          }
        }
        if (dragOverColumnRef.current !== hovered) updateDragOverColumn(hovered)
      },
      onRelease: function () {
        gsap.set(this.target, { zIndex: 'auto' })
      },
      onDragEnd: function () {
        const el = this.target as HTMLElement
        const taskId = Number(el.dataset.taskId)
        const targetStatus = dragOverColumnRef.current
        updateDragOverColumn(null)
        setDraggedTaskId(null)

        const task = tasks.find((t) => t.id === taskId)
        const isValidMove = Boolean(targetStatus && task && task.status !== targetStatus)

        if (isValidMove) {
          if (reducedMotion()) {
            attemptMove(taskId, targetStatus as string)
          } else {
            gsap.to(el, {
              opacity: 0,
              scale: 0.7,
              duration: 0.2,
              ease: 'power2.in',
              onComplete: () => attemptMove(taskId, targetStatus as string),
            })
          }
        } else if (reducedMotion()) {
          gsap.set(el, { x: 0, y: 0, rotate: 0, scale: 1 })
        } else {
          gsap.to(el, { x: 0, y: 0, rotate: 0, scale: 1, duration: 0.55, ease: 'elastic.out(1, 0.6)' })
        }
      },
      onClick: function () {
        navigate(`/projects/${projectId}/tasks/${(this.target as HTMLElement).dataset.taskId}`)
      },
    })

    return () => draggables.forEach((d) => d.kill())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, loading])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {COLUMNS.map((columnStatus) => {
          const hue = STATUS_HUE[columnStatus]
          return (
            <div
              key={columnStatus}
              className="tf-shimmer h-44 rounded-[26px] border-[3px]"
              style={{ backgroundColor: CLAY[hue].soft, borderColor: `${CLAY[hue].base}55` }}
            />
          )
        })}
      </div>
    )
  }

  if (error) return <ClayErrorList messages={[error]} />

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {COLUMNS.map((columnStatus) => {
        const columnTasks = tasks.filter((task) => task.status === columnStatus)
        const hue = STATUS_HUE[columnStatus]
        const c = CLAY[hue]
        const Icon = COLUMN_ICON[columnStatus]
        const isOver = dragOverColumn === columnStatus

        return (
          <div
            key={columnStatus}
            ref={(el) => {
              columnRefs.current[columnStatus] = el
            }}
            className={`flex min-h-40 flex-col gap-2.5 rounded-[26px] border-[3px] p-3.5 transition-[box-shadow] duration-200 ${isOver ? 'clay-wiggle' : ''}`}
            style={{
              backgroundColor: c.soft,
              borderColor: isOver ? c.base : `${c.base}55`,
              boxShadow: isOver ? `0 0 0 4px rgba(${c.rgb}, 0.25)` : 'none',
            }}
          >
            <h3
              className="mb-0.5 flex items-center gap-2 rounded-2xl border-2 bg-white/70 px-3 py-1.5 text-sm font-extrabold"
              style={{ borderColor: `${c.base}55`, color: c.text }}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {STATUS_LABELS[columnStatus]}
              <span className="ml-auto tabular-nums opacity-70">{columnTasks.length}</span>
            </h3>

            {columnTasks.map((task) => (
              <div
                key={task.id}
                data-task-id={task.id}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/projects/${projectId}/tasks/${task.id}`)
                  }
                }}
                className={`kanban-card ${CLAY_CARD} touch-none p-3.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-slate-400 ${
                  draggedTaskId === task.id ? 'cursor-grabbing' : 'cursor-grab'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-slate-800">{task.title}</p>
                  <AvatarStack users={task.assigned_to} size={18} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <ClayBadge hue={PRIORITY_HUE[task.priority] ?? 'stone'}>
                    {PRIORITY_LABELS[task.priority] ?? task.priority}
                  </ClayBadge>
                  {task.due_date && <span className="text-xs font-medium text-slate-500">Vence {task.due_date}</span>}
                </div>
              </div>
            ))}

            {columnTasks.length === 0 && (
              <p
                className="rounded-2xl border-2 border-dashed px-3 py-5 text-center text-xs font-semibold"
                style={{ borderColor: `${c.base}55`, color: c.text }}
              >
                Sin tareas
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
