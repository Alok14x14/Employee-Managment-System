import { useCallback, useEffect, useState } from 'react'
import { Check, RefreshCw, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import { formatDate, formatTime } from '../../utils/formatters'

const AdminCorrectionRequests = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [notes, setNotes] = useState({})
  const fetchRequests = useCallback(async () => {
    try { const { data } = await api.get('/attendance/corrections?status=PENDING'); setRequests(data.data || []) }
    catch (error) { toast.error(error?.response?.data?.error || 'Failed to load correction requests') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchRequests() }, [fetchRequests])

  const review = async (request, status) => {
    setBusyId(request._id)
    try {
      await api.patch(`/attendance/corrections/${request._id}`, { status, reviewNote: notes[request._id] || '' })
      toast.success(status === 'APPROVED' ? 'Correction approved and attendance updated' : 'Correction rejected')
      fetchRequests()
    } catch (error) { toast.error(error?.response?.data?.error || 'Could not review this request') }
    finally { setBusyId(null) }
  }

  return <section className="card overflow-hidden">
    <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800"><div><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Attendance correction requests</h2><p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Review employee requests to add missing attendance times.</p></div><button type="button" onClick={fetchRequests} className="btn-secondary px-2.5" title="Refresh requests"><RefreshCw className="size-3.5" /></button></div>
    {loading ? <p className="p-4 text-xs text-zinc-500">Loading requests…</p> : requests.length === 0 ? <p className="p-4 text-xs text-zinc-500 dark:text-zinc-400">No pending correction requests.</p> : <div className="divide-y divide-zinc-100 dark:divide-zinc-800">{requests.map((request) => <article key={request._id} className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{request.employeeId?.firstName} {request.employeeId?.lastName} <span className="font-normal text-zinc-500">· {request.employeeId?.department || 'Unassigned'}</span></p><p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300">{request.field === 'checkIn' ? 'Missed check-in' : 'Missed check-out'} · {formatDate(request.attendanceId?.date)} at {formatTime(request.requestedTime)}</p><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{request.reason}</p></div><span className="badge badge-warning">Pending</span></div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={notes[request._id] || ''} maxLength={500} onChange={(e) => setNotes((current) => ({ ...current, [request._id]: e.target.value }))} placeholder="Optional note to employee" className="flex-1" /><button type="button" disabled={busyId === request._id} onClick={() => review(request, 'APPROVED')} className="btn-primary"><Check className="size-3.5" />Approve</button><button type="button" disabled={busyId === request._id} onClick={() => review(request, 'REJECTED')} className="btn-secondary text-rose-600 dark:text-rose-400"><X className="size-3.5" />Reject</button></div>
    </article>)}</div>}
  </section>
}

export default AdminCorrectionRequests
