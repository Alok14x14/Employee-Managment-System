import { useEffect, useState } from 'react'
import { Archive, ArrowLeft, CalendarDays, FileText, Mail, Pencil, Phone, X } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { formatCurrency, formatDate, formatStatus, formatTime } from '../utils/formatters'
import EmployeeForm from '../components/EmployeeForm'

const Detail = ({ label, children }) => <div className="min-w-0"><dt className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-zinc-900 dark:text-zinc-100">{children || '—'}</dd></div>

const EmployeeDetails = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const fetchDetails = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/employees/${id}/details`)
      setDetails(data.data)
    } catch (error) { toast.error(error?.response?.data?.error || 'Could not load employee details') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchDetails() }, [id])

  const archiveEmployee = async () => {
    setArchiving(true)
    try {
      await api.delete(`/employees/${id}`)
      toast.success('Employee account archived')
      navigate('/employees')
    } catch (error) { toast.error(error?.response?.data?.error || 'Could not archive employee') }
    finally { setArchiving(false) }
  }

  if (loading) return <div className="space-y-5" role="status" aria-label="Loading employee profile">
    <div className="h-8 w-48 rounded skeleton" />
    <div className="card h-44 skeleton" />
    <div className="grid gap-4 lg:grid-cols-2"><div className="card h-56 skeleton" /><div className="card h-56 skeleton" /></div>
  </div>
  if (!details) return <div className="card p-8 text-center"><p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Employee details unavailable</p><Link to="/employees" className="mt-4 inline-flex text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">Back to employees</Link></div>

  const { employee, attendance, leaves, payslips, documents, counts } = details
  const returnTo = location.state?.from || '/employees'
  const sectionClass = 'card overflow-hidden'
  const sectionTitle = 'border-b border-zinc-200 px-4 py-3 dark:border-zinc-800'
  const tableClass = 'data-table min-w-[620px]'

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><Link to={returnTo} className="mb-2 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"><ArrowLeft className="size-3.5" />Back</Link><h1 className="page-title">Employee profile</h1><p className="page-subtitle">Complete employment profile and recent records.</p></div>
    </div>

    <section className="card p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-lg font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">{employee.firstName?.[0]}{employee.lastName?.[0]}</div>
          <div className="min-w-0 flex-1"><h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{employee.firstName} {employee.lastName}</h2><p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{employee.position || 'No job title'} · {employee.department || 'Unassigned'}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-600 dark:text-zinc-300"><a className="inline-flex items-center gap-1.5 hover:text-blue-600" href={`mailto:${employee.email}`}><Mail className="size-3.5" />{employee.email}</a><span className="inline-flex items-center gap-1.5"><Phone className="size-3.5" />{employee.phone || 'No phone number'}</span></div></div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className={`badge ${employee.isDeleted ? 'badge-danger' : 'badge-success'}`}>{employee.isDeleted ? 'Archived' : formatStatus(employee.employmentStatus || 'ACTIVE')}</span>
          {!employee.isDeleted && <>
            <button type="button" onClick={() => setShowEdit(true)} className="btn-secondary"><Pencil className="size-3.5" />Edit employee</button>
            <button type="button" onClick={() => setShowArchiveConfirm(true)} className="btn-secondary text-rose-600 dark:text-rose-400"><Archive className="size-3.5" />Archive</button>
          </>}
        </div>
      </div>
      {employee.bio && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-600 dark:text-zinc-300">{employee.bio}</p>}
      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Detail label="Employee ID">{employee.id}</Detail>
        <Detail label="Account role">{formatStatus(employee.user?.role)}</Detail>
        <Detail label="Join date">{formatDate(employee.joinDate)}</Detail>
        <Detail label="Profile created">{formatDate(employee.createdAt)}</Detail>
      </dl>
    </section>

    <div className="grid gap-4 lg:grid-cols-2">
      <section className={sectionClass}><div className={sectionTitle}><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Employment details</h2></div><dl className="grid gap-4 p-4 sm:grid-cols-2"><Detail label="Position">{employee.position}</Detail><Detail label="Department">{employee.department}</Detail><Detail label="Employment status">{formatStatus(employee.employmentStatus || 'ACTIVE')}</Detail><Detail label="Join date">{formatDate(employee.joinDate)}</Detail><Detail label="Work email">{employee.email}</Detail><Detail label="Phone">{employee.phone}</Detail></dl></section>
      <section className={sectionClass}><div className={sectionTitle}><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Compensation</h2></div><dl className="grid gap-4 p-4 sm:grid-cols-2"><Detail label="Basic salary">{formatCurrency(employee.basicSalary)}</Detail><Detail label="Allowances">{formatCurrency(employee.allowances)}</Detail><Detail label="Deductions">{formatCurrency(employee.deductions)}</Detail><Detail label="Base net amount">{formatCurrency(Number(employee.basicSalary || 0) + Number(employee.allowances || 0) - Number(employee.deductions || 0))}</Detail></dl><p className="px-4 pb-4 text-[11px] text-zinc-500 dark:text-zinc-400">Base amounts from the employee profile. Issued payslips show actual monthly totals.</p></section>
    </div>

    <section className={sectionClass}><div className={`${sectionTitle} flex items-center justify-between`}><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Attendance history</h2><span className="text-[11px] text-zinc-500 dark:text-zinc-400">Latest 10 of {counts.attendance}</span></div><div className="overflow-x-auto"><table className={tableClass}><thead><tr><th>Date</th><th>Check in</th><th>Check out</th><th>Hours</th><th>Status</th></tr></thead><tbody>{attendance.length ? attendance.map((row) => <tr key={row.id}><td>{formatDate(row.date)}</td><td>{formatTime(row.checkIn)}</td><td>{formatTime(row.checkOut)}</td><td>{row.workingHours == null ? '—' : `${Number(row.workingHours).toFixed(2)} h`}</td><td><span className={`badge ${row.status === 'PRESENT' ? 'badge-success' : row.status === 'LATE' ? 'badge-warning' : 'badge-neutral'}`}>{formatStatus(row.status)}</span></td></tr>) : <tr><td colSpan={5} className="py-8 text-center text-xs text-zinc-500">No attendance records.</td></tr>}</tbody></table></div></section>

    <section className={sectionClass}><div className={`${sectionTitle} flex items-center justify-between`}><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Leave requests</h2><span className="text-[11px] text-zinc-500 dark:text-zinc-400">Latest 10 of {counts.leaves}</span></div><div className="overflow-x-auto"><table className={tableClass}><thead><tr><th>Type</th><th>Period</th><th>Days</th><th>Status</th><th>Reason</th></tr></thead><tbody>{leaves.length ? leaves.map((leave) => <tr key={leave.id}><td>{formatStatus(leave.type)}</td><td>{formatDate(leave.startDate)} – {formatDate(leave.endDate)}</td><td>{leave.workingDays ?? '—'}</td><td>{formatStatus(leave.status)}</td><td className="max-w-xs truncate" title={leave.reason}>{leave.reason}</td></tr>) : <tr><td colSpan={5} className="py-8 text-center text-xs text-zinc-500">No leave requests.</td></tr>}</tbody></table></div></section>

    <section className={sectionClass}><div className={`${sectionTitle} flex items-center justify-between`}><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Payslips</h2><span className="text-[11px] text-zinc-500 dark:text-zinc-400">Latest 10 of {counts.payslips}</span></div><div className="overflow-x-auto"><table className={tableClass}><thead><tr><th>Period</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net salary</th><th>Issued</th></tr></thead><tbody>{payslips.length ? payslips.map((slip) => <tr key={slip.id}><td>{new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(Date.UTC(slip.year, slip.month - 1, 1)))}</td><td>{formatCurrency(slip.basicSalary)}</td><td>{formatCurrency(slip.allowances)}</td><td>{formatCurrency(slip.deductions)}</td><td className="font-medium">{formatCurrency(slip.netSalary)}</td><td>{formatDate(slip.createdAt)}</td></tr>) : <tr><td colSpan={6} className="py-8 text-center text-xs text-zinc-500">No payslips.</td></tr>}</tbody></table></div></section>

    <section className={sectionClass}><div className={sectionTitle}><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Employee documents</h2><p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">Assigned documents and company policies. Document contents stay in the secure document viewer.</p></div>{documents.length ? <div className="divide-y divide-zinc-100 dark:divide-zinc-800">{documents.map((document) => <div key={document.id} className="flex items-center gap-3 px-4 py-3"><FileText className="size-4 shrink-0 text-blue-600 dark:text-blue-400" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">{document.title}</p><p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">{formatStatus(document.category)} · {document.audience === 'ALL' ? 'Company-wide' : 'Private'} · Added {formatDate(document.createdAt)}</p></div></div>)}</div> : <p className="px-4 py-8 text-center text-xs text-zinc-500">No employee documents.</p>}</section>

    <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400"><CalendarDays className="size-3.5" />Records show the most recent activity. Use the relevant admin pages for complete history and document actions.</div>

    {showEdit && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/25 p-4 dark:bg-black/60" onClick={() => setShowEdit(false)}><section className="card my-8 w-full max-w-xl p-6" onClick={(event) => event.stopPropagation()}><div className="mb-5 flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800"><div><h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Edit employee</h2><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Update this employee’s profile and employment details.</p></div><button type="button" onClick={() => setShowEdit(false)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800" aria-label="Close edit form"><X className="size-4" /></button></div><EmployeeForm initialData={employee} onSuccess={() => { setShowEdit(false); fetchDetails() }} onCancel={() => setShowEdit(false)} /></section></div>}

    {showArchiveConfirm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4 dark:bg-black/60" onClick={() => setShowArchiveConfirm(false)}><section role="alertdialog" aria-modal="true" aria-labelledby="archive-employee-title" className="card w-full max-w-md p-5 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><h2 id="archive-employee-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Archive this employee?</h2><p className="mt-2 text-xs leading-5 text-zinc-600 dark:text-zinc-300">Archiving <strong>{employee.firstName} {employee.lastName}</strong> will revoke their account access. Their attendance, leave, and payroll history will be retained.</p></div><button type="button" onClick={() => setShowArchiveConfirm(false)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800" aria-label="Close confirmation"><X className="size-4" /></button></div><div className="mt-5 flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800"><button type="button" disabled={archiving} onClick={() => setShowArchiveConfirm(false)} className="btn-secondary">Cancel</button><button type="button" disabled={archiving} onClick={archiveEmployee} className="btn-danger">{archiving ? 'Archiving…' : 'Archive employee'}</button></div></section></div>}
  </div>
}

export default EmployeeDetails
