import { useCallback, useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Search, RefreshCw, ChevronLeft, ChevronRight, AlertCircle, Calendar } from 'lucide-react'
import { useDepartments } from '../constants/departments'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { formatISTDate, formatTime } from '../utils/formatters'
import { getWorkingHoursDisplay } from '../utils/attendance'
import Pagination from '../components/Pagination'

const getTodayIST = () => {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

const addDays = (dateStr, days) => {
  if (!dateStr) return getTodayIST()
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  const py = dt.getUTCFullYear()
  const pm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const pd = String(dt.getUTCDate()).padStart(2, '0')
  return `${py}-${pm}-${pd}`
}

const AdminAttendance = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const departments = useDepartments()
  const [searchParams, setSearchParams] = useSearchParams()
  const todayIST = getTodayIST()

  const [data, setData] = useState([])
  const [summary, setSummary] = useState({
    totalActive: 0,
    present: 0,
    late: 0,
    stillWorking: 0,
    checkedOut: 0,
    notCheckedIn: 0,
    onLeave: 0,
    absent: 0,
  })

  // Read initial date from URL query param if valid and not future; otherwise today in IST
  const initialDate = (() => {
    const urlDate = searchParams.get('date')
    if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate) && urlDate <= todayIST) {
      return urlDate
    }
    return todayIST
  })()

  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [currentDate, setCurrentDate] = useState('')
  const [dayInfo, setDayInfo] = useState({ type: 'WORKING' })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalRows, setTotalRows] = useState(0)

  const isViewingToday = selectedDate === todayIST

  // Keep refs so the fetch handler always uses the latest selection
  const selectedDeptRef = useRef(selectedDept)
  selectedDeptRef.current = selectedDept

  const selectedDateRef = useRef(selectedDate)
  selectedDateRef.current = selectedDate
  const searchRef = useRef(search)
  searchRef.current = search
  const statusRef = useRef(selectedStatus)
  statusRef.current = selectedStatus
  const pageRef = useRef(page)
  pageRef.current = page

  const handleDateSelect = useCallback((newDate) => {
    if (!newDate) return
    if (newDate > todayIST) {
      toast.error('Cannot view attendance for future dates')
      return
    }
    setPage(1)
    setSelectedDate(newDate)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('date', newDate)
      return next
    }, { replace: true })
  }, [todayIST, setSearchParams])

  // Sync state if URL searchParams change externally (e.g. browser back/forward)
  useEffect(() => {
    const urlDate = searchParams.get('date')
    if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate) && urlDate <= todayIST) {
      if (urlDate !== selectedDate) {
        setSelectedDate(urlDate)
      }
    } else if (!urlDate && selectedDate !== todayIST) {
      setSelectedDate(todayIST)
    }
  }, [searchParams, todayIST, selectedDate])

  const fetchAttendance = useCallback(async (isInitial = false, ignoreRef = null) => {
    if (isInitial) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    try {
      const params = new URLSearchParams()
      if (selectedDeptRef.current) {
        params.append('department', selectedDeptRef.current)
      }
      if (selectedDateRef.current) {
        params.append('date', selectedDateRef.current)
      }
      params.set('page', String(pageRef.current))
      params.set('limit', '10')
      if (searchRef.current.trim()) params.set('search', searchRef.current.trim())
      if (statusRef.current !== 'ALL') params.set('status', statusRef.current)

      const res = await api.get(`/attendance/admin/today?${params.toString()}`)
      if (ignoreRef && ignoreRef.current) return

      setData(res.data.data || [])
      setTotalRows(res.data.total || 0)
      setSummary(res.data.summary || {
        totalActive: 0,
        present: 0,
        late: 0,
        stillWorking: 0,
        checkedOut: 0,
        notCheckedIn: 0,
        onLeave: 0,
        absent: 0,
      })
      setCurrentDate(res.data.date || selectedDateRef.current)
      setDayInfo(res.data.dayInfo || { type: 'WORKING' })
    } catch (err) {
      if (ignoreRef && ignoreRef.current) return
      const msg = err.response?.data?.error || err.message || 'Failed to fetch attendance records'
      toast.error(msg)
    } finally {
      if (!ignoreRef || !ignoreRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  // Refetch when department or selected date changes, with stale-response protection
  useEffect(() => {
    const ignoreRef = { current: false }
    fetchAttendance(true, ignoreRef)

    return () => {
      ignoreRef.current = true
    }
  }, [selectedDept, selectedDate, selectedStatus, search, page, fetchAttendance])

  // Auto-refresh every 60 seconds; only active when viewing today in IST
  useEffect(() => {
    if (selectedDate !== todayIST) return

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAttendance(false)
      }
    }, 60000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAttendance(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [selectedDate, todayIST, fetchAttendance])

  // Client-side search and status filtering
  const totalPages = Math.max(1, Math.ceil(totalRows / 10))

  const isNonWorkingDay = dayInfo?.type === 'WEEKEND' || dayInfo?.type === 'HOLIDAY'

  const stats = [
    {
      label: 'Present',
      value: summary.present,
      helper: isViewingToday ? 'Checked in today' : 'Checked in on date',
      statusFilter: 'PRESENT',
    },
    {
      label: 'Late',
      value: summary.late,
      helper: 'Check-in after 9:00 AM',
      statusFilter: 'LATE',
    },
    {
      label: 'On leave',
      value: summary.onLeave ?? 0,
      helper: 'Approved time off',
      statusFilter: 'ON_LEAVE',
    },
    {
      label: 'Absent',
      value: summary.absent ?? 0,
      helper: isViewingToday
        ? 'Not checked in'
        : isNonWorkingDay
        ? 'Non-working day'
        : 'Unexcused absence',
      statusFilter: 'ABSENT',
    },
    {
      label: isViewingToday ? 'Still working' : 'Checked out',
      value: isViewingToday ? summary.stillWorking : summary.checkedOut,
      helper: isViewingToday ? 'Active on shift' : 'Completed shift',
    },
  ]

  const formattedDateSubtitle = formatISTDate(currentDate || selectedDate, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isViewingToday ? "Today's attendance" : 'Attendance'}
          </h1>
          <p className="page-subtitle">{formattedDateSubtitle}</p>
        </div>
      </div>

      {/* Non-working Day Banner */}
      {isNonWorkingDay && (
        <div className="card p-3.5 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 flex items-center gap-2.5 text-amber-900 dark:text-amber-200 text-xs">
          <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            {dayInfo.type === 'WEEKEND' ? (
              <>
                <strong>Non-working day:</strong> Weekend (Saturday / Sunday). Regular attendance is not expected.
              </>
            ) : (
              <>
                <strong>Non-working day:</strong> Public Holiday ({dayInfo.holidayName || 'Holiday'}). Regular attendance is not expected.
              </>
            )}
          </span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((s) => {
          const isClickable = s.statusFilter !== undefined
          const isSelected = selectedStatus === s.statusFilter
          return (
            <button
              type="button"
              key={s.label}
              onClick={() => {
                if (!isClickable) return
                setPage(1)
                setSelectedStatus((prev) => (prev === s.statusFilter ? 'ALL' : s.statusFilter))
              }}
              className={`card p-4 text-left transition-all ${
                isClickable ? 'cursor-pointer hover:border-[#D4D4D8] dark:hover:border-[#3F3F46]' : ''
              } ${
                isSelected
                  ? 'ring-2 ring-primary border-transparent dark:ring-blue-500'
                  : ''
              }`}
            >
              <p className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">{s.label}</p>
              <p className="text-2xl font-semibold text-[#18181B] dark:text-[#FAFAFA] mt-1 tabular-nums tracking-tight">
                {loading ? '—' : s.value}
              </p>
              {s.helper && (
                <p className="text-[11px] text-[#A1A1AA] dark:text-[#71717A] mt-1 truncate">{s.helper}</p>
              )}
            </button>
          )
        })}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] dark:text-[#71717A] size-4" />
          <input
            placeholder="Search by name, email, or title..."
            className="pl-9"
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            value={search}
          />
        </div>

        {/* Date Selector Navigation Group */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          <div className="inline-flex items-center h-9 rounded-[6px] border border-[#E4E4E7] dark:border-[#27272A] bg-white dark:bg-[#18181B] px-1 shadow-xs">
            <button
              type="button"
              onClick={() => handleDateSelect(addDays(selectedDate, -1))}
              disabled={loading}
              className="size-7 flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] rounded-[4px] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors shrink-0"
              title="Previous day"
              aria-label="Previous day"
            >
              <ChevronLeft className="size-3.5" />
            </button>

            <div
              className="relative flex items-center justify-center gap-1.5 px-2.5 h-full cursor-pointer hover:bg-[#F4F4F5]/60 dark:hover:bg-[#27272A]/60 rounded-[4px] transition-colors"
              title="Click to choose date"
            >
              <Calendar className="size-3.5 text-[#71717A] dark:text-[#A1A1AA] shrink-0" />
              <span className="text-xs font-medium text-[#18181B] dark:text-[#FAFAFA] tabular-nums whitespace-nowrap select-none">
                {formatISTDate(selectedDate, { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <input
                type="date"
                value={selectedDate}
                max={todayIST}
                onChange={(e) => handleDateSelect(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                aria-label="Choose attendance date"
              />
            </div>

            <button
              type="button"
              onClick={() => handleDateSelect(addDays(selectedDate, 1))}
              disabled={loading || selectedDate >= todayIST}
              className="size-7 flex items-center justify-center text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] rounded-[4px] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors shrink-0"
              title="Next day"
              aria-label="Next day"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleDateSelect(todayIST)}
            disabled={selectedDate === todayIST || loading}
            className="btn-secondary h-9 px-3.5 text-xs font-medium shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Jump to today"
          >
            Today
          </button>
        </div>

        {/* Department Filter */}
        <select
          value={selectedDept}
          onChange={(e) => { setSelectedDept(e.target.value); setPage(1) }}
          className="sm:w-44"
        >
          <option value="">All departments</option>
          {departments.map((deptName) => (
            <option key={deptName} value={deptName}>
              {deptName}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => { setSelectedStatus(e.target.value); setPage(1) }}
          className="sm:w-36"
        >
          <option value="ALL">All statuses</option>
          <option value="PRESENT">Present</option>
          <option value="LATE">Late</option>
          <option value="ON_LEAVE">On leave</option>
          <option value="ABSENT">Absent</option>
        </select>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={() => fetchAttendance(false)}
          disabled={loading || refreshing}
          className="btn-secondary shrink-0 cursor-pointer"
          title="Refresh attendance records"
        >
          <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Attendance Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Check in</th>
                <th>Check out</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="flex items-center gap-2.5 py-1">
                        <div className="size-7 rounded-full skeleton shrink-0" />
                        <div className="space-y-1">
                          <div className="h-3 w-28 skeleton" />
                          <div className="h-2.5 w-36 skeleton" />
                        </div>
                      </div>
                    </td>
                    <td><div className="h-3 w-20 skeleton" /></td>
                    <td><div className="h-3 w-16 skeleton" /></td>
                    <td><div className="h-3 w-16 skeleton" /></td>
                    <td><div className="h-3 w-14 skeleton" /></td>
                    <td><div className="h-4 w-16 skeleton" /></td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                    {search || selectedStatus !== 'ALL' || selectedDept
                      ? 'No matching attendance records found.'
                      : isViewingToday
                      ? 'No employees found.'
                      : 'No records found for this date.'}
                  </td>
                </tr>
              ) : (
                data.map((row) => {
                  const emp = row.employee
                  const isLateArrival = row.status === 'LATE'
                  const isOnLeave = row.status === 'ON_LEAVE'
                  const isAbsent = row.status === 'ABSENT'

                  return (
                    <tr key={emp.id || emp._id} role="link" tabIndex={0} onClick={() => navigate(`/employees/${emp.id || emp._id}`, { state: { from: location } })} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(`/employees/${emp.id || emp._id}`, { state: { from: location } }) } }} aria-label={`View details for ${emp.firstName} ${emp.lastName}`} className="cursor-pointer hover:bg-zinc-50/60 focus-visible:outline-2 focus-visible:outline-blue-500 dark:hover:bg-zinc-800/40">
                      {/* Employee Info */}
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="size-7 rounded-full bg-[#F4F4F5] dark:bg-[#27272A] border border-[#E4E4E7] dark:border-[#3F3F46] text-[#52525B] dark:text-[#D4D4D8] text-xs font-medium flex items-center justify-center shrink-0">
                            {emp.firstName?.[0]}
                            {emp.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-[#18181B] dark:text-[#FAFAFA] text-xs leading-tight">
                              {emp.firstName} {emp.lastName}
                            </p>
                            <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] leading-tight mt-0.5">
                              {emp.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="text-xs text-[#52525B] dark:text-[#A1A1AA]">
                        {emp.department || 'Unassigned'}
                      </td>

                      {/* Check in */}
                      <td className="text-xs text-[#18181B] dark:text-[#FAFAFA] tabular-nums">
                        {row.checkIn ? formatTime(row.checkIn) : '—'}
                      </td>

                      {/* Check out */}
                      <td>
                        {row.checkOut ? (
                          <div className="inline-flex items-center gap-1.5">
                            <span className="text-xs text-[#18181B] dark:text-[#FAFAFA] tabular-nums">
                              {formatTime(row.checkOut)}
                            </span>
                            {row.autoCheckedOut && (
                              <span className="badge-neutral text-[10px] px-1.5 py-0.5 leading-none">
                                Auto
                              </span>
                            )}
                          </div>
                        ) : isOnLeave || isAbsent ? (
                          <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">—</span>
                        ) : isViewingToday ? (
                          <span className="badge-accent">Working</span>
                        ) : (
                          <span className="badge-warning">Not closed</span>
                        )}
                      </td>

                      {/* Working Hours */}
                      <td className="text-xs text-[#52525B] dark:text-[#A1A1AA] tabular-nums">
                        {row.checkIn ? getWorkingHoursDisplay(row) : '—'}
                      </td>

                      {/* Status */}
                      <td>
                        {isOnLeave ? (
                          <span className="badge badge-accent">
                            {row.leaveType
                              ? `On leave (${row.leaveType.toLowerCase()})`
                              : 'On leave'}
                          </span>
                        ) : isAbsent ? (
                          <span className="badge badge-danger">Absent</span>
                        ) : (
                          <span className={isLateArrival ? 'badge-warning' : 'badge-success'}>
                            {isLateArrival ? 'Late' : 'Present'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && <Pagination page={page} totalPages={totalPages} totalItems={totalRows} onPageChange={setPage} />}
      </div>
    </div>
  )
}

export default AdminAttendance
