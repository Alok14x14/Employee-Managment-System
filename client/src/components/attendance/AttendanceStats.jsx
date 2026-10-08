import React from 'react'

const AttendanceStats = ({ history = [] }) => {
  const totalPresent = history.filter((h) => h.status === 'PRESENT' || h.status === 'LATE').length
  const totalLate = history.filter((h) => h.status === 'LATE').length

  const validWorkingHours = history.filter((h) => h.workingHours && h.workingHours > 0)
  const avgWorkHrs = validWorkingHours.length
    ? (validWorkingHours.reduce((acc, h) => acc + h.workingHours, 0) / validWorkingHours.length).toFixed(1) + ' hrs'
    : '0 hrs'

  const stats = [
    { label: 'Days present', value: totalPresent, helper: 'Recorded shifts' },
    { label: 'Late arrivals', value: totalLate, helper: 'Check-in after 9:00 AM' },
    { label: 'Average daily hours', value: avgWorkHrs, helper: 'Completed work duration' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="card p-4">
          <p className="text-xs font-medium text-[#71717A]">{s.label}</p>
          <p className="text-2xl font-semibold text-[#18181B] mt-1 tabular-nums tracking-tight">
            {s.value}
          </p>
          {s.helper && (
            <p className="text-[11px] text-[#A1A1AA] mt-1 truncate">{s.helper}</p>
          )}
        </div>
      ))}
    </div>
  )
}

export default AttendanceStats