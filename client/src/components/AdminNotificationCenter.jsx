import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellIcon, Clock3, FileTextIcon, UserPlus, XIcon } from 'lucide-react'
import api from '../api/axios'

const dateLabel = (value) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date(value))
const DAY_MS = 24 * 60 * 60 * 1000

const AdminNotificationCenter = ({ userId }) => {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`staffflow-admin-notifications-read-${userId}`) || '[]') }
    catch { return [] }
  })

  const refresh = useCallback(async () => {
    const results = await Promise.allSettled([
      api.get('/leave'),
      api.get('/attendance/corrections?status=PENDING'),
      api.get('/employees'),
    ])
    const next = []
    const cutoff = Date.now() - 30 * DAY_MS

    if (results[0].status === 'fulfilled') {
      for (const leave of results[0].value.data.data || []) {
        if (leave.status !== 'PENDING') continue
        const employee = leave.employee || leave.employeeId
        next.push({
          id: `leave-${leave._id}`, type: 'leave', href: '/leave',
          title: 'Leave request needs review',
          detail: `${employee?.firstName || 'Employee'} ${employee?.lastName || ''} · ${leave.type?.toLowerCase()} · ${dateLabel(leave.startDate)}`,
          date: leave.createdAt,
        })
      }
    }

    if (results[1].status === 'fulfilled') {
      for (const request of results[1].value.data.data || []) {
        const employee = request.employeeId
        next.push({
          id: `correction-${request._id}`, type: 'correction', href: '/admin/attendance/corrections',
          title: 'Attendance correction needs review',
          detail: `${employee?.firstName || 'Employee'} ${employee?.lastName || ''} · ${request.field === 'checkIn' ? 'check-in' : 'check-out'} · ${dateLabel(request.attendanceId?.date || request.requestedTime)}`,
          date: request.createdAt,
        })
      }
    }

    if (results[2].status === 'fulfilled') {
      for (const employee of results[2].value.data || []) {
        if (new Date(employee.createdAt).getTime() < cutoff) continue
        next.push({
          id: `employee-${employee._id}`, type: 'employee', href: '/employees',
          title: 'New employee added',
          detail: `${employee.firstName} ${employee.lastName} · ${employee.department || 'Unassigned'}`,
          date: employee.createdAt,
        })
      }
    }
    setItems(next.sort((a, b) => new Date(b.date) - new Date(a.date)))
  }, [])

  const toggleOpen = () => {
    if (!open) refresh()
    setOpen((value) => !value)
  }

  const unreadCount = useMemo(() => items.filter((item) => !readIds.includes(item.id)).length, [items, readIds])
  const saveRead = (ids) => setReadIds((current) => {
    const next = [...new Set([...current, ...ids])].slice(-300)
    localStorage.setItem(`staffflow-admin-notifications-read-${userId}`, JSON.stringify(next))
    return next
  })
  const icons = { leave: FileTextIcon, correction: Clock3, employee: UserPlus }

  return <div className="relative">
    <button type="button" onClick={toggleOpen} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={open}
      className="relative inline-flex size-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
      <BellIcon className="size-4" />
      {unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-blue-600 px-1 text-center text-[10px] leading-4 text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
    </button>
    {open && <div className="absolute left-0 top-10 z-[60] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div><h2 className="text-sm font-semibold">Notifications</h2><p className="text-[11px] text-zinc-500 dark:text-zinc-400">{unreadCount ? `${unreadCount} unread` : 'You’re all caught up'}</p></div>
        <div className="flex items-center gap-2">{unreadCount > 0 && <button type="button" onClick={() => saveRead(items.map((item) => item.id))} className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400">Mark all read</button>}<button type="button" onClick={() => setOpen(false)} aria-label="Close notifications" className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"><XIcon className="size-4" /></button></div>
      </div>
      <div className="max-h-[min(60vh,420px)] overflow-y-auto">
        {items.length === 0 ? <p className="px-4 py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">No pending items or recent updates.</p> : items.map((item) => {
          const Icon = icons[item.type]
          const unread = !readIds.includes(item.id)
          return <Link key={item.id} to={item.href} onClick={() => { saveRead([item.id]); setOpen(false) }} className={`flex gap-3 border-b border-zinc-100 px-4 py-3 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60 ${unread ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''}`}>
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"><Icon className="size-4" /></span>
            <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 text-xs font-medium text-zinc-900 dark:text-zinc-100">{item.title}{unread && <span className="size-1.5 rounded-full bg-blue-600" />}</span><span className="mt-1 block text-[11px] text-zinc-500 dark:text-zinc-400">{item.detail}</span><span className="mt-1 block text-[10px] text-zinc-400">{dateLabel(item.date)}</span></span>
          </Link>
        })}
      </div>
    </div>}
  </div>
}

export default AdminNotificationCenter
