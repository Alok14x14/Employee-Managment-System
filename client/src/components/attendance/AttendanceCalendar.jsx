import { useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { getWorkingHoursDisplay } from '../../utils/attendance'
import { formatTime, formatISTDate, istDayKey } from '../../utils/formatters'

const AttendanceCalendar = ({
  history = [],
  currentMonth: controlledMonth,
  onMonthChange,
}) => {
  const [internalMonth, setInternalMonth] = useState(new Date())
  const currentMonth = controlledMonth || internalMonth
  const [selectedDayRecord, setSelectedDayRecord] = useState(null)

  const handleMonthChange = (newMonth) => {
    if (onMonthChange) {
      onMonthChange(newMonth)
    } else {
      setInternalMonth(newMonth)
    }
  }

  const prevMonth = () => handleMonthChange(subMonths(currentMonth, 1))
  const nextMonth = () => handleMonthChange(addMonths(currentMonth, 1))
  const goToToday = () => handleMonthChange(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: startDate, end: endDate })

  // Current month aggregates
  const monthRecords = history.filter((r) => isSameMonth(new Date(r.date), currentMonth))
  const presentCount = monthRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length
  const lateCount = monthRecords.filter((r) => r.status === 'LATE').length
  const absentCount = monthRecords.filter((r) => r.status === 'ABSENT').length

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="card overflow-hidden mb-6">
      {/* Calendar Header with Controls & 3 Status Legend */}
      <div className="p-4 sm:p-5 border-b border-[#E4E4E7] dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-4 text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#16A34A] dark:bg-emerald-400" />
              Present ({presentCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#D97706] dark:bg-amber-400" />
              Late ({lateCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#DC2626] dark:bg-rose-500" />
              Absent ({absentCount})
            </span>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="btn-secondary h-8 px-2.5 text-xs"
          >
            Today
          </button>
          <div className="flex items-center border border-[#E4E4E7] dark:border-[#27272A] rounded-[6px] overflow-hidden">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="w-px h-4 bg-[#E4E4E7] dark:bg-[#27272A]" />
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 border-b border-[#E4E4E7] dark:border-[#27272A] text-center text-xs font-medium text-[#71717A] dark:text-[#A1A1AA] py-2 bg-[#FAFAFA] dark:bg-[#111113]">
        {weekdays.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar Grid: Neutral cells with small colored dots */}
      <div className="grid grid-cols-7 gap-px bg-[#E4E4E7] dark:bg-[#27272A]">
        {days.map((day) => {
          const isCurrMonth = isSameMonth(day, currentMonth)
          const isCurrDay = isToday(day)
          const record = history.find((r) => istDayKey(r.date) === format(day, 'yyyy-MM-dd'))

          let dotColor = null
          if (record) {
            if (record.status === 'PRESENT') dotColor = 'bg-[#16A34A] dark:bg-emerald-400'
            else if (record.status === 'LATE') dotColor = 'bg-[#D97706] dark:bg-amber-400'
            else if (record.status === 'ABSENT') dotColor = 'bg-[#DC2626] dark:bg-rose-500'
          }

          return (
            <button
              type="button"
              key={day.toISOString()}
              onClick={() => record && setSelectedDayRecord({ day, record })}
              className={`min-h-[72px] sm:min-h-[80px] p-2 text-left transition-colors relative flex flex-col justify-between cursor-pointer ${
                !isCurrMonth
                  ? 'bg-[#FAFAFA] dark:bg-[#111113] text-[#A1A1AA] dark:text-[#52525B]'
                  : 'bg-white dark:bg-[#18181B] hover:bg-[#F4F4F5] dark:hover:bg-[#202024]'
              }`}
            >
              {/* Day Number */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs tabular-nums font-medium ${
                    isCurrDay
                      ? 'size-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center'
                      : isCurrMonth
                      ? 'text-[#18181B] dark:text-[#FAFAFA]'
                      : 'text-[#A1A1AA] dark:text-[#52525B]'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {/* Status Colored Dot */}
                {dotColor && (
                  <span className={`size-1.5 rounded-full ${dotColor}`} />
                )}
              </div>

              {/* Working Hours Text */}
              <div className="mt-auto">
                {record?.workingHours != null && record.workingHours > 0 ? (
                  <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] tabular-nums truncate block">
                    {record.workingHours}h
                  </span>
                ) : record?.checkIn && !record?.checkOut ? (
                  <span className="text-xs text-[#2563EB] dark:text-blue-400 truncate block font-medium">
                    In shift
                  </span>
                ) : record?.status === 'ABSENT' ? (
                  <span className="text-xs text-[#DC2626] dark:text-rose-400 truncate block font-medium">
                    Absent
                  </span>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>

      {/* Detail Modal for Selected Day */}
      {selectedDayRecord && (
        <div
          className="fixed inset-0 bg-black/25 dark:bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedDayRecord(null)}
        >
          <div
            className="card p-5 max-w-sm w-full shadow-[0_4px_12px_rgba(0,0,0,0.05)] space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E4E7] dark:border-[#27272A]">
              <div>
                <h3 className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">
                  {formatISTDate(selectedDayRecord.record?.date || selectedDayRecord.day, { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
                </h3>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] capitalize">
                  Status: {selectedDayRecord.record.status?.toLowerCase() || 'unspecified'}
                </p>
              </div>
              <button
                onClick={() => setSelectedDayRecord(null)}
                className="p-1 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] rounded-[4px]"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#E4E4E7] dark:border-[#27272A]">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">Check in</span>
                <span className="font-medium text-[#18181B] dark:text-[#FAFAFA] font-mono tabular-nums">
                  {selectedDayRecord.record.checkIn ? formatTime(selectedDayRecord.record.checkIn, { timeZone: 'Asia/Kolkata' }) : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E4E4E7] dark:border-[#27272A]">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">Check out</span>
                <span className="font-medium text-[#18181B] dark:text-[#FAFAFA] font-mono tabular-nums inline-flex items-center gap-1.5">
                  {selectedDayRecord.record.checkOut ? formatTime(selectedDayRecord.record.checkOut, { timeZone: 'Asia/Kolkata' }) : '—'}
                  {selectedDayRecord.record.autoCheckedOut && (
                    <span className="badge badge-neutral text-[10px] py-0 px-1 font-normal font-sans">
                      Auto
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#71717A] dark:text-[#A1A1AA]">Total duration</span>
                <span className="font-medium text-[#18181B] dark:text-[#FAFAFA] tabular-nums">
                  {getWorkingHoursDisplay(selectedDayRecord.record)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedDayRecord(null)}
              className="btn-secondary w-full text-xs mt-3"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AttendanceCalendar
