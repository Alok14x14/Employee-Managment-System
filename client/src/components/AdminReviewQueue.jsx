import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, CheckCircle2, Clock3, FileText } from 'lucide-react'
import { formatDate } from '../utils/formatters'

const AdminReviewQueue = ({ leaveRequests = [], correctionRequests = [], errors = [] }) => {
  const total = leaveRequests.length + correctionRequests.length
  const sections = useMemo(() => [
    {
      title: 'Leave requests', count: leaveRequests.length, href: '/leave', icon: FileText,
      empty: 'No leave requests need review.',
      rows: leaveRequests.map((leave) => {
        const employee = leave.employee || leave.employeeId
        return {
          id: leave._id || leave.id,
          name: `${employee?.firstName || 'Employee'} ${employee?.lastName || ''}`.trim(),
          detail: `${leave.type?.toLowerCase() || 'leave'} leave · ${formatDate(leave.startDate)} – ${formatDate(leave.endDate)}`,
          note: leave.reason,
          date: leave.createdAt,
        }
      }),
    },
    {
      title: 'Attendance corrections', count: correctionRequests.length, href: '/admin/attendance', icon: Clock3,
      empty: 'No attendance corrections need review.',
      rows: correctionRequests.map((request) => ({
        id: request._id || request.id,
        name: `${request.employeeId?.firstName || 'Employee'} ${request.employeeId?.lastName || ''}`.trim(),
        detail: `${request.field === 'checkIn' ? 'Missed check-in' : 'Missed check-out'} · ${formatDate(request.attendanceId?.date || request.requestedTime)} at ${new Intl.DateTimeFormat('en-IN', { timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(request.requestedTime))}`,
        note: request.reason,
        date: request.createdAt,
      })),
    },
  ], [leaveRequests, correctionRequests])

  return <section className="card overflow-hidden border-amber-200 dark:border-amber-900/60">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <div className="flex items-center gap-2.5"><span className={`flex size-8 items-center justify-center rounded-full ${total ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'}`}>{total ? <AlertCircle className="size-4" /> : <CheckCircle2 className="size-4" />}</span><div><h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Review queue</h2><p className="text-xs text-zinc-500 dark:text-zinc-400">{total ? `${total} item${total === 1 ? '' : 's'} awaiting your review` : 'All review requests are up to date'}</p></div></div>
      {total > 0 && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold tabular-nums text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">{total} pending</span>}
    </div>
    {errors.length > 0 && <p role="alert" className="border-b border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">Some review queues could not load. Refresh the dashboard to try again.</p>}
    <div className="grid divide-y divide-zinc-200 dark:divide-zinc-800 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
      {sections.map((section) => {
        const Icon = section.icon
        return <div key={section.title} className="min-w-0">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800"><h3 className="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200"><Icon className="size-3.5 text-zinc-500" />{section.title}<span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{section.count}</span></h3><Link to={section.href} className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400">Review<ArrowRight className="size-3" /></Link></div>
          {section.rows.length === 0 ? <p className="px-4 py-5 text-xs text-zinc-500 dark:text-zinc-400">{section.empty}</p> : <div className="max-h-[440px] divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">{section.rows.map((row) => <article key={row.id} className="px-4 py-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">{row.name}</p><p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300">{row.detail}</p>{row.note && <p className="mt-1 line-clamp-2 break-words text-[11px] text-zinc-500 dark:text-zinc-400">{row.note}</p>}</div><time className="shrink-0 text-[10px] text-zinc-400">{formatDate(row.date)}</time></div><Link to={section.href} className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400">Open request<ArrowRight className="size-3" /></Link></article>)}</div>}
        </div>
      })}
    </div>
  </section>
}

export default AdminReviewQueue
