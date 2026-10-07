import { useEffect, useState, useCallback } from "react";
import Loading from "../components/Loading";
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

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Settings</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage profile details and account authentication.</p>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        {profile && <ProfileForm initialData={profile} onSuccess={fetchProfile} />}

        {/* Change Password trigger */}
        <div className="bg-white border border-zinc-200 rounded-[6px] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[4px] bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-zinc-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900">Security Credentials</p>
              <p className="text-xs text-zinc-500">Update account password</p>
            </div>
          </div>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="btn-secondary text-xs h-8 px-3"
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