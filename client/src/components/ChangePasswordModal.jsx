import { Loader2Icon, LockIcon, X } from 'lucide-react';
import { useState } from 'react';
import api from '../api/axios';

const ChangePasswordModal = ({ open, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        const formData = new FormData(e.currentTarget);
        const currentPassword = formData.get('currentPassword');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            setLoading(false);
            return;
        }

        try {
            const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
            if (!data.success) throw new Error(data.error || 'Failed');
            setMessage({ type: 'success', text: 'Password updated successfully' });
            e.target.reset();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || error.message });
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
        >
            <div
                className="relative bg-white border border-zinc-200 rounded-[6px] shadow-lg w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 pb-4 border-b border-zinc-200">
                    <h2 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
                        <LockIcon className="w-4 h-4 text-zinc-400" />
                        <span>Change Password</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-[6px] hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-600"
                        aria-label="Close dialog"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form className="p-5 space-y-4" onSubmit={handleSubmit}>
                    {message.text && (
                        <div
                            className={`p-3 rounded-[4px] text-xs flex items-center gap-2 border ${
                                message.type === 'success'
                                     ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                     : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                        >
                            <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    message.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
                                }`}
                            />
                            <span>{message.text}</span>
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">Current Password</label>
                        <input
                            type="password"
                            name="currentPassword"
                            required
                            minLength={8}
                            className="w-full text-xs"
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">New Password</label>
                        <input
                            type="password"
                            name="newPassword"
                            required
                            minLength={8}
                            className="w-full text-xs"
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">Confirm New Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            required
                            minLength={8}
                            className="w-full text-xs"
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-200">
                        <button type="button" onClick={onClose} className="btn-secondary text-xs">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary text-xs inline-flex items-center gap-1.5"
                        >
                            {loading && <Loader2Icon className="w-3.5 h-3.5 animate-spin" />}
                            <span>Update Password</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;