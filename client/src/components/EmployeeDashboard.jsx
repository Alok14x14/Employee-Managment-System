import { Link } from 'react-router-dom'
import { formatDate, formatTime, formatCurrency, formatISTDate } from '../utils/formatters'
import { getWorkingHoursDisplay } from '../utils/attendance'
import { useTheme } from '../context/ThemeContext'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const EmployeeDashboard = ({ data }) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const gridStroke = isDark ? '#27272A' : '#E4E4E7'
  const axisColor = isDark ? '#A1A1AA' : '#71717A'
  const tooltipStyle = {
    backgroundColor: isDark ? '#18181B' : '#FFFFFF',
    border: isDark ? '1px solid #27272A' : '1px solid #E4E4E7',
    borderRadius: '6px',
    fontSize: '12px',
    color: isDark ? '#FAFAFA' : '#18181B',
    boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.4)' : 'none',
  }
  const tooltipItemStyle = {
    color: isDark ? '#FAFAFA' : '#18181B',
  }

  const weeklyHours = data.weeklyHours || []
  const recentAttendance = data.recentAttendance || []
  const recentLeaves = data.recentLeaves || []
  const todayRecord = data.todayRecord
  const latestPayslip = data.latestPayslip

  // Calculate average hours from recorded days
  const recordedDays = weeklyHours.filter((w) => w.hours > 0)
  const avgHours = recordedDays.length
    ? (recordedDays.reduce((acc, w) => acc + w.hours, 0) / recordedDays.length).toFixed(1)
    : '0'

  const stats = [
    {
      label: 'Days present',
      value: data.currentMonthAttendance ?? 0,
      description: 'Current month total',
      link: '/attendance',
    },
    {
      label: 'Pending leaves',
      value: data.pendingLeaves ?? 0,
      description: 'Awaiting manager response',
      link: '/leave',
    },
    {
      label: 'Avg. work hours',
      value: `${avgHours}h`,
      description: 'Based on weekly logs',
      link: '/attendance',
    },
    {
      label: 'Latest payslip',
      value: latestPayslip?.netSalary != null ? formatCurrency(latestPayslip.netSalary) : '—',
      description:
        latestPayslip?.month && latestPayslip?.year
          ? formatISTDate(new Date(Date.UTC(latestPayslip.year, latestPayslip.month - 1, 1)), { month: 'long', year: 'numeric' })
          : 'No cycle yet',
      link: '/payslips',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Personal attendance tracking, leave status, and payroll summary.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/attendance" className="btn-primary">
            Record attendance
          </Link>
          <Link to="/leave" className="btn-secondary">
            Apply for leave
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Link
            to={s.link}
            key={s.label}
            className="card card-hover p-4 block"
          >
            <p className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">{s.label}</p>
            <p className="text-2xl font-semibold text-[#18181B] dark:text-[#FAFAFA] mt-1 tabular-nums tracking-tight">
              {s.value}
            </p>
            <p className="text-[11px] text-[#A1A1AA] dark:text-[#71717A] mt-1 truncate">{s.description}</p>
          </Link>
        ))}
      </div>

      {/* Weekly Hours Trend + Today Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hours Chart */}
        <div className="card p-4 sm:p-5 lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">Weekly working hours</h2>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">Recorded daily duration for the current cycle</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke={gridStroke} />
                <XAxis
                  dataKey="day"
                  axisLine={{ stroke: gridStroke }}
                  tickLine={false}
                  tick={{ fill: axisColor, fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: axisColor, fontSize: 11 }}
                  domain={[0, 12]}
                />
                <RechartsTooltip
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  formatter={(val) => [`${val} hours`, 'Duration']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: axisColor }} />
                <Area
                  type="monotone"
                  dataKey="hours"
                  name="Hours worked"
                  stroke={isDark ? '#3B82F6' : '#2563EB'}
                  strokeWidth={1.5}
                  fill={isDark ? 'rgba(37, 99, 235, 0.25)' : '#EFF6FF'}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Record Tile */}
        <div className="card p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E4E7] dark:border-[#27272A]">
              <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">Today's attendance</h2>
              {todayRecord ? (
                <span className="badge badge-success">
                  {todayRecord.status?.toLowerCase() || 'present'}
                </span>
              ) : (
                <span className="badge badge-neutral">Not recorded</span>
              )}
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#E4E4E7] dark:border-[#27272A]">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">Check-in</span>
                <span className="font-medium text-[#18181B] dark:text-[#FAFAFA] font-mono tabular-nums">
                  {todayRecord?.checkIn ? formatTime(todayRecord.checkIn) : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E4E4E7] dark:border-[#27272A]">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">Check-out</span>
                <span className="font-medium text-[#18181B] dark:text-[#FAFAFA] font-mono tabular-nums">
                  {todayRecord?.checkOut ? formatTime(todayRecord.checkOut) : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">Duration</span>
                <span className="font-medium text-[#18181B] dark:text-[#FAFAFA] tabular-nums">
                  {todayRecord ? getWorkingHoursDisplay(todayRecord) : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E4E4E7] dark:border-[#27272A] mt-4">
            <Link to="/attendance" className="btn-secondary w-full text-xs">
              Open attendance console
            </Link>
          </div>
        </div>
      </div>

      {/* Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attendance */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E4E4E7] dark:border-[#27272A] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">Recent attendance</h2>
            <Link to="/attendance" className="text-xs text-[#2563EB] dark:text-[#60A5FA] hover:underline font-medium">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check in</th>
                  <th>Check out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {!recentAttendance?.length ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                      No recent attendance entries
                    </td>
                  </tr>
                ) : (
                  recentAttendance.slice(0, 5).map((att) => (
                    <tr key={att.id || att._id}>
                      <td className="font-medium text-[#18181B] dark:text-[#FAFAFA] text-xs tabular-nums">
                        {formatDate(att.date)}
                      </td>
                      <td className="text-[#52525B] dark:text-[#A1A1AA] text-xs font-mono tabular-nums">
                        {att.checkIn ? formatTime(att.checkIn) : '—'}
                      </td>
                      <td className="text-[#52525B] dark:text-[#A1A1AA] text-xs font-mono tabular-nums">
                        {att.checkOut ? formatTime(att.checkOut) : '—'}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            att.status === 'PRESENT'
                              ? 'badge-success'
                              : att.status === 'LATE'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                        >
                          {att.status?.toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Leaves */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E4E4E7] dark:border-[#27272A] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">Recent leave requests</h2>
            <Link to="/leave" className="text-xs text-[#2563EB] dark:text-[#60A5FA] hover:underline font-medium">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Period</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {!recentLeaves?.length ? (
                  <tr>
                    <td colSpan="3" className="text-center py-8 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                      No leave requests filed
                    </td>
                  </tr>
                ) : (
                  recentLeaves.slice(0, 5).map((leave) => (
                    <tr key={leave.id || leave._id}>
                      <td className="font-medium text-[#18181B] dark:text-[#FAFAFA] text-xs">
                        <span className="badge badge-neutral">{leave.type}</span>
                      </td>
                      <td className="text-[#52525B] dark:text-[#A1A1AA] text-xs tabular-nums">
                        {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            leave.status === 'APPROVED'
                              ? 'badge-success'
                              : leave.status === 'REJECTED'
                              ? 'badge-danger'
                              : 'badge-warning'
                          }`}
                        >
                          {leave.status?.toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeDashboard