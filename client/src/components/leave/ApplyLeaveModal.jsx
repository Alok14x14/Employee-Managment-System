import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const ApplyLeaveModal = ({ open, onClose, onSuccess, balances = [] }) => {
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState('SICK')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [holidays, setHolidays] = useState([])

  // Get current date formatted in IST (Asia/Kolkata) as YYYY-MM-DD
  const minDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
  }, [])

  // Fetch holidays for the year of selected start date (or current year)
  useEffect(() => {
    if (!open) return
    const year = startDate ? startDate.split('-')[0] : minDate.split('-')[0]
    api.get(`/holidays?year=${year}`)
      .then((res) => setHolidays(res.data.data || []))
      .catch(() => {})
  }, [open, startDate, minDate])

  // Reset inputs when modal closes or opens
  useEffect(() => {
    if (open) {
      setType('SICK')
      setStartDate('')
      setEndDate('')
      setReason('')
    }
  }, [open])

  // Calculate working days (excluding weekends Sat/Sun and holidays)
  const workingDays = useMemo(() => {
    if (!startDate || !endDate || startDate > endDate) return 0

    const holidayKeySet = new Set(
      holidays.map((h) => {
        const d = new Date(h.date)
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d)
      })
    )

    let count = 0
    const [sy, sm, sd] = startDate.split('-').map(Number)
    const [ey, em, ed] = endDate.split('-').map(Number)

    const cur = new Date(Date.UTC(sy, sm - 1, sd, 12, 0, 0))
    const targetEnd = new Date(Date.UTC(ey, em - 1, ed, 12, 0, 0))

    while (cur.getTime() <= targetEnd.getTime()) {
      const dayOfWeek = cur.getUTCDay() // 0 = Sun, 6 = Sat
      const curStr = cur.toISOString().split('T')[0]
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const isHoliday = holidayKeySet.has(curStr)

      if (!isWeekend && !isHoliday) {
        count++
      }
      cur.setUTCDate(cur.getUTCDate() + 1)
    }
    return count
  }, [startDate, endDate, holidays])

  const selectedBalance = balances.find((b) => b.type === type)
  const remaining = selectedBalance?.remaining ?? 0

  const hasDatesSelected = Boolean(startDate && endDate && endDate >= startDate)
  const isZeroWorkingDays = hasDatesSelected && workingDays === 0
  const isOverQuota = hasDatesSelected && workingDays > remaining
  const canSubmit = !loading && hasDatesSelected && workingDays > 0 && !isOverQuota && Boolean(reason.trim())

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return

    setLoading(true)
    try {
      await api.post('/leave', { type, startDate, endDate, reason: reason.trim() })
      toast.success('Leave application submitted')
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || err?.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 dark:bg-black/60"
      onClick={onClose}
    >
      <div
        className="card p-6 w-full max-w-lg shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E4E7] dark:border-[#27272A] mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">Apply for leave</h2>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">Submit a formal time-off request for review</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] rounded-[4px]"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-medium text-[#18181B] dark:text-[#FAFAFA]">Leave category</label>
              <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
                Available: <strong className="font-semibold text-[#18181B] dark:text-[#FAFAFA]">{remaining}d</strong>
              </span>
            </div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            >
              <option value="SICK">Sick leave (12d quota)</option>
              <option value="CASUAL">Casual leave (12d quota)</option>
              <option value="ANNUAL">Annual leave (18d quota)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#18181B] dark:text-[#FAFAFA] mb-1">Start date</label>
              <input
                type="date"
                required
                min={minDate}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  if (endDate && e.target.value > endDate) {
                    setEndDate(e.target.value)
                  }
                }}
              />
            </div>
            <div>
              <label className="block font-medium text-[#18181B] dark:text-[#FAFAFA] mb-1">End date</label>
              <input
                type="date"
                required
                min={startDate || minDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Live Working Days & Balance Helper */}
          {hasDatesSelected && (
            <div>
              {isZeroWorkingDays ? (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 rounded-[6px] flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>Selected dates fall on weekends/holidays (0 working days).</span>
                </div>
              ) : isOverQuota ? (
                <div className="p-2.5 bg-[#FEF2F2] dark:bg-rose-950/30 border border-[#FECACA] dark:border-rose-900 text-[#DC2626] dark:text-rose-400 rounded-[6px] flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>
                    Requested {workingDays} days exceeds remaining balance ({remaining} days for {type.toLowerCase()}).
                  </span>
                </div>
              ) : (
                <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/25 border border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-300 rounded-[6px] flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="size-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{workingDays} working day{workingDays !== 1 ? 's' : ''} requested</span>
                  </span>
                  <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
                    {remaining - workingDays} days remaining after request
                  </span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block font-medium text-[#18181B] dark:text-[#FAFAFA] mb-1">Reason for request</label>
            <textarea
              required
              rows={3}
              className="resize-none"
              placeholder="State the context or purpose of time off..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E4E4E7] dark:border-[#27272A]">
            <button
              onClick={onClose}
              type="button"
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              disabled={!canSubmit}
              type="submit"
              className="btn-primary"
            >
              {loading && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
              <span>Submit request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ApplyLeaveModal