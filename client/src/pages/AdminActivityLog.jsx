import { useCallback, useEffect, useState } from 'react'
import { Search, History, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import Pagination from '../components/Pagination'
import { formatDate, formatTime } from '../utils/formatters'

const PAGE_SIZE = 10

const AdminActivityLog = () => {
  const [logs, setLogs] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
      if (search.trim()) params.set('search', search.trim())
      const { data } = await api.get(`/audit-logs?${params}`)
      setLogs(data.data || [])
      setTotal(data.total || 0)
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Could not load admin activity')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return <div className="space-y-6">
    <div className="page-header">
      <div>
        <h1 className="page-title">Admin activity</h1>
        <p className="page-subtitle">Review successful changes made by administrators.</p>
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
                <td>{log.details?.status && <span className={`mr-1.5 badge ${log.details.status === 'APPROVED' ? 'badge-success' : 'badge-danger'}`}>{log.details.status === 'APPROVED' ? 'Accepted' : 'Rejected'}</span>}{log.action}</td>
                <td>{log.details?.changedEmployee ? <>{log.details.changedEmployee.name} · {log.details.changedEmployee.email}</> : log.details?.changedAccount || (log.details?.createdEmployee ? <>{log.details.createdEmployee.name} · {log.details.createdEmployee.email}</> : log.details?.applicant ? <>{log.details.applicant.name}{log.details.attendanceDate ? ` · ${formatDate(log.details.attendanceDate)}` : log.details.startDate ? ` · ${formatDate(log.details.startDate)} – ${formatDate(log.details.endDate)}` : ''}</> : log.resource)}</td>
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
          <div><dt className="text-[11px] text-zinc-500 dark:text-zinc-400">What was it?</dt><dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{selectedLog.details?.changedEmployee ? 'Employee password change' : selectedLog.details?.createdEmployee ? 'Employee account created' : selectedLog.details?.leaveType || (selectedLog.details?.field === 'checkIn' ? 'Check-in correction' : selectedLog.details?.field === 'checkOut' ? 'Check-out correction' : selectedLog.action)}</dd></div>
          <div><dt className="text-[11px] text-zinc-500 dark:text-zinc-400">{selectedLog.details?.changedEmployee ? 'Password changed for' : selectedLog.details?.changedAccount ? 'Password changed for' : selectedLog.details?.createdEmployee ? 'Employee created' : 'Who applied it?'}</dt><dd className="mt-1 break-words text-sm text-zinc-900 dark:text-zinc-100">{selectedLog.details?.changedEmployee?.name || selectedLog.details?.changedAccount || selectedLog.details?.createdEmployee?.name || selectedLog.details?.applicant?.name || selectedLog.actorEmail}{(selectedLog.details?.changedEmployee?.email || selectedLog.details?.createdEmployee?.email || selectedLog.details?.applicant?.email) && <span className="block text-xs text-zinc-500 dark:text-zinc-400">{selectedLog.details.changedEmployee?.email || selectedLog.details.createdEmployee?.email || selectedLog.details.applicant.email}</span>}</dd></div>
          <div><dt className="text-[11px] text-zinc-500 dark:text-zinc-400">Reviewed by</dt><dd className="mt-1 break-words text-sm text-zinc-900 dark:text-zinc-100">{selectedLog.actorEmail}</dd></div>
          <div><dt className="text-[11px] text-zinc-500 dark:text-zinc-400">Outcome</dt><dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{selectedLog.details?.status === 'APPROVED' ? 'Accepted' : selectedLog.details?.status === 'REJECTED' ? 'Rejected' : 'Recorded'}</dd></div>
          <div className="sm:col-span-2"><dt className="text-[11px] text-zinc-500 dark:text-zinc-400">For what?</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-100">{selectedLog.details?.reason || selectedLog.resource}</dd></div>
          <div className="sm:col-span-2"><dt className="text-[11px] text-zinc-500 dark:text-zinc-400">For when?</dt><dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{selectedLog.details?.attendanceDate ? `${formatDate(selectedLog.details.attendanceDate)}${selectedLog.details.requestedTime ? ` · ${formatTime(selectedLog.details.requestedTime)}` : ''}` : selectedLog.details?.startDate ? `${formatDate(selectedLog.details.startDate)} – ${formatDate(selectedLog.details.endDate)}` : '—'}</dd></div>
          {selectedLog.details?.reviewNote && <div className="sm:col-span-2"><dt className="text-[11px] text-zinc-500 dark:text-zinc-400">Review note</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-100">{selectedLog.details.reviewNote}</dd></div>}
          <div className="sm:col-span-2"><dt className="text-[11px] text-zinc-500 dark:text-zinc-400">Audit done at</dt><dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{formatDate(selectedLog.createdAt)} · {formatTime(selectedLog.createdAt)}</dd></div>
        </dl>
      </section>
    </div>}
  </div>
}

export default AdminActivityLog
