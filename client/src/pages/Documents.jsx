import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Eye, FileText, Trash2, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { formatDate } from '../utils/formatters'

const categories = {
  OFFER_LETTER: 'Offer letter',
  TAX_FORM: 'Tax form',
  POLICY: 'Company policy',
  OTHER: 'Other',
}
const readableSize = (bytes) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

const Documents = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [documents, setDocuments] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [preview, setPreview] = useState(null)
  const [form, setForm] = useState({ title: '', category: 'OFFER_LETTER', employeeId: '', file: null })

  const fetchDocuments = useCallback(async () => {
    try {
      const { data } = await api.get('/documents')
      setDocuments(data.data || [])
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to load documents')
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchDocuments() }, [fetchDocuments])
  useEffect(() => {
    if (isAdmin) api.get('/employees').then(({ data }) => setEmployees(data.filter((employee) => !employee.isDeleted))).catch(() => toast.error('Could not load employee list'))
  }, [isAdmin])
  useEffect(() => () => { if (preview?.url) URL.revokeObjectURL(preview.url) }, [preview])

  const groups = useMemo(() => {
    const order = ['OFFER_LETTER', 'TAX_FORM', 'POLICY', 'OTHER']
    return order.map((category) => ({ category, documents: documents.filter((document) => document.category === category) })).filter((group) => group.documents.length)
  }, [documents])

  const fetchFile = async (document, download = false) => {
    setBusyId(document.id || document._id)
    try {
      const { data } = await api.get(`/documents/${document.id || document._id}/content${download ? '?download=1' : ''}`, { responseType: 'blob' })
      const url = URL.createObjectURL(data)
      if (download) {
        const anchor = window.document.createElement('a')
        anchor.href = url
        anchor.download = document.fileName || `${document.title}.pdf`
        anchor.click()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      } else {
        setPreview({ document, url })
      }
    } catch (error) {
      let message = error?.response?.data?.error
      if (!message && error?.response?.data instanceof Blob) {
        try {
          const payload = JSON.parse(await error.response.data.text())
          message = payload.error
        } catch { /* The response was not a JSON error payload. */ }
      }
      toast.error(message || error?.message || 'Unable to open this document')
    }
    finally { setBusyId(null) }
  }

  const upload = async (event) => {
    event.preventDefault()
    if (!form.file) return toast.error('Select a PDF to upload')
    if (form.file.type !== 'application/pdf') return toast.error('Only PDF files are supported')
    if (!form.employeeId && !(form.category === 'POLICY' && form.employeeId === 'ALL')) return toast.error('Choose an employee or share a policy with everyone')
    const body = new FormData()
    body.append('title', form.title)
    body.append('category', form.category)
    body.append('employeeId', form.employeeId)
    body.append('file', form.file)
    try {
      await api.post('/documents', body)
      toast.success('Document uploaded securely')
      setForm({ title: '', category: 'OFFER_LETTER', employeeId: '', file: null })
      event.target.reset()
      fetchDocuments()
    } catch (error) { toast.error(error?.response?.data?.error || 'Upload failed') }
  }

  const removeDocument = async (document) => {
    if (!window.confirm(`Delete “${document.title}”?`)) return
    try {
      await api.delete(`/documents/${document.id || document._id}`)
      toast.success('Document deleted')
      fetchDocuments()
    } catch (error) { toast.error(error?.response?.data?.error || 'Could not delete document') }
  }

  return <div className="space-y-6">
    <div className="page-header"><div><h1 className="page-title">Employee documents</h1><p className="page-subtitle">Securely view and download your employment documents and company policies.</p></div></div>

    {isAdmin && <section className="card p-4 sm:p-5">
      <div className="mb-4"><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Upload a document</h2><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">PDF only, up to 5 MB. Employee documents are private; policies can be shared with everyone.</p></div>
      <form onSubmit={upload} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Document title<input required maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. 2026 Tax Form" className="mt-1" /></label>
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, employeeId: e.target.value === 'POLICY' && form.employeeId === 'ALL' ? 'ALL' : '' })} className="mt-1">{Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Access<select required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="mt-1"><option value="">Select employee…</option>{form.category === 'POLICY' && <option value="ALL">Everyone (company policy)</option>}{employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.firstName} {employee.lastName}</option>)}</select></label>
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">PDF file<input required type="file" accept="application/pdf,.pdf" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} className="mt-1 file:mr-2 file:rounded file:border-0 file:bg-zinc-100 file:px-2 file:py-1 file:text-xs dark:file:bg-zinc-800" /></label>
        <div className="sm:col-span-2 lg:col-span-4"><button type="submit" className="btn-primary"><Upload className="size-3.5" />Upload PDF</button></div>
      </form>
    </section>}

    {loading ? <div className="space-y-4" role="status" aria-label="Loading documents">{Array.from({ length: 2 }).map((_, group) => <section key={group} className="card overflow-hidden"><div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800"><div className="h-4 w-28 rounded skeleton" /></div>{Array.from({ length: 3 }).map((_, row) => <div key={row} className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 last:border-0 dark:border-zinc-800"><div className="size-9 shrink-0 rounded-lg skeleton" /><div className="flex-1 space-y-2"><div className="h-3 w-48 max-w-full rounded skeleton" /><div className="h-3 w-64 max-w-full rounded skeleton" /></div><div className="hidden h-8 w-24 rounded skeleton sm:block" /></div>)}</section>)}</div> : documents.length === 0 ? <div className="card flex flex-col items-center p-12 text-center"><FileText className="size-8 text-zinc-300 dark:text-zinc-600" /><p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">No documents yet</p><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Documents shared with you will appear here.</p></div> : groups.map(({ category, documents: group }) => <section key={category} className="card overflow-hidden"><div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800"><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{categories[category]}</h2></div><div className="divide-y divide-zinc-100 dark:divide-zinc-800">{group.map((document) => <article key={document.id || document._id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"><FileText className="size-4" /></span><div className="min-w-0"><p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{document.title}</p><p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{isAdmin ? document.audience === 'ALL' ? 'Shared with everyone' : `${document.employeeId?.firstName || ''} ${document.employeeId?.lastName || ''}` : 'Shared with you'} · {readableSize(document.fileSize)} · Added {formatDate(document.createdAt)}</p></div></div><div className="flex shrink-0 items-center gap-2"><button type="button" disabled={busyId === (document.id || document._id)} onClick={() => fetchFile(document)} className="btn-secondary px-2.5"><Eye className="size-3.5" />View</button><button type="button" disabled={busyId === (document.id || document._id)} onClick={() => fetchFile(document, true)} className="btn-secondary px-2.5"><Download className="size-3.5" />Download</button>{isAdmin && <button type="button" onClick={() => removeDocument(document)} aria-label={`Delete ${document.title}`} className="btn-secondary px-2.5 text-rose-600 dark:text-rose-400"><Trash2 className="size-3.5" /></button>}</div></article>)}</div></section>)}

    {preview && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={`Preview ${preview.document.title}`} onClick={() => setPreview(null)}><section className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}><header className="flex items-center justify-between gap-4 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800"><div className="min-w-0"><h2 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{preview.document.title}</h2><p className="text-[11px] text-zinc-500 dark:text-zinc-400">Private document preview</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => fetchFile(preview.document, true)} className="btn-secondary px-2.5"><Download className="size-3.5" />Download</button><button type="button" onClick={() => setPreview(null)} aria-label="Close preview" className="rounded p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="size-4" /></button></div></header><iframe title={preview.document.title} src={preview.url} className="min-h-0 flex-1 bg-zinc-100 dark:bg-zinc-950" /></section></div>}
  </div>
}

export default Documents
