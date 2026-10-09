import { Loader2, Plus, X } from 'lucide-react';
import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const GeneratePayslipForm = ({ employees, onSuccess }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!isOpen) {
        return (
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="btn-primary inline-flex items-center gap-2"
            >
                <Plus className="w-4 h-4" />
                <span>Generate Payslip</span>
            </button>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        try {
            await api.post('/payslips', data);
            toast.success('Payslip generated successfully');
            setIsOpen(false);
            onSuccess();
        } catch (err) {
            toast.error(err.response?.data?.error || err?.message);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-[6px] shadow-lg max-w-lg w-full p-6">
                <div className="flex justify-between items-center pb-4 border-b border-zinc-200 dark:border-zinc-800">
                    <div>
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Generate Monthly Payslip</h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Calculate and register payroll for an employee</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-[6px] transition-colors"
                        aria-label="Close dialog"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Employee</label>
                        <select name="employeeId" required defaultValue="" className="w-full text-xs">
                            <option value="" disabled>Select employee</option>
                            {employees.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.firstName} {e.lastName} ({e.position})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Month</label>
                            <select name="month" defaultValue={new Date().getMonth() + 1} className="w-full text-xs">
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Year</label>
                            <input
                                type="number"
                                name="year"
                                defaultValue={new Date().getFullYear()}
                                className="w-full text-xs font-mono tabular-nums"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Basic Salary (₹)</label>
                        <input
                            type="number"
                            name="basicSalary"
                            required
                            placeholder="50000"
                            className="w-full text-xs font-mono tabular-nums"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Allowances (₹)</label>
                            <input
                                type="number"
                                name="allowances"
                                defaultValue="0"
                                className="w-full text-xs font-mono tabular-nums"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Deductions (₹)</label>
                            <input
                                type="number"
                                name="deductions"
                                defaultValue="0"
                                className="w-full text-xs font-mono tabular-nums"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end items-center gap-2.5 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                            onClick={() => setIsOpen(false)}
                            type="button"
                            className="btn-secondary text-xs"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={loading}
                            type="submit"
                            className="btn-primary text-xs inline-flex items-center gap-1.5"
                        >
                            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>Generate</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GeneratePayslipForm;