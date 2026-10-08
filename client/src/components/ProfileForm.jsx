import {
    Briefcase,
    Building2,
    DollarSign,
    Loader2,
    Save,
    ShieldCheck,
    User
} from 'lucide-react';
import React, { useState } from 'react';
import api from '../api/axios';
import { formatCurrency, formatDate } from '../utils/formatters';

const ProfileForm = ({ initialData, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const isAdmin = initialData?.isAdmin || initialData?.role === 'ADMIN';

    const displayName = [initialData?.firstName, initialData?.lastName]
        .filter(Boolean)
        .join(" ") || (isAdmin ? "Administrator" : "Employee");

    const initials = `${initialData?.firstName?.[0] || (isAdmin ? 'A' : 'E')}${initialData?.lastName?.[0] || (isAdmin ? 'D' : '')}`.toUpperCase();

    const displayId = initialData?._id
        ? (initialData._id.length > 8 ? initialData._id.slice(-8).toUpperCase() : initialData._id)
        : (initialData?.id || '—');

    const basicSalary = Math.round((Number(initialData?.basicSalary) || 0) * 100) / 100;
    const allowances = Math.round((Number(initialData?.allowances) || 0) * 100) / 100;
    const deductions = Math.round((Number(initialData?.deductions) || 0) * 100) / 100;
    const netSalary = Math.round(Math.max(0, basicSalary + allowances - deductions) * 100) / 100;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");
        const formData = new FormData(e.currentTarget);
        try {
            await api.post("/profile", formData);
            setMessage("Profile updated successfully");
            onSuccess?.();
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Identity & Account Summary Header */}
            <div className="bg-white border border-zinc-200 rounded-[6px] p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-sm font-semibold text-zinc-700 shrink-0">
                            {initials}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-base font-semibold text-zinc-900 leading-tight">
                                    {displayName}
                                </h2>
                                {isAdmin ? (
                                    <span className="badge badge-accent">Administrator</span>
                                ) : (
                                    <span className="badge badge-neutral">Employee</span>
                                )}
                                {initialData?.isDeleted ? (
                                    <span className="badge badge-danger">Archived</span>
                                ) : (
                                    <span className="badge badge-success">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                        Active
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-zinc-500 font-mono mt-1">
                                {initialData?.email}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:self-start">
                        <span className="text-[11px] font-mono text-zinc-500 bg-zinc-50 border border-zinc-200 px-2 py-1 rounded-[4px]">
                            ID: #{displayId}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-medium px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-[4px]">
                            {isAdmin ? 'Admin Portal' : 'Employee Portal'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Personal Details & Bio Form */}
            <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-[6px] p-6">
                <h3 className="text-sm font-semibold text-zinc-900 mb-5 pb-3 border-b border-zinc-200 flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-400" />
                    <span>Personal Information</span>
                </h3>

                {error && (
                    <div className="bg-rose-50 text-rose-800 p-3 rounded-[4px] text-xs border border-rose-200 mb-5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {message && (
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-[4px] text-xs border border-emerald-200 mb-5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                        <span>{message}</span>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1.5">First Name</label>
                            <input
                                disabled
                                value={initialData?.firstName || (isAdmin ? "Admin" : "—")}
                                className="w-full text-xs bg-zinc-50 text-zinc-500 cursor-not-allowed border border-zinc-200 rounded-[6px] h-9 px-3"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Last Name</label>
                            <input
                                disabled
                                value={initialData?.lastName || (isAdmin ? "—" : "—")}
                                className="w-full text-xs bg-zinc-50 text-zinc-500 cursor-not-allowed border border-zinc-200 rounded-[6px] h-9 px-3"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Work Email</label>
                            <input
                                disabled
                                value={initialData?.email || "—"}
                                className="w-full text-xs bg-zinc-50 text-zinc-500 cursor-not-allowed border border-zinc-200 font-mono rounded-[6px] h-9 px-3"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Phone Number</label>
                            <input
                                disabled
                                value={initialData?.phone || (isAdmin ? "N/A (System Account)" : "Not provided")}
                                className="w-full text-xs bg-zinc-50 text-zinc-500 cursor-not-allowed border border-zinc-200 rounded-[6px] h-9 px-3"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">Professional Bio</label>
                        <textarea
                            disabled={initialData?.isDeleted}
                            name="bio"
                            defaultValue={initialData?.bio || ""}
                            placeholder="Write a brief professional summary..."
                            rows={3}
                            className={`w-full text-xs rounded-[6px] border border-zinc-200 p-2.5 resize-none ${
                                initialData?.isDeleted ? "bg-zinc-50 text-zinc-400 cursor-not-allowed" : "text-zinc-900"
                            }`}
                        />
                        <p className="text-[11px] text-zinc-400 mt-1">
                            Displayed in organization directory and staff records.
                        </p>
                    </div>

                    {initialData?.isDeleted ? (
                        <div className="pt-2">
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[4px] text-center">
                                <p className="text-xs text-rose-700 font-medium">Account Deactivated</p>
                                <p className="text-[11px] text-rose-600 mt-0.5">Profile modifications are disabled for deactivated accounts.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-end pt-2 border-t border-zinc-100">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary text-xs inline-flex items-center gap-1.5"
                            >
                                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                <span>Save Changes</span>
                            </button>
                        </div>
                    )}
                </div>
            </form>

            {/* Employment & Organization Details */}
            <div className="bg-white border border-zinc-200 rounded-[6px] p-6">
                <h3 className="text-sm font-semibold text-zinc-900 mb-5 pb-3 border-b border-zinc-200 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-zinc-400" />
                    <span>{isAdmin ? "Administrative Scope & Organization" : "Employment & Organization"}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">Department</label>
                        <input
                            disabled
                            value={initialData?.department || (isAdmin ? "Executive Administration" : "Unassigned")}
                            className="w-full text-xs bg-zinc-50 text-zinc-500 cursor-not-allowed border border-zinc-200 rounded-[6px] h-9 px-3"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">Position / Designation</label>
                        <input
                            disabled
                            value={initialData?.position || (isAdmin ? "System Administrator" : "—")}
                            className="w-full text-xs bg-zinc-50 text-zinc-500 cursor-not-allowed border border-zinc-200 rounded-[6px] h-9 px-3"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">Employment Status</label>
                        <input
                            disabled
                            value={initialData?.isDeleted ? "Archived" : (initialData?.employmentStatus || "Active")}
                            className="w-full text-xs bg-zinc-50 text-zinc-500 cursor-not-allowed border border-zinc-200 rounded-[6px] h-9 px-3"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                            {isAdmin ? "Account Established" : "Joining Date"}
                        </label>
                        <input
                            disabled
                            value={formatDate(initialData?.joinDate || initialData?.createdAt)}
                            className="w-full text-xs bg-zinc-50 text-zinc-500 cursor-not-allowed border border-zinc-200 rounded-[6px] h-9 px-3"
                        />
                    </div>
                </div>
            </div>

            {/* Portal-Specific Section: Compensation for Employee, Privileges for Admin */}
            {isAdmin ? (
                <div className="bg-white border border-zinc-200 rounded-[6px] p-6">
                    <h3 className="text-sm font-semibold text-zinc-900 mb-5 pb-3 border-b border-zinc-200 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-zinc-400" />
                        <span>Administrative Privileges & Permissions</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="bg-zinc-50 border border-zinc-200 rounded-[6px] p-3.5">
                            <p className="text-xs font-semibold text-zinc-900">Personnel Directory</p>
                            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                                Create, edit, and deactivate staff records across all departments.
                            </p>
                        </div>
                        <div className="bg-zinc-50 border border-zinc-200 rounded-[6px] p-3.5">
                            <p className="text-xs font-semibold text-zinc-900">Department Administration</p>
                            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                                Manage organization units, departmental distribution, and headcount.
                            </p>
                        </div>
                        <div className="bg-zinc-50 border border-zinc-200 rounded-[6px] p-3.5">
                            <p className="text-xs font-semibold text-zinc-900">Leave Governance</p>
                            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                                Review, approve, or reject employee time-off and annual leave applications.
                            </p>
                        </div>
                        <div className="bg-zinc-50 border border-zinc-200 rounded-[6px] p-3.5">
                            <p className="text-xs font-semibold text-zinc-900">Payroll & Payslips</p>
                            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                                Compute salary structures, generate payslips, and access printable reports.
                            </p>
                        </div>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-3.5">
                        Unrestricted administrative control configured for this account.
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-zinc-200 rounded-[6px] p-6">
                    <h3 className="text-sm font-semibold text-zinc-900 mb-5 pb-3 border-b border-zinc-200 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-zinc-400" />
                        <span>Compensation & Payroll Overview</span>
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-zinc-50 border border-zinc-200 rounded-[6px] p-3">
                            <span className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                                Basic Salary
                            </span>
                            <span className="block text-sm font-semibold text-zinc-900 mt-1 font-mono">
                                {formatCurrency(basicSalary)}
                            </span>
                        </div>
                        <div className="bg-zinc-50 border border-zinc-200 rounded-[6px] p-3">
                            <span className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                                Allowances
                            </span>
                            <span className="block text-sm font-semibold text-emerald-600 mt-1 font-mono">
                                +{formatCurrency(allowances)}
                            </span>
                        </div>
                        <div className="bg-zinc-50 border border-zinc-200 rounded-[6px] p-3">
                            <span className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                                Deductions
                            </span>
                            <span className="block text-sm font-semibold text-rose-600 mt-1 font-mono">
                                -{formatCurrency(deductions)}
                            </span>
                        </div>
                        <div className="bg-zinc-50 border border-zinc-200 rounded-[6px] p-3">
                            <span className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                                Net Monthly
                            </span>
                            <span className="block text-sm font-semibold text-blue-600 mt-1 font-mono">
                                {formatCurrency(netSalary)}
                            </span>
                        </div>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-3.5">
                        Official monthly compensation figures maintained in organization payroll records.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProfileForm;