import { useState } from 'react'
import LoginLeftSide from './LoginLeftSide'
import { useNavigate } from 'react-router-dom'
import { EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const LoginForm = ({ role = 'admin' }) => {
  const [currentRole, setCurrentRole] = useState(role || 'admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password, currentRole)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Authentication failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAFAFA]">
      <LoginLeftSide />

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-[360px]">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-[#18181B]">
              Sign in to StaffFlow
            </h1>
            <p className="text-xs text-[#71717A] mt-1">
              Enter your credentials to access your organization workspace
            </p>
          </div>

          {/* Role Segmented Control */}
          <div className="flex p-0.5 bg-[#F4F4F5] border border-[#E4E4E7] rounded-[6px] mb-5">
            <button
              type="button"
              onClick={() => {
                setCurrentRole('admin')
                setError('')
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-[5px] transition-colors cursor-pointer ${
                currentRole === 'admin'
                  ? 'bg-white text-[#18181B] border border-[#E4E4E7]'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              Administrator
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentRole('employee')
                setError('')
              }}
              className={`flex-1 py-1.5 text-xs font-medium rounded-[5px] transition-colors cursor-pointer ${
                currentRole === 'employee'
                  ? 'bg-white text-[#18181B] border border-[#E4E4E7]'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              Employee
            </button>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-xs rounded-[6px] leading-relaxed">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-[#18181B] mb-1.5">
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#18181B]">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError('')
                  }}
                  required
                  placeholder="••••••••"
                  className="pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#18181B] p-1 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading && <Loader2Icon className="animate-spin size-3.5 mr-2" />}
              Sign in as {currentRole === 'admin' ? 'Admin' : 'Employee'}
            </button>
          </form>

          <p className="mt-8 text-center text-[11px] text-[#A1A1AA]">
            Protected internal tooling. Authorized access only.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginForm