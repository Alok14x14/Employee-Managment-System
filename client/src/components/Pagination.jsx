import { ChevronLeft, ChevronRight } from 'lucide-react'

const Pagination = ({ page, totalPages, totalItems, pageSize = 10, onPageChange }) => {
  if (totalItems <= pageSize) return null
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)
  return <nav aria-label="List pagination" className="flex flex-col gap-2 border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
    <span>Showing <strong className="font-medium text-zinc-700 dark:text-zinc-200">{start}–{end}</strong> of {totalItems}</span>
    <div className="flex items-center gap-2 self-end sm:self-auto">
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="btn-secondary h-8 px-2.5 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="size-3.5" /><span>Previous</span></button>
      <span className="min-w-16 text-center tabular-nums">{page} / {totalPages}</span>
      <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="btn-secondary h-8 px-2.5 disabled:cursor-not-allowed disabled:opacity-40"><span>Next</span><ChevronRight className="size-3.5" /></button>
    </div>
  </nav>
}

export default Pagination
