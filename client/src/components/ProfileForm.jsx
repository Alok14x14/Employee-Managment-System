import { Loader2, Save, User } from 'lucide-react';
import React, { useState } from 'react';
import api from '../api/axios';

const ProfileForm = ({ initialData, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

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
        <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-[6px] p-6 mb-6">
            <h2 className="text-sm font-semibold text-zinc-900 mb-5 pb-3 border-b border-zinc-200 flex items-center gap-2">
                <User className="w-4 h-4 text-zinc-400" />
                <span>Profile Information</span>
            </h2>

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
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">Name</label>
                        <input
                            disabled
                            value={`${initialData.firstName} ${initialData.lastName}`}
                            className="w-full text-xs bg-zinc-50 text-zinc-500 cursor-not-allowed border-zinc-200"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">Email</label>
                        <input
                            disabled
                            value={initialData.email}
                            className="w-full text-xs bg-zinc-50 text-zinc-500 cursor-not-allowed border-zinc-200 font-mono"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">Position</label>
                        <input
                            disabled
                            value={initialData.position || ""}
                            className="w-full text-xs bg-zinc-50 text-zinc-500 cursor-not-allowed border-zinc-200"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Bio</label>
                    <textarea
                        disabled={initialData.isDeleted}
                        name="bio"
                        defaultValue={initialData.bio || ""}
                        placeholder="Write a brief professional summary..."
                        rows={3}
                        className={`w-full text-xs rounded-[6px] border border-zinc-200 p-2.5 resize-none ${
                            initialData.isDeleted ? "bg-zinc-50 text-zinc-400 cursor-not-allowed" : "text-zinc-900"
                        }`}
                    />
                    <p className="text-[11px] text-zinc-400 mt-1">Displayed in directory and organizational charts.</p>
                </div>

                {initialData.isDeleted ? (
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
    );
};

export default ProfileForm;