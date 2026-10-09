import { Link } from 'react-router-dom'
import { formatDate } from '../utils/formatters'
import { useTheme } from '../context/ThemeContext'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const CHART_PALETTE_LIGHT = ['#2563EB', '#64748B', '#94A3B8', '#CBD5E1', '#E4E4E7']
const CHART_PALETTE_DARK = ['#3B82F6', '#60A5FA', '#93C5FD', '#94A3B8', '#475569']

const AdminDashboard = ({ data }) => {
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
  const chartPalette = isDark ? CHART_PALETTE_DARK : CHART_PALETTE_LIGHT

  const attendanceData = data.attendanceData || []
  const deptData = data.deptData || []
  const leaveData = data.leaveData || []

  const stats = [
    {
      label: 'Total employees',
      value: data.totalEmployees ?? 0,
      description: 'Active workforce',
      link: '/employees',
    },
    {
      label: 'Departments',
      value: data.totalDepartments ?? 0,
      description: 'Operational divisions',
      link: '/departments',
    },
    {
      label: "Today's attendance",
      value: data.todayAttendance ?? 0,
      description: 'Checked-in staff today',
      link: null,
    },
    {
      label: 'Pending leaves',
      value: data.pendingLeaves ?? 0,
      description: 'Awaiting manager approval',
      link: '/leave',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Organization workforce metrics, shift attendance, and department distribution.
          </p>
        </div>
        <div>
          <Link to="/employees" className="btn-primary">
            Manage employees
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const content = (
            <>
              <p className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">{s.label}</p>
              <p className="text-2xl font-semibold text-[#18181B] dark:text-[#FAFAFA] mt-1 tabular-nums tracking-tight">
                {s.value}
              </p>
              <p className="text-[11px] text-[#A1A1AA] dark:text-[#71717A] mt-1 truncate">{s.description}</p>
            </>
          )

          return s.link ? (
            <Link
              to={s.link}
              key={s.label}
              className="card card-hover p-4 block"
            >
              {content}
            </Link>
          ) : (
            <div key={s.label} className="card p-4">
              {content}
            </div>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend */}
        <div className="card p-4 sm:p-5 lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">Attendance trend</h2>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">Recorded daily presence</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke={gridStroke} />
                <XAxis
                  dataKey="name"
                  axisLine={{ stroke: gridStroke }}
                  tickLine={false}
                  tick={{ fill: axisColor, fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: axisColor, fontSize: 11 }}
                />
                <RechartsTooltip
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: axisColor }}
                />
                <Area
                  type="monotone"
                  dataKey="present"
                  name="Present"
                  stroke={isDark ? '#3B82F6' : '#2563EB'}
                  strokeWidth={1.5}
                  fill={isDark ? 'rgba(37, 99, 235, 0.25)' : '#EFF6FF'}
                />
                <Area
                  type="monotone"
                  dataKey="absent"
                  name="Absent"
                  stroke={isDark ? '#94A3B8' : '#64748B'}
                  strokeWidth={1.5}
                  fill={isDark ? 'rgba(100, 116, 139, 0.2)' : '#F4F4F5'}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leave Distribution */}
        <div className="card p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">Leave distribution</h2>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">Categorized leave requests</p>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leaveData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {leaveData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={chartPalette[index % chartPalette.length]}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', color: axisColor }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Headcount by Department */}
        <div className="card p-4 sm:p-5 lg:col-span-3">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">Headcount by department</h2>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">Staff members assigned across departments</p>
          </div>
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke={gridStroke} />
                <XAxis
                  dataKey="name"
                  axisLine={{ stroke: gridStroke }}
                  tickLine={false}
                  tick={{ fill: axisColor, fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: axisColor, fontSize: 11 }}
                />
                <RechartsTooltip
                  cursor={{ fill: isDark ? '#27272A' : '#F4F4F5' }}
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                />
                <Bar
                  dataKey="headcount"
                  name="Employees"
                  fill={isDark ? '#3B82F6' : '#2563EB'}
                  radius={[2, 2, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {!data.recentLeaves?.length ? (
                  <tr>
                    <td colSpan="3" className="text-center py-8 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                      No recent leave requests
                    </td>
                  </tr>
                ) : (
                  data.recentLeaves.map((leave) => (
                    <tr key={leave.id || leave._id}>
                      <td className="font-medium text-[#18181B] dark:text-[#FAFAFA] text-xs">
                        {leave.employee?.firstName} {leave.employee?.lastName}
                      </td>
                      <td>
                        <span className="badge badge-neutral">{leave.type}</span>
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

        {/* Recent Employees */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E4E4E7] dark:border-[#27272A] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">New employees</h2>
            <Link to="/employees" className="text-xs text-[#2563EB] dark:text-[#60A5FA] hover:underline font-medium">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {!data.recentEmployees?.length ? (
                  <tr>
                    <td colSpan="3" className="text-center py-8 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                      No recent employees
                    </td>
                  </tr>
                ) : (
                  data.recentEmployees.map((emp) => (
                    <tr key={emp.id || emp._id}>
                      <td className="font-medium text-[#18181B] dark:text-[#FAFAFA] text-xs">
                        {emp.firstName} {emp.lastName}
                      </td>
                      <td className="text-[#52525B] dark:text-[#A1A1AA] text-xs">{emp.department || '—'}</td>
                      <td className="text-[#71717A] dark:text-[#A1A1AA] text-xs tabular-nums">
                        {formatDate(emp.joinDate)}
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

export default AdminDashboard