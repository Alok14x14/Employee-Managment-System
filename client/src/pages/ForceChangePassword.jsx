import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { EyeIcon, EyeOffIcon, KeyRoundIcon, Loader2Icon, LogOutIcon, MoonIcon, ShieldAlertIcon, SunIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

const ForceChangePassword = () => {
  const { user, loading: authLoading, logout, updateToken, refreshSession } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (authLoading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!user.mustChangePassword) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long')
      return
    }

    if (newPassword === currentPassword) {
      setError('New password cannot be the same as current password')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { data } = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      })

      if (data.success) {
        if (data.token) {
          updateToken(data.token)
        }
        await refreshSession()
        toast.success('Password updated successfully')
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password. Please check your current password.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#FAFAFA] dark:bg-[#0A0A0B] relative">
      {/* Top action bar: theme toggle & logout */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] border border-transparent hover:border-[#E4E4E7] dark:hover:border-[#27272A] rounded-[6px] transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#DC2626] dark:hover:text-rose-400 hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] rounded-[6px] transition-colors cursor-pointer"
        >
          <LogOutIcon size={14} />
          <span>Sign out</span>
        </button>
      </div>

      <div className="w-full max-w-[440px] bg-white dark:bg-[#111113] border border-[#E4E4E7] dark:border-[#27272A] rounded-[10px] p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-[8px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center shrink-0">
            <KeyRoundIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-[#18181B] dark:text-[#FAFAFA]">
              Password Change Required
            </h1>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="mb-5 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-[6px] text-xs text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-2.5">
          <ShieldAlertIcon size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>First login security requirement:</strong> You must set a new password before continuing to your workspace.
          </span>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-[#FEF2F2] dark:bg-rose-950/30 border border-[#FECACA] dark:border-rose-900 text-[#DC2626] dark:text-rose-400 text-xs rounded-[6px] leading-relaxed">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-medium text-[#18181B] dark:text-[#FAFAFA] mb-1.5">
              Current (temporary) password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value)
                  if (error) setError('')
                }}
                required
                placeholder="••••••••"
                className="pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] cursor-pointer"
                tabIndex={-1}
                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {showCurrentPassword ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#18181B] dark:text-[#FAFAFA] mb-1.5">
              New password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (error) setError('')
                }}
                required
                minLength={8}
                placeholder="••••••••"
                className="pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] cursor-pointer"
                tabIndex={-1}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
              </button>
            </div>
            <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] mt-1">
              Minimum 8 characters
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#18181B] dark:text-[#FAFAFA] mb-1.5">
              Confirm new password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (error) setError('')
                }}
                required
                minLength={8}
                placeholder="••••••••"
                className="pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] cursor-pointer"
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2 text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2Icon size={14} className="animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <span>Set New Password and Continue</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ForceChangePassword
