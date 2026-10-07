import React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarIcon,
  DollarSignIcon,
  FileTextIcon,
  ClockIcon,
  ArrowRightIcon,
  CheckCircle2,
  AlertCircle,
  Download,
  Calendar,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { getWorkingHoursDisplay } from '../assets/assets';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
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
    : '0.0';

  const stats = [
    {
      icon: CalendarIcon,
      value: data.currentMonthAttendance || 0,
      label: 'Days Present',
      subtitle: 'This month',
      link: '/attendance',
      accent: 'border-l-indigo-500',
    },
    {
      icon: FileTextIcon,
      value: data.pendingLeaves || 0,
      label: 'Pending Leaves',
      subtitle: `${data.approvedLeaves || 0} approved to date`,
      link: '/leave',
      accent: 'border-l-amber-500',
    },
    {
      icon: ClockIcon,
      value: `${avgHours}h`,
      label: 'Avg. Daily Hours',
      subtitle: 'Past 7 days average',
      link: '/attendance',
      accent: 'border-l-emerald-500',
    },
    {
      icon: DollarSignIcon,
      value: latestPayslip ? `₹${latestPayslip.netSalary?.toLocaleString()}` : 'N/A',
      label: 'Latest Payslip',
      subtitle: latestPayslip
        ? format(new Date(latestPayslip.year, latestPayslip.month - 1), 'MMMM yyyy')
        : 'No payslip yet',
      link: '/payslips',
      accent: 'border-l-blue-500',
    },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Welcome Banner */}
      <div className="surface-card p-6 sm:p-8 relative overflow-hidden bg-gradient-to-br from-white via-white to-indigo-50/40">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Employee Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, {emp.firstName}!
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {emp.position || 'Employee'} • {emp.department || 'General Department'} •{' '}
              <span className="text-slate-400 font-medium">
                {format(new Date(), 'EEEE, MMMM dd, yyyy')}
              </span>
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/attendance"
              className="btn-primary inline-flex items-center gap-2 shadow-sm"
            >
              <ClockIcon className="w-4 h-4" /> Mark Attendance
            </Link>
            <Link
              to="/leave"
              className="btn-secondary inline-flex items-center gap-2 shadow-2xs"
            >
              <Calendar className="w-4 h-4 text-slate-500" /> Apply for Leave
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((s) => (
          <Link
            to={s.link}
            key={s.label}
            className={`surface-card card-hover p-5 sm:p-6 relative overflow-hidden group flex items-center justify-between border-l-4 ${s.accent}`}
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {s.label}
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 tracking-tight">
                {s.value}
              </p>
              <p className="text-xs text-slate-400 mt-1">{s.subtitle}</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-indigo-50 transition-colors duration-200">
              <s.icon className="w-5 h-5 text-slate-600 group-hover:text-indigo-600 transition-colors duration-200" />
            </div>
          </Link>
        ))}
      </div>

      {/* Analytics & Today's Status Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Hours Worked Chart (2 cols) */}
        <div className="surface-card p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" /> Weekly Working Hours
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily hours logged over the past 7 days
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-block size-2 rounded-full bg-indigo-600" />
              <span className="text-slate-600 font-medium">Logged Hours</span>
              <span className="inline-block w-3 border-t-2 border-dashed border-slate-300 ml-2" />
              <span className="text-slate-400">8h Target</span>
            </div>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  domain={[0, 12]}
                />
                <RechartsTooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-lg">
                          <p className="font-semibold">{dataPoint.day} ({dataPoint.date})</p>
                          <p className="text-indigo-300 mt-1 font-mono">
                            {dataPoint.hours} Hours Logged
                          </p>
                          <p className="text-slate-400 text-[10px] uppercase mt-0.5">
                            Status: {dataPoint.status}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={8} stroke="#94a3b8" strokeDasharray="3 3" />
                <Bar
                  dataKey="hours"
                  name="Hours"
                  fill="#0d9488"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={44}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Status & Latest Payslip Snapshot (1 col) */}
        <div className="space-y-6">
          {/* Today's Punch Widget */}
          <div className="surface-card p-5 sm:p-6">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center justify-between">
              <span>Today's Status</span>
              <span className="text-xs font-normal text-slate-400 font-mono">
                {format(new Date(), 'dd MMM')}
              </span>
            </h3>

            {todayRecord ? (
              <div className="space-y-3">
                {todayRecord.checkOut ? (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-800 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold">Shift Completed</span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        Clocked out at{' '}
                        <span className="font-mono font-semibold text-slate-700">
                          {format(new Date(todayRecord.checkOut), 'hh:mm a')}
                        </span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" />
                    <div>
                      <span className="font-bold">Currently Clocked In</span>
                      <span className="block text-[11px] text-emerald-600 mt-0.5">
                        Active shift since{' '}
                        <span className="font-mono font-semibold">
                          {todayRecord.checkIn
                            ? format(new Date(todayRecord.checkIn), 'hh:mm a')
                            : 'Recorded'}
                        </span>
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
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
                    <span>Working Hours:</span>
                    <span className="font-bold text-slate-900">
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
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/70 text-amber-800 text-xs space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-semibold">Not checked in yet today</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Remember to mark your attendance to record your work hours accurately.
                </p>
                <Link
                  to="/attendance"
                  className="btn-primary inline-flex items-center gap-1.5 w-full justify-center text-xs py-2 shadow-none"
                >
                  Clock In Now <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Recent Payslip Quick Card */}
          <div className="surface-card p-5 sm:p-6">
            <h3 className="font-bold text-slate-900 text-base mb-3 flex items-center justify-between">
              <span>Payroll Snapshot</span>
              <DollarSignIcon className="w-4 h-4 text-indigo-600" />
            </h3>

            {latestPayslip ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                    {format(new Date(latestPayslip.year, latestPayslip.month - 1), 'MMMM yyyy')} Payout
                  </span>
                  <span className="text-2xl font-bold text-slate-900 font-mono mt-0.5 block">
                    ₹{latestPayslip.netSalary?.toLocaleString()}
                  </span>
                </div>

                <a
                  href={`/print/payslips/${latestPayslip.id || latestPayslip._id}?autoprint=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full inline-flex items-center justify-center gap-2 text-xs py-2 text-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" /> View Payslip Statement
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">
                No payslip records generated yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Activity Sections: Recent Leaves & Attendance Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leave Requests */}
        <div className="surface-card overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recent Leave Requests</h3>
              <p className="text-xs text-slate-400 mt-0.5">Your submitted time off applications</p>
            </div>
            <Link
              to="/leave"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View all <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLeaves.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-slate-400 text-xs">
                      No leave applications submitted yet
                    </td>
                  </tr>
                ) : (
                  recentLeaves.map((l) => (
                    <tr key={l.id || l._id}>
                      <td className="font-semibold text-slate-800 text-xs">{l.type}</td>
                      <td className="text-xs text-slate-500 whitespace-nowrap">
                        {format(new Date(l.startDate), 'MMM dd')} -{' '}
                        {format(new Date(l.endDate), 'MMM dd')}
                      </td>
                      <td className="text-xs text-slate-500 max-w-[140px] truncate" title={l.reason}>
                        {l.reason || 'Personal'}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            l.status === 'APPROVED'
                              ? 'badge-success'
                              : l.status === 'REJECTED'
                              ? 'badge-danger'
                              : 'badge-warning'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Attendance Activity */}
        <div className="surface-card overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Recent Attendance Activity</h3>
              <p className="text-xs text-slate-400 mt-0.5">Your daily work hours history</p>
            </div>
            <Link
              to="/attendance"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              View calendar <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-400 text-xs">
                      No attendance logs recorded yet
                    </td>
                  </tr>
                ) : (
                  recentAttendance.map((a) => (
                    <tr key={a.id || a._id}>
                      <td className="font-medium text-slate-800 text-xs whitespace-nowrap">
                        {format(new Date(a.date), 'EEE, MMM dd')}
                      </td>
                      <td className="text-xs text-slate-500 font-mono">
                        {a.checkIn ? format(new Date(a.checkIn), 'hh:mm a') : '—'}
                      </td>
                      <td className="text-xs text-slate-500 font-mono">
                        {a.checkOut ? format(new Date(a.checkOut), 'hh:mm a') : '—'}
                      </td>
                      <td className="text-xs font-semibold text-slate-700">
                        {a.workingHours ? `${a.workingHours.toFixed(1)}h` : '—'}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            a.status === 'PRESENT'
                              ? 'badge-success'
                              : a.status === 'LATE'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                        >
                          {a.status}
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