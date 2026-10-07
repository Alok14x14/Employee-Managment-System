import React, { useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { getWorkingHoursDisplay } from '../../assets/assets'
import { formatTime } from '../../utils/formatters'

const AttendanceCalendar = ({ history = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDayRecord, setSelectedDayRecord] = useState(null)

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const goToToday = () => setCurrentMonth(new Date())

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
      <div className="p-4 sm:p-5 border-b border-[#E4E4E7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#18181B]">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-4 text-xs text-[#71717A] mt-1">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#16A34A]" />
              Present ({presentCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#D97706]" />
              Late ({lateCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[#DC2626]" />
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
          <div className="flex items-center border border-[#E4E4E7] rounded-[6px] overflow-hidden">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-[#F4F4F5] text-[#71717A] hover:text-[#18181B] transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="w-px h-4 bg-[#E4E4E7]" />
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-[#F4F4F5] text-[#71717A] hover:text-[#18181B] transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 border-b border-[#E4E4E7] text-center text-xs font-medium text-[#71717A] py-2 bg-[#FAFAFA]">
        {weekdays.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar Grid: Neutral cells with small colored dots */}
      <div className="grid grid-cols-7 gap-px bg-[#E4E4E7]">
        {days.map((day) => {
          const isCurrMonth = isSameMonth(day, currentMonth)
          const isCurrDay = isToday(day)
          const record = history.find((r) => isSameDay(new Date(r.date), day))

          let dotColor = null
          if (record) {
            if (record.status === 'PRESENT') dotColor = 'bg-[#16A34A]'
            else if (record.status === 'LATE') dotColor = 'bg-[#D97706]'
            else if (record.status === 'ABSENT') dotColor = 'bg-[#DC2626]'
          }

          return (
            <button
              type="button"
              key={day.toISOString()}
              onClick={() => record && setSelectedDayRecord({ day, record })}
              className={`min-h-[72px] sm:min-h-[80px] p-2 text-left bg-white transition-colors relative flex flex-col justify-between cursor-pointer ${
                !isCurrMonth ? 'bg-[#FAFAFA] text-[#A1A1AA]' : 'hover:bg-[#F4F4F5]'
              }`}
            >
              {/* Day Number (minimum 12px) */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs tabular-nums font-medium ${
                    isCurrDay
                      ? 'size-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center'
                      : isCurrMonth
                      ? 'text-[#18181B]'
                      : 'text-[#A1A1AA]'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {/* 3 Status Colored Dot */}
                {dotColor && (
                  <span className={`size-1.5 rounded-full ${dotColor}`} />
                )}
              </div>

              {/* Working Hours Text (minimum 12px) */}
              <div className="mt-auto">
                {record?.workingHours != null && record.workingHours > 0 ? (
                  <span className="text-xs text-[#71717A] tabular-nums truncate block">
                    {record.workingHours}h
                  </span>
                ) : record?.checkIn && !record?.checkOut ? (
                  <span className="text-xs text-[#2563EB] truncate block font-medium">
                    In shift
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
          className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedDayRecord(null)}
        >
          <div
            className="card p-5 max-w-sm w-full shadow-[0_4px_12px_rgba(0,0,0,0.05)] space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E4E7]">
              <div>
                <h3 className="text-sm font-semibold text-[#18181B]">
                  {format(selectedDayRecord.day, 'EEEE, dd MMM yyyy')}
                </h3>
                <p className="text-xs text-[#71717A] capitalize">
                  Status: {selectedDayRecord.record.status?.toLowerCase() || 'unspecified'}
                </p>
              </div>
              <button
                onClick={() => setSelectedDayRecord(null)}
                className="p-1 text-[#71717A] hover:text-[#18181B] rounded-[4px]"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#E4E4E7]">
                <span className="text-[#71717A]">Check in</span>
                <span className="font-medium text-[#18181B] font-mono tabular-nums">
                  {selectedDayRecord.record.checkIn ? formatTime(selectedDayRecord.record.checkIn) : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E4E4E7]">
                <span className="text-[#71717A]">Check out</span>
                <span className="font-medium text-[#18181B] font-mono tabular-nums">
                  {selectedDayRecord.record.checkOut ? formatTime(selectedDayRecord.record.checkOut) : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#71717A]">Total duration</span>
                <span className="font-medium text-[#18181B] tabular-nums">
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
