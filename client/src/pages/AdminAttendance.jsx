import { useCallback, useEffect, useState, useRef } from 'react'
import { Search, RefreshCw } from 'lucide-react'
import { useDepartments } from '../constants/departments'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { formatISTDate, formatTime } from '../utils/formatters'
import { getWorkingHoursDisplay } from '../utils/attendance'

const AdminAttendance = () => {
  const departments = useDepartments()
  const [data, setData] = useState([])
  const [summary, setSummary] = useState({
    totalActive: 0,
    present: 0,
    late: 0,
    stillWorking: 0,
    checkedOut: 0,
    notCheckedIn: 0,
  })
  const [currentDate, setCurrentDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('')

  // Keep a ref to selectedDept so the visibility handler and timer always use the current value
  const selectedDeptRef = useRef(selectedDept)
  selectedDeptRef.current = selectedDept

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

      const res = await api.get(`/attendance/admin/today?${params.toString()}`)
      if (ignoreRef && ignoreRef.current) return

      setData(res.data.data || [])
      setSummary(res.data.summary || {
        totalActive: 0,
        present: 0,
        late: 0,
        stillWorking: 0,
        checkedOut: 0,
        notCheckedIn: 0,
      })
      setCurrentDate(res.data.date || '')
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

  // Refetch when department changes, with stale response ignore flag
  useEffect(() => {
    const ignoreRef = { current: false }
    fetchAttendance(true, ignoreRef)

    return () => {
      ignoreRef.current = true
    }
  }, [selectedDept, fetchAttendance])

  // Auto-refresh every 60 seconds; pause when document is hidden
  useEffect(() => {
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
  }, [fetchAttendance])

  // Client-side search by employee name, email, or position
  const filteredData = data.filter((row) => {
    const term = search.toLowerCase()
    const name = `${row.employee.firstName} ${row.employee.lastName}`.toLowerCase()
    const email = (row.employee.email || '').toLowerCase()
    const position = (row.employee.position || '').toLowerCase()
    return name.includes(term) || email.includes(term) || position.includes(term)
  })

  const stats = [
    { label: 'Present', value: summary.present, helper: 'Checked in today' },
    { label: 'Late', value: summary.late, helper: 'Check-in after 9:00 AM' },
    { label: 'Still working', value: summary.stillWorking, helper: 'Active on shift' },
    { label: 'Checked out', value: summary.checkedOut, helper: 'Completed shift' },
    { label: 'Not checked in', value: summary.notCheckedIn, helper: 'Remaining active staff' },
  ]

  const formattedDateSubtitle = currentDate
    ? formatISTDate(currentDate, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : formatISTDate(new Date(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Today&apos;s attendance</h1>
          <p className="page-subtitle">{formattedDateSubtitle}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">{s.label}</p>
            <p className="text-2xl font-semibold text-[#18181B] dark:text-[#FAFAFA] mt-1 tabular-nums tracking-tight">
              {loading ? '—' : s.value}
            </p>
            {s.helper && (
              <p className="text-[11px] text-[#A1A1AA] dark:text-[#71717A] mt-1 truncate">{s.helper}</p>
            )}
          </div>
        ))}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] dark:text-[#71717A] size-4" />
          <input
            placeholder="Search by name, email, or title..."
            className="pl-9"
            onChange={(e) => setSearch(e.target.value)}
            value={search}
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="sm:w-48"
        >
          <option value="">All departments</option>
          {departments.map((deptName) => (
            <option key={deptName} value={deptName}>
              {deptName}
            </option>
          ))}
        </select>

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
                Array.from({ length: 5 }).map((_, idx) => (
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
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                    {search ? 'No matching check-ins found.' : 'No one has checked in yet today'}
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => {
                  const emp = row.employee
                  const isLateArrival = row.status === 'LATE'

                  return (
                    <tr key={emp.id || emp._id}>
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
                        {formatTime(row.checkIn)}
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
                        ) : (
                          <span className="badge-accent">Working</span>
                        )}
                      </td>

                      {/* Working Hours */}
                      <td className="text-xs text-[#52525B] dark:text-[#A1A1AA] tabular-nums">
                        {getWorkingHoursDisplay(row)}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={isLateArrival ? 'badge-warning' : 'badge-success'}>
                          {isLateArrival ? 'Late' : 'Present'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminAttendance
