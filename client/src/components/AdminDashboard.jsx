import { Building2Icon, CalendarIcon, FileTextIcon, UsersIcon } from 'lucide-react'
import React from 'react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'

const AdminDashboard = ({ data }) => {
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
            {stats.map((s)=>(
                <Link to={s.link} key={s.label} className='surface-card card-hover p-5 sm:p-6 relative overflow-hidden group flex items-center justify-between cursor-pointer'>
                    <div>
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-slate-500/70 group-hover:bg-indigo-500/70"/>
                        <p className='text-sm font-medium text-slate-700'>{s.label}</p>
                        <p className='text-2xl font-bold text-slate-900 mt-1'>{s.value}</p>
                    </div>
                    <s.icon className='size-10 p-2.5 rounded-lg bg-slate-100  text-slate-600 group-hover:bg-indigo-50  group-hover:text-indigo-600 transition-colors duration-200'/>
                </Link>
            ))}
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