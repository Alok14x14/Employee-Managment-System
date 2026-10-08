import React from 'react'
import { getDayTypeDisplay, getWorkingHoursDisplay } from '../../utils/attendance'
import { format } from 'date-fns'

const AttendanceHistory = ({ history = [] }) => {
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E4E4E7] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#18181B]">Attendance activity</h3>
        <span className="text-xs text-[#71717A] tabular-nums">{history.length} records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Check in</th>
              <th>Check out</th>
              <th>Working hours</th>
              <th>Day type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-xs text-[#71717A]">
                  No attendance records found
                </td>
              </tr>
            ) : (
              history.map((record) => {
                const dayType = getDayTypeDisplay(record)
                const hasValidDayType = dayType.label && dayType.label !== '—' && dayType.label !== '-'

                return (
                  <tr key={record._id || record.id}>
                    <td className="text-xs font-medium text-[#18181B]">
                      {record.date ? format(new Date(record.date), 'MMM dd, yyyy') : '—'}
                    </td>
                    <td className="text-xs text-[#52525B]">
                      {record.checkIn ? format(new Date(record.checkIn), 'hh:mm a') : '—'}
                    </td>
                    <td className="text-xs text-[#52525B]">
                      <span className="inline-flex items-center gap-1.5">
                        {record.checkOut ? format(new Date(record.checkOut), 'hh:mm a') : '—'}
                        {record.autoCheckedOut && (
                          <span className="badge badge-neutral text-[10px] py-0 px-1 font-normal">
                            Auto
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="text-xs text-[#52525B] font-medium tabular-nums">
                      {getWorkingHoursDisplay(record)}
                    </td>
                    <td className="text-xs">
                      {hasValidDayType ? (
                        <span className={`badge ${dayType.className}`}>{dayType.label}</span>
                      ) : (
                        <span className="text-[#A1A1AA]">—</span>
                      )}
                    </td>
                    <td className="text-xs">
                      <span
                        className={`badge ${
                          record.status === 'PRESENT'
                            ? 'badge-success'
                            : record.status === 'LATE'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AttendanceHistory