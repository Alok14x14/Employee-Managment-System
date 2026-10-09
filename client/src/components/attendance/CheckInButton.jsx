import { useState, useEffect } from 'react'
import { Loader2Icon, LogInIcon, LogOutIcon } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { formatTime } from '../../utils/formatters'
import { getWorkingHoursDisplay } from '../../utils/attendance'

const CheckInButton = ({ todayRecord, onAction }) => {
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [elapsedTime, setElapsedTime] = useState('00:00:00')

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (todayRecord?.checkIn && !todayRecord?.checkOut) {
      const timer = setInterval(() => {
        const start = new Date(todayRecord.checkIn).getTime()
        const now = new Date().getTime()
        const diff = Math.max(0, now - start)

        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)

        setElapsedTime(
          `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        )
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [todayRecord])

  const handleAttendance = async () => {
    setLoading(true)
    try {
      await api.post('/attendance')
      onAction()
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || 'Attendance action failed')
    } finally {
      setLoading(false)
    }
  }

  const isCheckedIn = Boolean(todayRecord?.checkIn && !todayRecord?.checkOut)
  const isCompleted = Boolean(todayRecord?.checkOut)

  const formattedDate = currentTime.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const formattedLiveTime = currentTime.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  if (isCompleted) {
    return (
      <div className="card p-4 sm:p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">{formattedDate}</p>
            <p className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA] mt-0.5">
              Shift completed. Total: {getWorkingHoursDisplay(todayRecord)}
            </p>
            <div className="flex items-center gap-3 text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1 tabular-nums">
              <span>Check in: <strong className="font-medium text-[#18181B] dark:text-[#FAFAFA]">{formatTime(todayRecord.checkIn)}</strong></span>
              <span>•</span>
              <span>Check out: <strong className="font-medium text-[#18181B] dark:text-[#FAFAFA]">{formatTime(todayRecord.checkOut)}</strong></span>
            </div>
          </div>
          <span className="badge badge-success self-start sm:self-auto">Completed</span>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4 sm:p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Date, Live clock (24px), Timestamps */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">{formattedDate}</span>
            {isCheckedIn && (
              <span className="badge badge-accent">
                <span className="size-1.5 rounded-full bg-[#2563EB] dark:bg-blue-400" />
                Clocked in
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-3 mt-1">
            <h2 className="text-2xl font-semibold tracking-tight text-[#18181B] dark:text-[#FAFAFA] font-mono tabular-nums">
              {formattedLiveTime}
            </h2>
            {isCheckedIn && (
              <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Elapsed: <span className="font-mono font-medium text-[#18181B] dark:text-[#FAFAFA]">{elapsedTime}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">
            {todayRecord?.checkIn ? (
              <span>
                Today's check-in: <strong className="font-medium text-[#18181B] dark:text-[#FAFAFA] font-mono">{formatTime(todayRecord.checkIn)}</strong>
              </span>
            ) : (
              <span>Not clocked in today</span>
            )}
          </div>
        </div>

        {/* Flat primary action button (using btn-danger for clock out) */}
        <div className="self-start sm:self-auto">
          <button
            onClick={handleAttendance}
            disabled={loading}
            className={isCheckedIn ? 'btn-danger' : 'btn-primary'}
          >
            {loading ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : isCheckedIn ? (
              <LogOutIcon className="size-3.5" />
            ) : (
              <LogInIcon className="size-3.5" />
            )}
            <span>{isCheckedIn ? 'Clock out' : 'Clock in'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CheckInButton