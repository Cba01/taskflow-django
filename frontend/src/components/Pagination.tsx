import type { PaginatedResponse } from '../api/types'

interface PaginationProps {
  page: number
  onPageChange: (page: number) => void
  response: Pick<PaginatedResponse<unknown>, 'count' | 'next' | 'previous'>
  pageSize?: number
}

export default function Pagination({ page, onPageChange, response, pageSize = 20 }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(response.count / pageSize))

  if (totalPages <= 1) return null

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={!response.previous}
        className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
      >
        Anterior
      </button>
      <span className="text-gray-500">
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={!response.next}
        className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
      >
        Siguiente
      </button>
    </div>
  )
}
