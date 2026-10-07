import React, { useState, useEffect } from 'react';
import Loading from '../components/Loading';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Building2Icon, ChevronDown, ChevronUp, UsersIcon } from 'lucide-react';

const Departments = () => {
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

    const departments = Object.keys(departmentsData).sort();

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Departments</h1>
                <p className="page-subtitle">View and manage organization departments</p>
            </div>

            <div className="space-y-4">
                {departments.map(dept => (
                    <div key={dept} className="surface-card overflow-hidden">
                        <div 
                            className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => setExpandedDept(expandedDept === dept ? null : dept)}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Building2Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800 text-lg">{dept}</h3>
                                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                                        <UsersIcon className="w-3.5 h-3.5" />
                                        {departmentsData[dept].length} Employee{departmentsData[dept].length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="text-slate-400">
                                {expandedDept === dept ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </div>
                        </div>

                        {expandedDept === dept && (
                            <div className="border-t border-slate-100 bg-slate-50/50 p-5">
                                <div className="overflow-x-auto">
                                    <table className="data-table bg-white shadow-sm rounded-lg">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Position</th>
                                                <th>Email</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {departmentsData[dept].map(emp => (
                                                <tr key={emp.id}>
                                                    <td className="font-medium text-slate-700">
                                                        {emp.firstName} {emp.lastName}
                                                    </td>
                                                    <td className="text-slate-500">{emp.position}</td>
                                                    <td className="text-slate-500">{emp.email}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {departments.length === 0 && (
                    <div className="text-center py-12 text-slate-400 bg-white rounded-lg border border-slate-200 border-dashed">
                        No departments found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Departments;
