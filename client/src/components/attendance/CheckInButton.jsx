import { useState, useEffect } from 'react'
import { CheckCircle2Icon, Loader2Icon, LogInIcon, LogOutIcon, XIcon } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { formatDate, formatStatus, formatTime } from '../../utils/formatters'
import { getWorkingHoursDisplay } from '../../utils/attendance'

const CheckInButton = ({ todayRecord, onAction, restriction }) => {
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [elapsedTime, setElapsedTime] = useState('00:00:00')
  const [completedShift, setCompletedShift] = useState(null)

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
      const { data } = await api.post('/attendance')
      if (isCheckedIn && data.type === 'CHECK_OUT' && data.data?.checkOut) {
        setCompletedShift(data.data)
      }
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

  const completionDialog = completedShift && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setCompletedShift(null)}>
      <section role="dialog" aria-modal="true" aria-labelledby="shift-complete-title" className="card w-full max-w-md overflow-hidden shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start gap-3 border-b border-zinc-200 p-5 dark:border-zinc-800">
          <CheckCircle2Icon className="mt-0.5 size-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="min-w-0 flex-1">
            <h2 id="shift-complete-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Shift completed</h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">You have successfully clocked out. Here are your shift details.</p>
          </div>
          <button type="button" onClick={() => setCompletedShift(null)} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200" aria-label="Close shift summary">
            <XIcon className="size-4" />
          </button>
        </div>
        <dl className="grid grid-cols-2 gap-4 p-5">
          <div><dt className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Date</dt><dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatDate(completedShift.date || completedShift.checkOut)}</dd></div>
          <div><dt className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Shift length</dt><dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{getWorkingHoursDisplay(completedShift)}</dd></div>
          <div><dt className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Clock-in</dt><dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatTime(completedShift.checkIn)}</dd></div>
          <div><dt className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Clock-out</dt><dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatTime(completedShift.checkOut)}</dd></div>
          <div className="col-span-2"><dt className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Day status</dt><dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatStatus(completedShift.dayType || completedShift.status)}</dd></div>
        </dl>
        <div className="flex justify-end border-t border-zinc-200 p-4 dark:border-zinc-800">
          <button type="button" onClick={() => setCompletedShift(null)} className="btn-primary">Done</button>
        </div>
      </section>
    </div>
  )

  if (isCompleted) {
    return (
      <>
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
        {completionDialog}
      </>
    )
  }

  const isClockInDisabled = !isCheckedIn && Boolean(restriction)

  return (
    <>
    <div className="card p-4 sm:p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Date, Live clock (24px), Timestamps */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">{formattedDate}</span>
            {isCheckedIn ? (
              <span className="badge badge-accent">
                <span className="size-1.5 rounded-full bg-[#2563EB] dark:bg-blue-400" />
                Clocked in
              </span>
              ) : restriction ? (
              <span className="badge badge-warning">
                <span className="size-1.5 rounded-full bg-[#D97706] dark:bg-amber-400" />
                Attendance unavailable today
              </span>
            ) : null}
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
            ) : restriction ? (
              null
            ) : (
              <span>{restriction ? `${restriction}. Clock-in is disabled for this day.` : 'Not clocked in today'}</span>
            )}
          </div>
        </div>

        {/* Flat primary action button (using btn-danger for clock out) */}
        <div className="self-start sm:self-auto">
          <button
            onClick={handleAttendance}
            disabled={loading || isClockInDisabled}
            title={isClockInDisabled ? restriction : undefined}
            className={
              isCheckedIn
                ? 'btn-danger'
                : isClockInDisabled
                ? 'btn-secondary opacity-60 cursor-not-allowed'
                : 'btn-primary'
            }
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
    {completionDialog}
    </>
  )
}

export default CheckInButton
