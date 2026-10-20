import { useCallback, useEffect, useState } from 'react'
import { Megaphone, Send, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/formatters'
import Pagination from '../components/Pagination'

const Announcements = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [announcements, setAnnouncements] = useState([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', expiresAt: '' })

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/announcements?page=${page}&limit=10`)
      setAnnouncements(data.data || [])
      setTotal(data.total || 0)
    } catch (error) { toast.error(error?.response?.data?.error || 'Failed to load announcements') }
    finally { setLoading(false) }
  }, [page])
  useEffect(() => { fetchAnnouncements() }, [fetchAnnouncements])
  const totalPages = Math.max(1, Math.ceil(total / 10))

  const publish = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await api.post('/announcements', form)
      toast.success('Announcement published')
      setForm({ title: '', message: '', expiresAt: '' })
      event.target.reset()
      fetchAnnouncements()
    } catch (error) { toast.error(error?.response?.data?.error || 'Could not publish announcement') }
    finally { setSaving(false) }
  }

  const remove = async (announcement) => {
    if (!window.confirm(`Delete “${announcement.title}”?`)) return
    try {
      await api.delete(`/announcements/${announcement._id || announcement.id}`)
      toast.success('Announcement deleted')
      fetchAnnouncements()
    } catch (error) { toast.error(error?.response?.data?.error || 'Could not delete announcement') }
  }

  return <div className="space-y-6">
    <div className="page-header"><div><h1 className="page-title">Company announcements</h1><p className="page-subtitle">Important notices and policy updates from your organization.</p></div></div>

    {isAdmin && <section className="card p-4 sm:p-5"><div className="mb-4"><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Publish an announcement</h2><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Employees will see it here and in their notifications, and receive an email.</p></div><form onSubmit={publish} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]"><label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Title<input required minLength={3} maxLength={140} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Updated remote work policy" className="mt-1" /></label><label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Visible until (optional)<input type="date" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} className="mt-1" /></label><label className="text-xs font-medium text-zinc-600 dark:text-zinc-300 sm:col-span-2">Message<textarea required minLength={5} maxLength={4000} rows={4} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Share the notice or policy update…" className="mt-1" /></label><div className="sm:col-span-2"><button type="submit" disabled={saving} className="btn-primary"><Send className="size-3.5" />{saving ? 'Publishing…' : 'Publish announcement'}</button></div></form></section>}

    {loading ? <div className="space-y-3" role="status" aria-label="Loading announcements">{Array.from({ length: 10 }).map((_, i) => <article key={i} className="card flex gap-3 p-4 sm:p-5"><div className="size-9 shrink-0 rounded-lg skeleton" /><div className="flex-1 space-y-3"><div className="h-4 w-48 max-w-full rounded skeleton" /><div className="h-3 w-32 rounded skeleton" /><div className="space-y-2 pt-1"><div className="h-3 w-full rounded skeleton" /><div className="h-3 w-5/6 rounded skeleton" /></div></div></article>)}</div> : announcements.length === 0 ? <div className="card flex flex-col items-center p-12 text-center"><Megaphone className="size-8 text-zinc-300 dark:text-zinc-600" /><p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">No announcements yet</p><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Important company notices will appear here.</p></div> : <div className="space-y-3">{announcements.map((announcement) => <article key={announcement._id || announcement.id} className="card flex gap-3 p-4 sm:p-5"><div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"><Megaphone className="size-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{announcement.title}</h2><p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">Published {formatDate(announcement.createdAt)}{announcement.expiresAt ? ` · Visible until ${formatDate(announcement.expiresAt)}` : ''}</p></div>{isAdmin && <button type="button" onClick={() => remove(announcement)} className="btn-secondary px-2.5 text-rose-600 dark:text-rose-400" aria-label={`Delete ${announcement.title}`}><Trash2 className="size-3.5" /></button>}</div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-700 dark:text-zinc-300">{announcement.message}</p></div></article>)}</div>}
    {!loading && <Pagination page={page} totalPages={totalPages} totalItems={total} onPageChange={setPage} />}
  </div>
}

export default Announcements
