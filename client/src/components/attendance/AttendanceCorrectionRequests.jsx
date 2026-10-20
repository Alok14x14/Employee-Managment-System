import { useCallback, useEffect, useState } from 'react'
import { Clock3, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import { formatDate, formatTime } from '../../utils/formatters'
import Pagination from '../Pagination'

const todayIST = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
const daysAgo = (count) => {
  const [year, month, day] = todayIST().split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day - count))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

const AttendanceCorrectionRequests = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ date: daysAgo(1), field: 'checkIn', time: '09:00', reason: '' })

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/attendance/corrections?page=${page}&limit=10`)
      setRequests(data.data || [])
      setTotal(data.total || 0)
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to load correction requests')
    } finally { setLoading(false) }
  }, [page])
  useEffect(() => { fetchRequests() }, [fetchRequests])

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await api.post('/attendance/corrections', form)
      toast.success('Correction request sent for manager review')
      setForm((current) => ({ ...current, reason: '' }))
      fetchRequests()
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Could not submit correction request')
    } finally { setSaving(false) }
  }

  return <section className="card overflow-hidden">
    <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Attendance corrections</h2>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Request a fix for a missed check-in or check-out from the past 30 days.</p>
    </div>
    <form onSubmit={submit} className="grid gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Date<input required type="date" min={daysAgo(30)} max={daysAgo(1)} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1" /></label>
      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Missing time<select value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} className="mt-1"><option value="checkIn">Check-in</option><option value="checkOut">Check-out</option></select></label>
      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Requested time<input required type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="mt-1" /></label>
      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300 sm:col-span-2 lg:col-span-4">Reason<textarea required minLength={5} maxLength={500} rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Briefly explain why the time is missing" className="mt-1" /></label>
      <div className="sm:col-span-2 lg:col-span-4"><button type="submit" disabled={saving} className="btn-primary"><Send className="size-3.5" />{saving ? 'Sending…' : 'Submit correction request'}</button></div>
    </form>
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {loading ? Array.from({ length: 10 }).map((_, index) => <div key={index} className="flex items-center justify-between gap-3 px-4 py-3" role={index === 0 ? 'status' : undefined} aria-label={index === 0 ? 'Loading correction requests' : undefined}><div className="space-y-2"><div className="h-3 w-44 max-w-full skeleton" /><div className="h-3 w-64 max-w-full skeleton" /></div><div className="h-5 w-16 skeleton" /></div>) : requests.length === 0 ? <p className="p-4 text-xs text-zinc-500 dark:text-zinc-400">No correction requests yet.</p> : requests.map((request) => <div key={request._id || request.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-start gap-2.5"><Clock3 className="mt-0.5 size-4 text-zinc-400" /><div><p className="text-xs font-medium text-zinc-800 dark:text-zinc-100">{request.field === 'checkIn' ? 'Check-in' : 'Check-out'} · {formatDate(request.attendanceId?.date || request.requestedTime)} at {formatTime(request.requestedTime)}</p><p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">{request.reason}{request.reviewNote ? ` · Manager: ${request.reviewNote}` : ''}</p></div></div>
        <span className={`badge ${request.status === 'APPROVED' ? 'badge-success' : request.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>{request.status}</span>
      </div>)}
    </div>
    {!loading && <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / 10))} totalItems={total} onPageChange={setPage} />}
  </section>
}

export default AttendanceCorrectionRequests
