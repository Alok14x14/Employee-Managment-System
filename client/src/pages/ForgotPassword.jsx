import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftIcon, CheckCircle2Icon, Loader2Icon, MoonIcon, SunIcon } from 'lucide-react'
import LoginLeftSide from '../components/LoginLeftSide'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const { theme, toggleTheme } = useTheme()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/auth/forgot-password', { email })
      setSubmitted(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit password reset request. Please try again.')
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
              Reset password
            </h1>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">
              Enter your work email and we&apos;ll send you instructions to reset your password.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-[#FEF2F2] dark:bg-rose-950/30 border border-[#FECACA] dark:border-rose-900 text-[#DC2626] dark:text-rose-400 text-xs rounded-[6px] leading-relaxed">
              {error}
            </div>
          )}

          {submitted ? (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-[6px]">
                <div className="flex items-start gap-3">
                  <CheckCircle2Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                      Check your email
                    </h2>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed">
                      If an account exists for <strong className="font-semibold">{email}</strong>, a reset link has been sent. The link expires in 15 minutes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] dark:text-[#3B82F6] hover:underline"
                >
                  <ArrowLeftIcon size={14} />
                  <span>Back to sign in</span>
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-medium text-[#18181B] dark:text-[#FAFAFA] mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  required
                  placeholder="name@company.com"
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-2 text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2Icon size={14} className="animate-spin" />
                    <span>Sending reset link...</span>
                  </>
                ) : (
                  <span>Send reset link</span>
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
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
