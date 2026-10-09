import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, Loader2Icon, MoonIcon, SunIcon } from 'lucide-react'
import LoginLeftSide from '../components/LoginLeftSide'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

const ResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTokenError, setIsTokenError] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsTokenError(false)

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { data } = await api.post('/auth/reset-password', { token, newPassword })
      if (data.success) {
        toast.success('Password reset successfully. Please sign in with your new password.')
        navigate('/login')
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to reset password. Please try again.'
      setError(msg)
      if (err.response?.status === 400) {
        setIsTokenError(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAFAFA] dark:bg-[#0A0A0B]">
      <LoginLeftSide />

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white dark:bg-[#111113] relative">
        {/* Theme toggle in top-right corner */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] border border-transparent hover:border-[#E4E4E7] dark:hover:border-[#27272A] rounded-[6px] transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>
        </div>

        <div className="w-full max-w-[360px]">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-[#18181B] dark:text-[#FAFAFA]">
              Set new password
            </h1>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">
              Please enter a new password for your account. Must be at least 8 characters.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-[#FEF2F2] dark:bg-rose-950/30 border border-[#FECACA] dark:border-rose-900 text-[#DC2626] dark:text-rose-400 text-xs rounded-[6px] leading-relaxed">
              <p>{error}</p>
              {isTokenError && (
                <div className="mt-2 pt-2 border-t border-rose-200 dark:border-rose-900/60">
                  <Link
                    to="/forgot-password"
                    className="font-medium underline hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
                  >
                    Request a new password reset link &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
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
                <span>Reset password</span>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] transition-colors"
              >
                <ArrowLeftIcon size={14} />
                <span>Back to sign in</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
