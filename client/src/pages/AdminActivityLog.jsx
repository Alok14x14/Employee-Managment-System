import { useEffect, useState } from 'react'
import { Search, History, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import Pagination from '../components/Pagination'
import { formatCurrency, formatDate, formatTime } from '../utils/formatters'

const PAGE_SIZE = 10

const getResourceSummary = (log) => {
  const meta = log.meta || {}
  const details = log.details || {}
  const employee = meta.employee || details.employee || details.changedEmployee || details.createdEmployee
  if (meta.period) return `${employee?.name || 'Employee'} · ${meta.period}`
  if (meta.title) {
    const who = employee?.name || (meta.audience === 'ALL' ? 'Company-wide' : '')
    const when = meta.date ? formatDate(meta.date) : ''
    return [meta.title, who, when].filter(Boolean).join(' · ')
  }
  if (employee?.name) return `${employee.name}${employee.email ? ` · ${employee.email}` : ''}`
  if (details.applicant?.name) {
    const when = details.attendanceDate ? formatDate(details.attendanceDate) : details.startDate ? `${formatDate(details.startDate)} – ${formatDate(details.endDate)}` : ''
    return `${details.applicant.name}${when ? ` · ${when}` : ''}`
  }
  return details.changedAccount || log.resource
}

const getOutcome = (log) => {
  if (log.outcome === 'FAILED') return 'Failed'
  if (log.meta?.requestedOutcome) return log.meta.requestedOutcome
  if (log.details?.status === 'APPROVED') return 'Accepted'
  if (log.details?.status === 'REJECTED') return 'Rejected'
  return ''
}

const formatAuditValue = (field, value) => {
  if (value == null) return '—'
  if (field.toLowerCase().includes('salary') || field.toLowerCase().includes('allowances') || field.toLowerCase().includes('deductions')) return formatCurrency(value)
  if (field === 'Archived status') return value ? 'Yes' : 'No'
  if (field === 'Account role') return value === 'ADMIN' ? 'Admin' : 'Employee'
  return String(value)
}

const AdminActivityLog = () => {
  const [logs, setLogs] = useState([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (debouncedSearch) params.set('search', debouncedSearch)
    api.get(`/audit-logs?${params}`, { signal: controller.signal })
      .then(({ data }) => {
        setLogs(data.data || [])
        setTotal(data.total || 0)
      })
      .catch((error) => {
        if (!controller.signal.aborted) toast.error(error?.response?.data?.error || 'Could not load admin activity')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [page, debouncedSearch])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return <div className="space-y-6">
    <div className="page-header">
      <div>
        <h1 className="page-title">Admin activity</h1>
        <p className="page-subtitle">Review administrator actions and security events. Logs are retained for one year.</p>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"><History className="size-3.5" />{loading ? '—' : total} events</span>
    </div>

    <label className="card relative block p-3">
      <span className="sr-only">Search admin activity</span>
      <Search className="absolute left-6 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
      <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search admin, action, or resource…" className="pl-9" />
    </label>

    <section className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table min-w-[680px]">
          <thead><tr><th>Administrator</th><th>Action</th><th>Resource</th><th>Date and time</th></tr></thead>
          <tbody>
            {loading ? Array.from({ length: PAGE_SIZE }).map((_, index) => <tr key={index} aria-hidden="true"><td><div className="h-3.5 w-36 skeleton" /></td><td><div className="h-3.5 w-28 skeleton" /></td><td><div className="h-3.5 w-24 skeleton" /></td><td><div className="h-3.5 w-32 skeleton" /></td></tr>)
              : logs.length ? logs.map((log) => <tr key={log._id} role="button" tabIndex={0} onClick={() => setSelectedLog(log)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedLog(log) } }} aria-label={`Show details for ${log.action}`} className="cursor-pointer hover:bg-zinc-50/60 focus-visible:outline-2 focus-visible:outline-blue-500 dark:hover:bg-zinc-800/40">
                <td className="font-medium text-zinc-900 dark:text-zinc-100">{log.actorEmail}</td>
                <td>{getOutcome(log) && <span className={`mr-1.5 badge ${getOutcome(log) === 'Failed' || getOutcome(log) === 'Rejected' ? 'badge-danger' : 'badge-success'}`}>{getOutcome(log)}</span>}{log.action}</td>
                <td>{getResourceSummary(log)}</td>
                <td>{formatDate(log.createdAt)} · {formatTime(log.createdAt)}</td>
              </tr>)
                : <tr><td colSpan={4} className="py-12 text-center text-xs text-zinc-500">{search ? 'No activity matches your search.' : 'No admin activity has been recorded yet.'}</td></tr>}
          </tbody>
        </table>
      </div>
      {!loading && <Pagination page={page} totalPages={totalPages} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} />}
    </section>

    {selectedLog && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/25 p-4 dark:bg-black/60" onClick={() => setSelectedLog(null)}>
      <section role="dialog" aria-modal="true" aria-labelledby="activity-detail-title" className="card my-8 w-full max-w-lg p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <div><h2 id="activity-detail-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Activity details</h2><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{selectedLog.action}</p></div>
          <button type="button" onClick={() => setSelectedLog(null)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800" aria-label="Close activity details"><X className="size-4" /></button>
        </div>
        <dl className="mt-4 grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <div><dt className="text-[11px] text-zinc-500 dark:text-zinc-400">What was it?</dt><dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedLog.action}{selectedLog.meta?.changes?.length > 0 && <span className="mt-1 block text-xs font-normal text-zinc-500 dark:text-zinc-400">Changed: {selectedLog.meta.changes.join(', ')}</span>}{selectedLog.meta?.reason && <span className="mt-1 block text-xs font-normal text-zinc-500 dark:text-zinc-400">{selectedLog.meta.reason}</span>}</dd></div>
          {(selectedLog.meta?.employee || selectedLog.details?.applicant || selectedLog.details?.changedAccount) && <div><dt className="text-[11px] text-zinc-500 dark:text-zinc-400">Affected person / applicant</dt><dd className="mt-1 break-words text-sm text-zinc-900 dark:text-zinc-100">{selectedLog.meta?.employee?.name || selectedLog.details?.applicant?.name || selectedLog.details?.changedAccount}<span className="block text-xs text-zinc-500 dark:text-zinc-400">{selectedLog.meta?.employee?.email || selectedLog.details?.applicant?.email || selectedLog.details?.changedAccount || ''}</span></dd></div>}
          <div><dt className="text-[11px] text-zinc-500 dark:text-zinc-400">Performed by</dt><dd className="mt-1 break-words text-sm text-zinc-900 dark:text-zinc-100">{selectedLog.actorEmail}</dd></div>
          <div><dt className="text-[11px] text-zinc-500 dark:text-zinc-400">Outcome</dt><dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{getOutcome(selectedLog) || (selectedLog.outcome === 'FAILED' ? `Failed (HTTP ${selectedLog.statusCode})` : 'Completed')}</dd></div>
          <div className="sm:col-span-2"><dt className="text-[11px] text-zinc-500 dark:text-zinc-400">Record details</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-100">{selectedLog.details?.reason || selectedLog.meta?.title || selectedLog.resource}{selectedLog.meta?.category ? ` · ${selectedLog.meta.category}` : ''}{selectedLog.meta?.audience === 'ALL' ? ' · Company-wide' : ''}</dd></div>
          <div className="sm:col-span-2"><dt className="text-[11px] text-zinc-500 dark:text-zinc-400">For when?</dt><dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{selectedLog.details?.attendanceDate ? `${formatDate(selectedLog.details.attendanceDate)}${selectedLog.details.requestedTime ? ` · ${formatTime(selectedLog.details.requestedTime)}` : ''}` : selectedLog.details?.startDate ? `${formatDate(selectedLog.details.startDate)} – ${formatDate(selectedLog.details.endDate)}` : selectedLog.meta?.period || (selectedLog.meta?.date ? formatDate(selectedLog.meta.date) : selectedLog.meta?.expiresAt ? formatDate(selectedLog.meta.expiresAt) : '—')}</dd></div>
          {selectedLog.details?.reviewNote && <div className="sm:col-span-2"><dt className="text-[11px] text-zinc-500 dark:text-zinc-400">Review note</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-100">{selectedLog.details.reviewNote}</dd></div>}
          {selectedLog.meta?.sensitiveChanges?.length > 0 && <div className="sm:col-span-2"><dt className="text-[11px] text-zinc-500 dark:text-zinc-400">Sensitive changes</dt><dd className="mt-2 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800"><table className="w-full text-left text-xs"><thead><tr className="bg-zinc-50 dark:bg-zinc-800/50"><th className="px-3 py-2">Field</th><th className="px-3 py-2">Before</th><th className="px-3 py-2">After</th></tr></thead><tbody>{selectedLog.meta.sensitiveChanges.map((change, index) => <tr key={`${change.field}-${index}`} className="border-t border-zinc-100 dark:border-zinc-800"><td className="px-3 py-2 font-medium">{change.field}</td><td className="px-3 py-2">{formatAuditValue(change.field, change.before)}</td><td className="px-3 py-2">{formatAuditValue(change.field, change.after)}</td></tr>)}</tbody></table></dd></div>}
          {selectedLog.ip && <div><dt className="text-[11px] text-zinc-500 dark:text-zinc-400">IP address</dt><dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{selectedLog.ip}</dd></div>}
          {selectedLog.userAgent && <div className="sm:col-span-2"><dt className="text-[11px] text-zinc-500 dark:text-zinc-400">Browser / client</dt><dd className="mt-1 break-all text-xs text-zinc-600 dark:text-zinc-300">{selectedLog.userAgent}</dd></div>}
          <div className="sm:col-span-2"><dt className="text-[11px] text-zinc-500 dark:text-zinc-400">Audit done at</dt><dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{formatDate(selectedLog.createdAt)} · {formatTime(selectedLog.createdAt)}</dd></div>
        </dl>
      </section>
    </div>}
  </div>
}

export default AdminActivityLog
