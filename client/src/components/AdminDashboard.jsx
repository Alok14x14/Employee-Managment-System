import { Building2Icon, CalendarIcon, FileTextIcon, UsersIcon } from 'lucide-react'
import React from 'react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts'

const AdminDashboard = ({ data }) => {
    // Use real data from backend, fallback to empty arrays to prevent crashes
    const attendanceData = data.attendanceData || [];
    const deptData = data.deptData || [];
    const leaveData = data.leaveData || [];

    const COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#f43f5e', '#8b5cf6'];

    const stats = [
        {
            icon: UsersIcon,
            value: data.totalEmployees,
            label: "Total Employees",
            description: "Active workforce",
            link: "/employees"
        },
        {
            icon: Building2Icon,
            value: data.totalDepartments,
            label: "Departments",
            description: "Organization units",
            link: "/departments"
        },
        {
            icon: CalendarIcon,
            value: data.todayAttendance,
            label: "Today's Attendance",
            description: "Checked in today",
        },
        {
            icon: FileTextIcon,
            value: data.pendingLeaves,
            label: "Pending Leaves",
            description: "Awaiting approval",
            link: "/leave"
        },
    ]
    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className='page-title'>Dashboard</h1>
                <p className="page-subtitle">
                    Welcome back, Admin — here's your overview
                </p>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8'>
                {stats.map((s) => (
                    <Link to={s.link} key={s.label} className='surface-card card-hover p-5 sm:p-6 relative overflow-hidden group flex items-center justify-between cursor-pointer'>
                        <div>
                            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70" />
                            <p className='text-sm font-medium text-slate-700'>{s.label}</p>
                            <p className='text-2xl font-bold text-slate-900 mt-1'>{s.value}</p>
                        </div>
                        <s.icon className='size-10 p-2.5 rounded-lg bg-slate-100  text-slate-600 group-hover:bg-indigo-50  group-hover:text-indigo-600 transition-colors duration-200' />
                    </Link>
                ))}
            </div>

            {/* Charts Section */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
                {/* Attendance Trend */}
                <div className='surface-card p-5 lg:col-span-2'>
                    <h3 className='font-semibold text-slate-800 mb-4'>Weekly Attendance Trend</h3>
                    <div className='h-[300px] w-full'>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                                <Area type="monotone" dataKey="present" name="Present" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorPresent)" />
                                <Area type="monotone" dataKey="absent" name="Absent" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorAbsent)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Leave by Type */}
                <div className='surface-card p-5'>
                    <h3 className='font-semibold text-slate-800 mb-4'>Leave Distribution</h3>
                    <div className='h-[300px] w-full'>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={leaveData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {leaveData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Headcount by Department */}
                <div className='surface-card p-5 lg:col-span-3'>
                    <h3 className='font-semibold text-slate-800 mb-4'>Headcount by Department</h3>
                    <div className='h-[300px] w-full'>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <RechartsTooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="headcount" name="Employees" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Activity Sections */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Recent Leaves */}
                <div className='surface-card overflow-hidden'>
                    <div className='p-5 border-b border-slate-100 flex items-center justify-between'>
                        <h3 className='font-semibold text-slate-800'>Recent Leave Requests</h3>
                    </div>
                    <div className='overflow-x-auto'>
                        <table className='data-table'>
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentLeaves?.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="text-center py-6 text-slate-400">No recent leaves</td>
                                    </tr>
                                ) : (
                                    data.recentLeaves?.map(leave => (
                                        <tr key={leave.id}>
                                            <td className="font-medium text-slate-700">
                                                {leave.employee?.firstName} {leave.employee?.lastName}
                                            </td>
                                            <td><span className='badge bg-slate-100 text-slate-600'>{leave.type}</span></td>
                                            <td>
                                                <span className={`badge ${leave.status === "APPROVED" ? "badge-success" : leave.status === "REJECTED" ? "badge-danger" : "badge-warning"}`}>
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

                {/* Recent Employees */}
                <div className='surface-card overflow-hidden'>
                    <div className='p-5 border-b border-slate-100 flex items-center justify-between'>
                        <h3 className='font-semibold text-slate-800'>New Employees</h3>
                    </div>
                    <div className='overflow-x-auto'>
                        <table className='data-table'>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Department</th>
                                    <th>Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentEmployees?.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="text-center py-6 text-slate-400">No recent employees</td>
                                    </tr>
                                ) : (
                                    data.recentEmployees?.map(emp => (
                                        <tr key={emp.id}>
                                            <td className="font-medium text-slate-700">
                                                {emp.firstName} {emp.lastName}
                                            </td>
                                            <td className="text-slate-500">{emp.department}</td>
                                            <td className="text-slate-500">
                                                {emp.joinDate ? format(new Date(emp.joinDate), "MMM dd, yyyy") : "N/A"}
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