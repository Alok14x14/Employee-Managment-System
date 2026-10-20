import { useEffect, useState, useCallback } from "react";
import { Lock } from "lucide-react";
import ProfileForm from "../components/ProfileForm";
import ChangePasswordModal from "../components/ChangePasswordModal";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

const Settings = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get("/profile");
      const profile = res.data;
      if (profile) setProfile(profile);
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [user, fetchProfile]);

  if (loading) return (
    <div className="space-y-6" role="status" aria-label="Loading settings">
      <div className="border-b border-zinc-200 pb-6 dark:border-zinc-800"><div className="h-6 w-28 rounded skeleton" /><div className="mt-2 h-3 w-72 max-w-full rounded skeleton" /></div>
      <div className="max-w-3xl space-y-6">
        <section className="card space-y-5 p-5">{Array.from({ length: 4 }).map((_, i) => <div key={i}><div className="mb-2 h-3 w-24 rounded skeleton" /><div className="h-9 rounded skeleton" /></div>)}<div className="h-9 w-28 rounded skeleton" /></section>
        <section className="card flex items-center justify-between p-5"><div className="flex items-center gap-3"><div className="size-8 rounded skeleton" /><div className="space-y-2"><div className="h-3 w-36 rounded skeleton" /><div className="h-3 w-28 rounded skeleton" /></div></div><div className="h-8 w-32 rounded skeleton" /></section>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Settings</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage profile details and account authentication.</p>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        {profile && <ProfileForm initialData={profile} onSuccess={fetchProfile} />}

        {/* Change Password trigger */}
        <div className="bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-[6px] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[4px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Security Credentials</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Update account password</p>
            </div>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="btn-secondary text-xs h-8 px-3 cursor-pointer"
          >
            Change Password
          </button>
        </div>
      </div>

      <ChangePasswordModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </div>
  );
};

export default Settings;
