import { useEffect, useState, type CSSProperties } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react'
import {
  getProject,
  listMembers,
  addMember,
  removeMember,
  updateProject,
  deleteProject,
  type Project,
  type Membership,
} from '../api/projects'
import {
  listTasks,
  STATUS_LABELS,
  PRIORITY_LABELS,
  type TaskListItem,
  type TaskFilters,
} from '../api/tasks'
import type { PaginatedResponse } from '../api/types'
import KanbanBoard from '../components/KanbanBoard'
import { Avatar, AvatarStack } from '../components/Avatar'
import {
  CLAY,
  CLAY_CARD,
  CLAY_FIELD,
  CLAY_PANEL,
  ClayBadge,
  ClayButton,
  ClayConfirmDialog,
  ClayErrorList,
  ClayModal,
  ClaySelect,
  clayButtonStyle,
  hueFor,
  PRIORITY_HUE,
  ROLE_HUE,
  ROLE_LABEL,
  STATUS_HUE,
} from '../components/ui.clay'

function extractErrors(data: unknown): string[] {
  if (typeof data !== 'object' || data === null) return ['Algo salió mal. Inténtalo de nuevo.']
  return Object.values(data as Record<string, string[] | string>).flat()
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<Membership[]>([])
  const [taskResponse, setTaskResponse] = useState<PaginatedResponse<TaskListItem> | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  const [view, setView] = useState<'list' | 'board'>('list')

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [assignedToFilter, setAssignedToFilter] = useState('')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [ordering, setOrdering] = useState('-created_at')

  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState('member')
  const [memberErrors, setMemberErrors] = useState<string[]>([])
  const [addingMember, setAddingMember] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editErrors, setEditErrors] = useState<string[]>([])
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)

  function fetchProject() {
    if (!id) return
    setError(null)
    setLoading(true)

    Promise.all([getProject(id), listMembers(id)])
      .then(([projectData, membersData]) => {
        setProject(projectData)
        setMembers(membersData)
      })
      .catch(() => setError('No se pudo cargar el proyecto.'))
      .finally(() => setLoading(false))
  }

  useEffect(fetchProject, [id])

  // Espera 400ms sin cambios antes de aplicar la búsqueda, para no
  // disparar un pedido al backend en cada tecla.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 400)
    return () => clearTimeout(timeout)
  }, [searchInput])

  // Cualquier cambio de filtro vuelve a la página 1: la página actual
  // puede dejar de existir con el nuevo resultado filtrado.
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, priorityFilter, assignedToFilter, overdueOnly, ordering])

  useEffect(() => {
    if (!id || view !== 'list') return

    const filters: TaskFilters = {
      search,
      status: statusFilter,
      priority: priorityFilter,
      assigned_to: assignedToFilter ? Number(assignedToFilter) : undefined,
      ordering,
      ...(overdueOnly ? { overdue: true } : {}),
    }

    listTasks(id, page, filters)
      .then(setTaskResponse)
      .catch(() => setError('No se pudieron cargar las tareas.'))
  }, [id, view, page, search, statusFilter, priorityFilter, assignedToFilter, overdueOnly, ordering])

  // Dispara la entrada escalonada de tarjetas (miembros y tareas) un
  // frame después de que hay datos, para que el navegador arranque
  // desde "oculto" y la animación de rebote sea visible.
  useEffect(() => {
    if (loading) return
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [loading, taskResponse, view])

  const tasks = taskResponse?.results ?? []
  const totalPages = taskResponse ? Math.max(1, Math.ceil(taskResponse.count / 20)) : 1
  const hasActiveFilters =
    search !== '' || statusFilter !== '' || priorityFilter !== '' || assignedToFilter !== '' || overdueOnly

  // El tablero no tiene columna "todos los estados" ni orden manual:
  // la columna ya es el estado, y el orden dentro de cada una no aplica.
  const boardFilters: TaskFilters = {
    search,
    priority: priorityFilter,
    assigned_to: assignedToFilter ? Number(assignedToFilter) : undefined,
    ...(overdueOnly ? { overdue: true } : {}),
  }
  const isAdmin = project?.user_role === 'owner' || project?.user_role === 'admin'

  async function handleAddMember(event: FormEvent) {
    event.preventDefault()
    if (!id) return
    setMemberErrors([])
    setAddingMember(true)

    try {
      const membership = await addMember(id, memberEmail, memberRole)
      setMembers((current) => [...current, membership])
      setMemberEmail('')
      setMemberRole('member')
    } catch (err) {
      const response = (err as { response?: { data?: unknown } }).response
      setMemberErrors(extractErrors(response?.data))
    } finally {
      setAddingMember(false)
    }
  }

  async function handleRemoveMember(membershipId: number) {
    if (!id) return
    setMemberErrors([])
    setRemovingMemberId(membershipId)

    try {
      await removeMember(id, membershipId)
      setMembers((current) => current.filter((m) => m.id !== membershipId))
    } catch (err) {
      const response = (err as { response?: { data?: unknown } }).response
      setMemberErrors(extractErrors(response?.data))
    } finally {
      setRemovingMemberId(null)
    }
  }

  function startEditing() {
    if (!project) return
    setEditName(project.name)
    setEditDescription(project.description)
    setEditErrors([])
    setIsEditing(true)
  }

  async function handleSaveEdit(event: FormEvent) {
    event.preventDefault()
    if (!id) return
    setEditErrors([])
    setSavingEdit(true)

    try {
      const updated = await updateProject(id, editName, editDescription)
      setProject(updated)
      setIsEditing(false)
    } catch (err) {
      const response = (err as { response?: { data?: unknown } }).response
      setEditErrors(extractErrors(response?.data))
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleDeleteProject() {
    if (!id) return

    setDeleting(true)
    try {
      await deleteProject(id)
      navigate('/', { replace: true })
    } catch {
      setError('No se pudo eliminar el proyecto.')
      setDeleting(false)
      setConfirmDeleteOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="clay-canvas min-h-screen font-sans text-slate-800">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-3">
            <div className="tf-shimmer h-8 w-64 rounded-2xl bg-white" />
            <div className="tf-shimmer h-24 rounded-[22px] bg-white" />
            <div className="tf-shimmer h-24 rounded-[22px] bg-white" style={{ '--shimmer-delay': '100ms' } as CSSProperties} />
          </div>
        </div>
      </div>
    )
  }

  const projectHue = project ? hueFor(project.id) : 'sky'

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
            <ClayErrorList messages={[error]} />
          </div>
        )}

        {project && (
          <>
            <div className="mt-6 mb-6 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div
                  className="clay-surface flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border-[3px] text-lg font-extrabold"
                  style={{
                    backgroundColor: CLAY[projectHue].soft,
                    borderColor: CLAY[projectHue].base,
                    color: CLAY[projectHue].text,
                    ['--clay-rgb' as string]: CLAY[projectHue].rgb,
                  }}
                >
                  {project.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                    {project.name}
                  </h1>
                  {project.user_role && (
                    <div className="mt-1.5">
                      <ClayBadge hue={ROLE_HUE[project.user_role] ?? 'stone'}>
                        {ROLE_LABEL[project.user_role] ?? project.user_role}
                      </ClayBadge>
                    </div>
                  )}
                </div>
              </div>
              {isAdmin && !isEditing && (
                <div className="flex items-center gap-2">
                  <ClayButton hue="sky" size="sm" onClick={startEditing}>
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    Editar
                  </ClayButton>
                  <ClayButton hue="rose" size="sm" onClick={() => setConfirmDeleteOpen(true)} disabled={deleting}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {deleting ? 'Eliminando...' : 'Eliminar'}
                  </ClayButton>
                </div>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveEdit} className={`${CLAY_PANEL} mb-6 flex flex-col gap-4 p-5`}>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="edit-name" className="text-sm font-bold text-slate-600">
                    Nombre
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className={CLAY_FIELD}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="edit-description" className="text-sm font-bold text-slate-600">
                    Descripción
                  </label>
                  <textarea
                    id="edit-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className={CLAY_FIELD}
                  />
                </div>

                <ClayErrorList messages={editErrors} />

                <div className="flex gap-2">
                  <ClayButton hue="mint" type="submit" disabled={savingEdit}>
                    {savingEdit ? 'Guardando...' : 'Guardar'}
                  </ClayButton>
                  <ClayButton hue="stone" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </ClayButton>
                </div>
              </form>
            ) : (
              project.description && <p className="mb-6 text-sm font-medium text-slate-600">{project.description}</p>
            )}

            <button
              type="button"
              onClick={() => setMembersOpen(true)}
              className={`${CLAY_CARD} mb-6 flex w-full items-center justify-between gap-3 p-3.5 text-left`}
            >
              <div className="flex items-center gap-3">
                <AvatarStack users={members.map((m) => m.user)} size={30} max={5} />
                <span className="text-sm font-semibold text-slate-700">
                  {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
                </span>
              </div>
              <span
                className="inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-bold"
                style={{ backgroundColor: CLAY.violet.soft, borderColor: `${CLAY.violet.base}80`, color: CLAY.violet.text }}
              >
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                Gestionar
              </span>
            </button>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-extrabold text-slate-800">Tareas</h2>
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 rounded-2xl border-[3px] border-white bg-white p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold transition-colors duration-150 cursor-pointer"
                    style={view === 'list' ? { backgroundColor: CLAY.sky.soft, color: CLAY.sky.text } : { color: '#94A3B8' }}
                  >
                    <List className="h-4 w-4" aria-hidden="true" />
                    Lista
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('board')}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold transition-colors duration-150 cursor-pointer"
                    style={view === 'board' ? { backgroundColor: CLAY.violet.soft, color: CLAY.violet.text } : { color: '#94A3B8' }}
                  >
                    <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                    Tablero
                  </button>
                </div>
                <Link to={`/projects/${id}/tasks/new`} style={clayButtonStyle('sunshine')} className="clay-surface inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border-[3px] px-3 py-1.5 text-xs font-bold cursor-pointer">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Nueva tarea
                </Link>
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative sm:min-w-56 sm:flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar por título o descripción"
                  className={`${CLAY_FIELD} pl-10`}
                />
              </div>
              {view === 'list' && (
                <ClaySelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  ariaLabel="Filtrar por estado"
                  className="sm:w-auto"
                  options={[
                    { value: '', label: 'Todos los estados' },
                    ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
                  ]}
                />
              )}
              <ClaySelect
                value={priorityFilter}
                onChange={setPriorityFilter}
                ariaLabel="Filtrar por prioridad"
                className="sm:w-auto"
                options={[
                  { value: '', label: 'Toda prioridad' },
                  ...Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label })),
                ]}
              />
              <ClaySelect
                value={assignedToFilter}
                onChange={setAssignedToFilter}
                ariaLabel="Filtrar por asignado"
                className="sm:w-auto"
                options={[
                  { value: '', label: 'Cualquier asignado' },
                  ...members.map((membership) => ({
                    value: String(membership.user.id),
                    label: membership.user.username,
                  })),
                ]}
              />
              {view === 'list' && (
                <ClaySelect
                  value={ordering}
                  onChange={setOrdering}
                  ariaLabel="Ordenar tareas"
                  className="sm:w-auto"
                  options={[
                    { value: '-created_at', label: 'Más recientes primero' },
                    { value: 'due_date', label: 'Vencimiento más próximo' },
                    { value: '-priority_rank', label: 'Prioridad más alta' },
                  ]}
                />
              )}
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={overdueOnly}
                  onChange={(e) => setOverdueOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-2 border-slate-300 accent-rose-400"
                />
                Solo vencidas
              </label>
            </div>

            {view === 'list' ? (
              <>
                {tasks.length === 0 && (
                  <div className={`${CLAY_CARD} flex flex-col items-center gap-3 px-4 py-12 text-center`}>
                    <List className="h-8 w-8 text-slate-400" aria-hidden="true" />
                    <p className="text-sm font-semibold text-slate-500">
                      {hasActiveFilters ? 'No hay tareas que coincidan con los filtros.' : 'Todavía no hay tareas.'}
                    </p>
                  </div>
                )}
                <ul className="flex flex-col gap-2.5">
                  {tasks.map((task, idx) => (
                    <li
                      key={task.id}
                      className={visible ? 'clay-enter' : 'opacity-0'}
                      style={{ '--clay-delay': `${idx * 45}ms` } as CSSProperties}
                    >
                      <Link to={`/projects/${id}/tasks/${task.id}`} className={`${CLAY_CARD} block p-4`}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-sm font-bold text-slate-800">{task.title}</span>
                          <div className="flex shrink-0 items-center gap-2">
                            <AvatarStack users={task.assigned_to} size={20} />
                            <ClayBadge hue={STATUS_HUE[task.status] ?? 'stone'}>
                              {STATUS_LABELS[task.status] ?? task.status}
                            </ClayBadge>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <ClayBadge hue={PRIORITY_HUE[task.priority] ?? 'stone'}>
                            {PRIORITY_LABELS[task.priority] ?? task.priority}
                          </ClayBadge>
                          {task.due_date && <span className="text-xs font-medium text-slate-500">Vence {task.due_date}</span>}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>

                {taskResponse && totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between text-sm">
                    <ClayButton hue="stone" size="sm" onClick={() => setPage((p) => p - 1)} disabled={!taskResponse.previous}>
                      <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      Anterior
                    </ClayButton>
                    <span className="font-bold tabular-nums text-slate-500">
                      Página {page} de {totalPages}
                    </span>
                    <ClayButton hue="violet" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!taskResponse.next}>
                      Siguiente
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </ClayButton>
                  </div>
                )}
              </>
            ) : (
              <KanbanBoard projectId={id as string} filters={boardFilters} />
            )}
          </>
        )}
      </div>

      {project && (
        <ClayModal open={membersOpen} onClose={() => setMembersOpen(false)} title="Miembros del proyecto" maxWidthClassName="max-w-xl">
          <ul className="flex flex-col gap-2.5">
            {members.map((membership, idx) => (
              <li
                key={membership.id}
                className={`${CLAY_CARD} clay-enter flex items-center justify-between gap-3 p-3.5`}
                style={{ '--clay-delay': `${idx * 45}ms` } as CSSProperties}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar username={membership.user.username} avatar={membership.user.avatar} size={30} />
                  <span className="truncate text-sm font-semibold text-slate-800">{membership.user.username}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <ClayBadge hue={ROLE_HUE[membership.role] ?? 'stone'}>
                    {ROLE_LABEL[membership.role] ?? membership.role}
                  </ClayBadge>
                  {isAdmin && membership.user.id !== project.owner.id && (
                    <ClayButton
                      hue="rose"
                      size="sm"
                      onClick={() => handleRemoveMember(membership.id)}
                      disabled={removingMemberId === membership.id}
                    >
                      <UserMinus className="h-3.5 w-3.5" aria-hidden="true" />
                      {removingMemberId === membership.id ? 'Sacando...' : 'Sacar'}
                    </ClayButton>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {isAdmin && (
            <form onSubmit={handleAddMember} className={`${CLAY_PANEL} mt-4 flex flex-col gap-2 p-3.5 sm:flex-row`}>
              <input
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="Email del usuario a agregar"
                required
                className={`${CLAY_FIELD} sm:flex-1`}
              />
              <ClaySelect
                value={memberRole}
                onChange={setMemberRole}
                hue="violet"
                ariaLabel="Rol del nuevo miembro"
                className="sm:w-40"
                options={[
                  { value: 'member', label: 'Miembro' },
                  { value: 'admin', label: 'Administrador' },
                ]}
              />
              <ClayButton hue="violet" type="submit" disabled={addingMember}>
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                {addingMember ? 'Agregando...' : 'Agregar'}
              </ClayButton>
            </form>
          )}

          {memberErrors.length > 0 && (
            <div className="mt-4">
              <ClayErrorList messages={memberErrors} />
            </div>
          )}
        </ClayModal>
      )}

      <ClayConfirmDialog
        open={confirmDeleteOpen}
        title="¿Eliminar este proyecto?"
        description="Esta acción no se puede deshacer: se pierden también sus tareas y comentarios."
        pending={deleting}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteProject}
      />
    </div>
  )
}
