import { useState, useEffect } from 'react';
import Loading from '../components/Loading';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Building2Icon, ChevronDown, ChevronUp, UsersIcon } from 'lucide-react';
import { useDepartments } from '../constants/departments';

const Departments = () => {
    const allDepartments = useDepartments();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedDept, setExpandedDept] = useState(null);

    useEffect(() => {
        api.get('/employees')
            .then(res => setEmployees(res.data))
            .catch(err => toast.error(err.response?.data?.error || err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loading />;

    // Group employees by department
    const departmentsData = employees.reduce((acc, emp) => {
        const dept = emp.department || 'Unassigned';
        if (!acc[dept]) {
            acc[dept] = [];
        }
        acc[dept].push(emp);
        return acc;
    }, {});

    // Ensure all departments from the constant are included and sorted alphabetically
    const allDeptSet = new Set([...allDepartments, ...Object.keys(departmentsData)]);
    const departments = Array.from(allDeptSet).sort((a, b) => a.localeCompare(b));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                    <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Departments</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Overview of organizational structure and department rosters.</p>
                </div>
            </div>

            <div className="space-y-3">
                {departments.map(dept => {
                    const roster = departmentsData[dept] || [];
                    const count = roster.length;
                    const isExpanded = expandedDept === dept;
                    return (
                        <div key={dept} className="bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-[6px] overflow-hidden">
                            <button
                                type="button"
                                className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
                                onClick={() => setExpandedDept(isExpanded ? null : dept)}
                                aria-expanded={isExpanded}
                            >
                                <div className="flex items-center gap-3">
                                    <Building2Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{dept}</span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                                        <UsersIcon className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                                        {count}
                                    </span>
                                </div>
                                <div className="text-zinc-400 dark:text-zinc-500">
                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-4">
                                    {roster.length === 0 ? (
                                        <div className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400 bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-[6px]">
                                            No active staff members assigned to this department.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-[6px] bg-white dark:bg-[#18181B]">
                                            <table className="w-full text-left border-collapse text-xs">
                                                <thead>
                                                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                                                        <th className="px-3.5 py-2.5 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[11px]">Name</th>
                                                        <th className="px-3.5 py-2.5 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[11px]">Position</th>
                                                        <th className="px-3.5 py-2.5 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[11px]">Email</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                                    {roster.map(emp => (
                                                        <tr key={emp.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                                                            <td className="px-3.5 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                                                                {emp.firstName} {emp.lastName}
                                                            </td>
                                                            <td className="px-3.5 py-2.5 text-zinc-600 dark:text-zinc-400">{emp.position || '—'}</td>
                                                            <td className="px-3.5 py-2.5 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">{emp.email}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {departments.length === 0 && (
                    <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 bg-white dark:bg-[#18181B] rounded-[6px] border border-zinc-200 dark:border-zinc-800">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">No departments found</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Assign employees to departments to see them organized here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Departments;
