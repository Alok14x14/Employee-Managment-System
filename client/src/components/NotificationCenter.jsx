import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellIcon, CalendarDaysIcon, CircleCheckIcon, Clock3, FileTextIcon, Megaphone, WalletCardsIcon, XIcon } from 'lucide-react'
import api from '../api/axios'

const DAY_MS = 24 * 60 * 60 * 1000
const dateLabel = (value) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date(value))
const istDateKey = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date)

const PAGE_NOTIFICATION_TYPES = {
  '/leave': ['leave'],
  '/payslips': ['payslip'],
  '/documents': ['document'],
  '/announcements': ['announcement'],
}

const NotificationCenter = ({ userId, pathname, onUnreadChange }) => {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`staffflow-notifications-read-${userId}`) || '[]') }
    catch { return [] }
  })

  const refresh = useCallback(async () => {
    const year = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Kolkata', year: 'numeric' }).format(new Date())
    const [leaveResult, payslipResult, attendanceResult, holidayResult, correctionResult, documentResult, announcementResult] = await Promise.allSettled([
      api.get('/leave'), api.get('/payslips'), api.get('/attendance'), api.get(`/holidays?year=${year}`),
      api.get('/attendance/corrections'), api.get('/documents'), api.get('/announcements'),
    ])
    const next = []
    const cutoff = Date.now() - 90 * DAY_MS

    if (leaveResult.status === 'fulfilled') {
      for (const leave of leaveResult.value.data.data || []) {
        if (leave.status === 'PENDING' || new Date(leave.updatedAt || leave.createdAt).getTime() < cutoff) continue
        const approved = leave.status === 'APPROVED'
        next.push({
          id: `leave-${leave._id}`, type: 'leave', href: '/leave',
          title: `Leave request ${approved ? 'approved' : 'declined'}`,
          detail: `${leave.type?.toLowerCase()} leave · ${dateLabel(leave.startDate)}${leave.rejectReason ? ` · ${leave.rejectReason}` : ''}`,
          date: leave.updatedAt || leave.createdAt,
        })
      }
    }

    if (payslipResult.status === 'fulfilled') {
      for (const slip of (payslipResult.value.data.data || []).slice(0, 10)) {
        if (new Date(slip.createdAt).getTime() < cutoff) continue
        const month = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(Date.UTC(slip.year, slip.month - 1, 1)))
        next.push({ id: `payslip-${slip._id}`, type: 'payslip', href: '/payslips', title: 'New payslip available', detail: `Your ${month} payslip is ready to view.`, date: slip.createdAt })
      }
    }

    const today = istDateKey()
    if (attendanceResult.status === 'fulfilled') {
      const record = attendanceResult.value.data.todayRecord
      if (record?.checkIn && !record?.checkOut) {
        next.push({ id: `checkout-${today}`, type: 'attendance', href: '/attendance', title: 'Remember to check out', detail: 'Your attendance is still open for today.', date: new Date().toISOString(), reminder: true })
      }
    }

    if (holidayResult.status === 'fulfilled') {
      const upcoming = (holidayResult.value.data.data || []).filter((holiday) => {
        const key = istDateKey(new Date(holiday.date))
        const days = Math.round((new Date(`${key}T00:00:00+05:30`).getTime() - new Date(`${today}T00:00:00+05:30`).getTime()) / DAY_MS)
        return days >= 0 && days <= 7
      })
      for (const holiday of upcoming) {
        next.push({ id: `holiday-${holiday._id}`, type: 'holiday', href: '/dashboard', title: 'Upcoming public holiday', detail: `${holiday.name} · ${dateLabel(holiday.date)}`, date: holiday.date })
      }
    }
    if (correctionResult.status === 'fulfilled') {
      for (const request of correctionResult.value.data.data || []) {
        if (request.status === 'PENDING' || new Date(request.updatedAt || request.createdAt).getTime() < cutoff) continue
        const approved = request.status === 'APPROVED'
        const date = request.attendanceId?.date || request.requestedTime
        next.push({
          id: `correction-${request._id}`, type: 'correction', href: '/attendance',
          title: `Attendance correction ${approved ? 'approved' : 'rejected'}`,
          detail: `${request.field === 'checkIn' ? 'Check-in' : 'Check-out'} · ${dateLabel(date)}${request.reviewNote ? ` · ${request.reviewNote}` : ''}`,
          date: request.updatedAt || request.createdAt,
        })
      }
    }
    if (documentResult.status === 'fulfilled') {
      const categoryLabels = { OFFER_LETTER: 'Offer letter', TAX_FORM: 'Tax form', POLICY: 'Company policy', OTHER: 'Employee document' }
      for (const document of documentResult.value.data.data || []) {
        if (new Date(document.createdAt).getTime() < cutoff) continue
        next.push({
          id: `document-${document._id}`, type: 'document', href: '/documents',
          title: 'New employee document available',
          detail: `${document.title} · ${categoryLabels[document.category] || 'Document'}`,
          date: document.createdAt,
        })
      }
    }
    if (announcementResult.status === 'fulfilled') {
      for (const announcement of announcementResult.value.data.data || []) {
        if (new Date(announcement.createdAt).getTime() < cutoff) continue
        next.push({
          id: `announcement-${announcement._id}`, type: 'announcement', href: '/announcements',
          title: 'Company announcement', detail: announcement.title, date: announcement.createdAt,
        })
      }
    }
    setItems(next.sort((a, b) => new Date(b.date) - new Date(a.date)))
  }, [])

  useEffect(() => {
    refresh()
    const interval = window.setInterval(refresh, 60_000)
    return () => window.clearInterval(interval)
  }, [refresh])

  useEffect(() => {
    const unreadByType = { leave: 0, payslip: 0, document: 0, announcement: 0 }
    for (const item of items) {
      if (Object.hasOwn(unreadByType, item.type) && !readIds.includes(item.id)) unreadByType[item.type] += 1
    }
    onUnreadChange(unreadByType)
  }, [items, readIds, onUnreadChange])

  useEffect(() => {
    const types = PAGE_NOTIFICATION_TYPES[pathname]
    if (!types) return
    const ids = items.filter((item) => types.includes(item.type) && !readIds.includes(item.id)).map((item) => item.id)
    if (!ids.length) return
    setReadIds((current) => {
      const next = [...new Set([...current, ...ids])].slice(-200)
      localStorage.setItem(`staffflow-notifications-read-${userId}`, JSON.stringify(next))
      return next
    })
  }, [items, pathname, readIds, userId])

  const toggleOpen = () => {
    if (!open) refresh()
    setOpen((value) => !value)
  }

  const unreadCount = useMemo(() => items.filter((item) => !readIds.includes(item.id)).length, [items, readIds])
  const markAllRead = () => {
    const ids = items.map((item) => item.id)
    setReadIds((current) => {
      const next = [...new Set([...current, ...ids])].slice(-200)
      localStorage.setItem(`staffflow-notifications-read-${userId}`, JSON.stringify(next))
      return next
    })
  }
  const icons = { leave: FileTextIcon, payslip: WalletCardsIcon, attendance: CircleCheckIcon, holiday: CalendarDaysIcon, correction: Clock3, document: FileTextIcon, announcement: Megaphone }

  return (
    <div className="relative">
      <button type="button" onClick={toggleOpen} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={open}
        className="relative inline-flex size-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
        <BellIcon className="size-4" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-blue-600 px-1 text-center text-[10px] leading-4 text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open && <div className="absolute left-0 top-10 z-[60] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div><h2 className="text-sm font-semibold">Notifications</h2><p className="text-[11px] text-zinc-500 dark:text-zinc-400">{unreadCount ? `${unreadCount} unread` : 'You’re all caught up'}</p></div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && <button type="button" onClick={markAllRead} className="text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400">Mark all read</button>}
            <button type="button" onClick={() => setOpen(false)} aria-label="Close notifications" className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"><XIcon className="size-4" /></button>
          </div>
        </div>
        <div className="max-h-[min(60vh,420px)] overflow-y-auto">
          {items.length === 0 ? <p className="px-4 py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">No new updates or reminders.</p> : items.map((item) => {
            const Icon = icons[item.type]
            const unread = !readIds.includes(item.id)
            return <Link key={item.id} to={item.href} onClick={() => { setReadIds((current) => { const next = [...new Set([...current, item.id])].slice(-200); localStorage.setItem(`staffflow-notifications-read-${userId}`, JSON.stringify(next)); return next }); setOpen(false) }} className={`flex gap-3 border-b border-zinc-100 px-4 py-3 last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/60 ${unread ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''}`}>
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"><Icon className="size-4" /></span>
              <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 text-xs font-medium text-zinc-900 dark:text-zinc-100">{item.title}{unread && <span className="size-1.5 rounded-full bg-blue-600" />}</span><span className="mt-1 block text-[11px] text-zinc-500 dark:text-zinc-400">{item.detail}</span><span className="mt-1 block text-[10px] text-zinc-400">{dateLabel(item.date)}{item.reminder ? ' · Reminder' : ''}</span></span>
            </Link>
          })}
        </div>
      </div>}
    </div>
  )
}

export default NotificationCenter
