import React, { useState } from 'react';
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
  isWeekend,
  isFuture,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar as CalendarIcon,
  X,
  Info,
} from 'lucide-react';
import { getDayTypeDisplay, getWorkingHoursDisplay } from '../../assets/assets';

const AttendanceCalendar = ({ history = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDayRecord, setSelectedDayRecord] = useState(null);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Filter history for current month metrics
  const monthRecords = history.filter((r) => isSameMonth(new Date(r.date), currentMonth));
  const presentCount = monthRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const lateCount = monthRecords.filter((r) => r.status === 'LATE').length;
  const absentCount = monthRecords.filter((r) => r.status === 'ABSENT').length;
  const totalHours = monthRecords.reduce((acc, r) => acc + (r.workingHours || 0), 0);
  const avgHours = presentCount > 0 ? (totalHours / presentCount).toFixed(1) : 0;

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="surface-card overflow-hidden shadow-sm animate-fade-in mb-8">
      {/* Calendar Header with Navigation & Quick Metrics */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Monthly attendance distribution & hours heatmap
            </p>
          </div>
        </div>

        {/* Quick Month Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={prevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-white transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-white transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Summary Statistics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-4 sm:px-6 bg-slate-50/70 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200/60 shadow-2xs">
          <div className="size-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
          <div>
            <span className="text-slate-400 text-[11px] block">Present</span>
            <span className="font-bold text-slate-800 text-sm">{presentCount} Days</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200/60 shadow-2xs">
          <div className="size-2.5 rounded-full bg-amber-500 ring-2 ring-amber-100" />
          <div>
            <span className="text-slate-400 text-[11px] block">Late Arrivals</span>
            <span className="font-bold text-slate-800 text-sm">{lateCount} Days</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200/60 shadow-2xs">
          <div className="size-2.5 rounded-full bg-rose-500 ring-2 ring-rose-100" />
          <div>
            <span className="text-slate-400 text-[11px] block">Absent</span>
            <span className="font-bold text-slate-800 text-sm">{absentCount} Days</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200/60 shadow-2xs">
          <div className="size-2.5 rounded-full bg-indigo-500 ring-2 ring-indigo-100" />
          <div>
            <span className="text-slate-400 text-[11px] block">Avg. Work / Day</span>
            <span className="font-bold text-slate-800 text-sm">{avgHours} Hrs</span>
          </div>
        </div>
      </div>

      {/* Weekday Column Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-2.5 bg-slate-50/50">
        {weekdays.map((day, idx) => (
          <div key={day} className={idx >= 5 ? 'text-slate-400' : ''}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Heatmap Grid */}
      <div className="grid grid-cols-7 gap-px bg-slate-200">
        {days.map((day, index) => {
          const isCurrMonth = isSameMonth(day, currentMonth);
          const isCurrDay = isToday(day);
          const isWeekendDay = isWeekend(day);
          const isFutureDay = isFuture(day) && !isCurrDay;

          // Find attendance record for this day
          const record = history.find((r) => isSameDay(new Date(r.date), day));
          const dayTypeInfo = record ? getDayTypeDisplay(record) : null;
          const workingHrsText = record ? getWorkingHoursDisplay(record) : null;

          // Heatmap cell background styling
          let cellBg = 'bg-white hover:bg-slate-50/80';
          let borderAccent = 'border-transparent';
          let statusColor = 'text-slate-400';

          if (!isCurrMonth) {
            cellBg = 'bg-slate-50/60 text-slate-300';
          } else if (record) {
            if (record.status === 'PRESENT') {
              if (record.workingHours >= 8) {
                cellBg = 'bg-emerald-50 hover:bg-emerald-100/70 border-emerald-200';
                statusColor = 'text-emerald-700';
              } else {
                cellBg = 'bg-teal-50 hover:bg-teal-100/70 border-teal-200';
                statusColor = 'text-teal-700';
              }
            } else if (record.status === 'LATE') {
              cellBg = 'bg-amber-50 hover:bg-amber-100/70 border-amber-200';
              statusColor = 'text-amber-700';
            } else if (record.status === 'ABSENT') {
              cellBg = 'bg-rose-50 hover:bg-rose-100/70 border-rose-200';
              statusColor = 'text-rose-700';
            }
          } else if (isWeekendDay) {
            cellBg = 'bg-slate-50/80 text-slate-400';
          } else if (!isFutureDay) {
            // Past weekday with no log
            cellBg = 'bg-white hover:bg-slate-50';
          }

          return (
            <div
              key={day.toISOString()}
              onClick={() => record && setSelectedDayRecord({ day, record })}
              className={`min-h-[92px] sm:min-h-[110px] p-2 sm:p-2.5 transition-all duration-150 flex flex-col justify-between relative group ${
                record ? 'cursor-pointer' : 'cursor-default'
              } ${cellBg} ${isCurrDay ? 'ring-2 ring-indigo-500 ring-inset z-10' : ''}`}
            >
              {/* Day Top Bar: Date Number + Indicators */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs sm:text-sm font-semibold rounded-md size-6 flex items-center justify-center ${
                    isCurrDay
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isCurrMonth
                      ? 'text-slate-800'
                      : 'text-slate-300'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {/* Status Dot / Indicator */}
                {record && (
                  <span
                    className={`size-2 rounded-full ${
                      record.status === 'PRESENT'
                        ? 'bg-emerald-500'
                        : record.status === 'LATE'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    title={record.status}
                  />
                )}
              </div>

              {/* Day Body: Attendance Hours & Badges */}
              <div className="mt-1 space-y-1">
                {record ? (
                  <>
                    <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-slate-800">
                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                      <span className="truncate">{workingHrsText}</span>
                    </div>

                    <div className="hidden sm:flex items-center justify-between gap-1">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          record.status === 'PRESENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : record.status === 'LATE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {record.status}
                      </span>

                      {record.checkIn && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {format(new Date(record.checkIn), 'hh:mm a')}
                        </span>
                      )}
                    </div>
                  </>
                ) : isWeekendDay && isCurrMonth ? (
                  <span className="text-[10px] text-slate-400 italic hidden sm:inline">
                    Weekend
                  </span>
                ) : !isFutureDay && isCurrMonth ? (
                  <span className="text-[10px] text-slate-300 hidden sm:inline">
                    No log
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Heatmap Legend Footer */}
      <div className="p-4 sm:px-6 bg-slate-50/50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" /> Heatmap Intensity:
          </span>

          <div className="flex items-center gap-1.5">
            <span className="size-3.5 rounded bg-emerald-100 border border-emerald-300" />
            <span className="text-[11px] text-slate-600">Present (8h+)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="size-3.5 rounded bg-teal-100 border border-teal-300" />
            <span className="text-[11px] text-slate-600">Partial (&lt;8h)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="size-3.5 rounded bg-amber-100 border border-amber-300" />
            <span className="text-[11px] text-slate-600">Late Arrival</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="size-3.5 rounded bg-rose-100 border border-rose-300" />
            <span className="text-[11px] text-slate-600">Absent</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="size-3.5 rounded bg-slate-200" />
            <span className="text-[11px] text-slate-400">Weekend / Off</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          Click any active day to view detailed check-in timestamps
        </p>
      </div>

      {/* Day Details Modal */}
      {selectedDayRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 relative">
            <button
              onClick={() => setSelectedDayRecord(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">
                  {format(selectedDayRecord.day, 'EEEE, MMM dd, yyyy')}
                </h3>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                    selectedDayRecord.record.status === 'PRESENT'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedDayRecord.record.status === 'LATE'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedDayRecord.record.status}
                </span>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Check In Time:</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {selectedDayRecord.record.checkIn
                    ? format(new Date(selectedDayRecord.record.checkIn), 'hh:mm:ss a')
                    : '—'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Check Out Time:</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {selectedDayRecord.record.checkOut
                    ? format(new Date(selectedDayRecord.record.checkOut), 'hh:mm:ss a')
                    : 'In Progress'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500">Total Working Hours:</span>
                <span className="font-bold text-indigo-600 text-sm">
                  {getWorkingHoursDisplay(selectedDayRecord.record)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Day Classification:</span>
                <span className="font-medium text-slate-700">
                  {getDayTypeDisplay(selectedDayRecord.record).label}
                </span>
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={() => setSelectedDayRecord(null)}
                className="w-full btn-secondary text-center cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendar;
