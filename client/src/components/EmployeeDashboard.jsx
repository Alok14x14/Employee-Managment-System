import React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarIcon,
  DollarSignIcon,
  FileTextIcon,
  ClockIcon,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { getWorkingHoursDisplay } from '../assets/assets';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const EmployeeDashboard = ({ data }) => {
  const emp = data.employee || {};
  const weeklyHours = data.weeklyHours || [];
  const recentAttendance = data.recentAttendance || [];
  const recentLeaves = data.recentLeaves || [];
  const todayRecord = data.todayRecord;
  const latestPayslip = data.latestPayslip;

  // Calculate average hours from weekly record
  const recordedDays = weeklyHours.filter((w) => w.hours > 0);
  const avgHours = recordedDays.length
    ? (recordedDays.reduce((acc, w) => acc + w.hours, 0) / recordedDays.length).toFixed(1)
    : '0';

  const stats = [
    {
      icon: CalendarIcon,
      value: data.currentMonthAttendance || 0,
      label: 'Days Present',
      link: '/attendance',
    },
    {
      icon: FileTextIcon,
      value: data.pendingLeaves || 0,
      label: 'Pending Leaves',
      link: '/leave',
    },
    {
      icon: ClockIcon,
      value: `${avgHours}h`,
      label: 'Avg. Work Hours',
      link: '/attendance',
    },
    {
      icon: DollarSignIcon,
      value: latestPayslip ? `₹${latestPayslip.netSalary?.toLocaleString()}` : 'N/A',
      label: 'Latest Payslip',
      link: '/payslips',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Page Header matching Admin Dashboard */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, {emp.firstName || 'Employee'} — here's your overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/attendance" className="btn-primary">
            Mark Attendance
          </Link>
          <Link to="/leave" className="btn-secondary">
            Apply for Leave
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards matching Admin Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
        {stats.map((s) => (
          <Link
            to={s.link}
            key={s.label}
            className="surface-card card-hover p-5 sm:p-6 relative overflow-hidden group flex items-center justify-between cursor-pointer"
          >
            <div>
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70" />
              <p className="text-sm font-medium text-slate-700">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
            </div>
            <s.icon className="size-10 p-2.5 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors duration-200" />
          </Link>
        ))}
      </div>

      {/* Charts / Mid Section matching Admin Dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Weekly Hours Trend (Area Chart) */}
        <div className="surface-card p-5 lg:col-span-2">
          <h3 className="font-semibold text-slate-800 mb-4">Weekly Working Hours Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  domain={[0, 12]}
                />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Area
                  type="monotone"
                  dataKey="hours"
                  name="Hours Logged"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorHours)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Separate Tiles for Attendance & Payslip */}
        <div className="flex flex-col gap-6">
          {/* Tile 1: Today's Attendance / Clock */}
          <div className="surface-card p-5 flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-indigo-600" /> Today's Attendance
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {format(new Date(), 'dd MMM')}
              </span>
            </div>

            {todayRecord ? (
              <div className="space-y-3">
                {todayRecord.checkOut ? (
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-semibold">Shift Completed</span>
                      <span className="block text-slate-500 mt-0.5">
                        Clocked out at{' '}
                        <span className="font-mono font-medium text-slate-700">
                          {format(new Date(todayRecord.checkOut), 'hh:mm a')}
                        </span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" />
                    <div>
                      <span className="font-semibold">Currently Clocked In</span>
                      <span className="block text-emerald-600 mt-0.5">
                        Active shift since{' '}
                        <span className="font-mono font-medium">
                          {todayRecord.checkIn
                            ? format(new Date(todayRecord.checkIn), 'hh:mm a')
                            : 'Recorded'}
                        </span>
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-2.5 bg-slate-50 rounded-lg space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Clock In:</span>
                    <span className="font-medium text-slate-800 font-mono">
                      {todayRecord.checkIn
                        ? format(new Date(todayRecord.checkIn), 'hh:mm a')
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Clock Out:</span>
                    <span className="font-medium text-slate-800 font-mono">
                      {todayRecord.checkOut
                        ? format(new Date(todayRecord.checkOut), 'hh:mm a')
                        : 'In Progress'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 pt-1.5 border-t border-slate-200/70">
                    <span>Total Duration:</span>
                    <span className="font-semibold text-slate-900">
                      {todayRecord.checkOut
                        ? (todayRecord.workingHours != null && todayRecord.workingHours >= 0.1
                            ? `${todayRecord.workingHours.toFixed(1)} hrs`
                            : getWorkingHoursDisplay(todayRecord))
                        : getWorkingHoursDisplay(todayRecord)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-2.5">
                <p className="font-medium">Not checked in yet today</p>
                <p className="text-amber-700 text-[11px]">
                  Please remember to punch in to record your daily attendance.
                </p>
                <Link
                  to="/attendance"
                  className="btn-primary inline-flex items-center justify-center w-full text-xs py-1.5 shadow-none"
                >
                  Clock In Now
                </Link>
              </div>
            )}
          </div>

          {/* Tile 2: Dedicated Latest Payslip Tile */}
          <div className="surface-card p-5 flex flex-col justify-between flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <DollarSignIcon className="w-4 h-4 text-indigo-600" /> Latest Payslip
              </h3>
              {latestPayslip && (
                <span className="badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10">
                  Disbursed
                </span>
              )}
            </div>

            {latestPayslip ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                      {format(new Date(latestPayslip.year, latestPayslip.month - 1), 'MMMM yyyy')}
                    </span>
                    <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">
                      ₹{latestPayslip.netSalary?.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium bg-white px-2 py-1 rounded border border-slate-200">
                    Net Pay
                  </span>
                </div>

                <a
                  href={`/print/payslips/${latestPayslip.id || latestPayslip._id}?autoprint=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full inline-flex items-center justify-center gap-2 text-xs py-2 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" /> Download Payslip Statement
                </a>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-50 text-center text-xs text-slate-400">
                <p>No payslip generated yet for this period.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Sections matching Admin Dashboard 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leave Requests */}
        <div className="surface-card overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Recent Leave Requests</h3>
            <Link to="/leave" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLeaves.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-6 text-slate-400">
                      No recent leave requests
                    </td>
                  </tr>
                ) : (
                  recentLeaves.map((leave) => (
                    <tr key={leave.id || leave._id}>
                      <td className="font-medium text-slate-700">
                        <span className="badge bg-slate-100 text-slate-600">{leave.type}</span>
                      </td>
                      <td className="text-slate-500">
                        {format(new Date(leave.startDate), 'MMM dd')} -{' '}
                        {format(new Date(leave.endDate), 'MMM dd, yyyy')}
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
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Attendance Logs */}
        <div className="surface-card overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Recent Attendance Activity</h3>
            <Link to="/attendance" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
              View calendar
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-6 text-slate-400">
                      No recent attendance logs
                    </td>
                  </tr>
                ) : (
                  recentAttendance.map((att) => (
                    <tr key={att.id || att._id}>
                      <td className="font-medium text-slate-700">
                        {format(new Date(att.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="text-slate-500">
                        {att.workingHours != null && att.workingHours >= 0.1
                          ? `${att.workingHours.toFixed(1)} hrs`
                          : getWorkingHoursDisplay(att)}
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
                          {att.status}
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
  );
};

export default EmployeeDashboard;