import { useState } from 'react'
import { Check, Loader2, X } from 'lucide-react'
import { formatDate } from '../../utils/formatters'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const LeaveHistory = ({ leaves = [], isAdmin, onUpdate }) => {
  const [processing, setProcessing] = useState(null)
  const [rejectModal, setRejectModal] = useState({ open: false, leaveId: null, reason: '' })

  const handleStatusUpdate = async (id, status, reason = '') => {
    const payload = { status }
    if (status === 'REJECTED') {
      if (!reason) {
        toast.error('Rejection reason required')
        return
      }
      payload.rejectReason = reason
    }

    setProcessing(id)
    try {
      await api.patch(`/leave/${id}`, payload)
      toast.success(`Leave ${status.toLowerCase()}`)
      onUpdate()
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || 'Update failed')
    } finally {
      setProcessing(null)
    }
  }

  const handleRejectSubmit = (e) => {
    e.preventDefault()
    handleStatusUpdate(rejectModal.leaveId, 'REJECTED', rejectModal.reason)
    setRejectModal({ open: false, leaveId: null, reason: '' })
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E4E4E7] dark:border-[#27272A] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">Leave applications</h3>
        <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] tabular-nums">{leaves.length} records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {isAdmin && <th>Employee</th>}
              <th>Type</th>
              <th>Period</th>
              <th>Reason</th>
              <th>Status</th>
              {isAdmin && <th className="text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {leaves.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 4} className="text-center py-14 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  No leave requests found.
                </td>
              </tr>
            ) : (
              leaves.map((leave) => {
                const leaveId = leave._id || leave.id
                return (
                  <tr key={leaveId}>
                    {isAdmin && (
                      <td className="font-medium text-[#18181B] dark:text-[#FAFAFA] text-xs">
                        {leave.employee?.firstName} {leave.employee?.lastName}
                      </td>
                    )}
                    <td>
                      <span className="badge badge-neutral">{leave.type}</span>
                    </td>
                    <td className="text-xs text-[#52525B] dark:text-[#A1A1AA] tabular-nums">
                      {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                    </td>
                    <td className="max-w-xs truncate text-xs text-[#71717A] dark:text-[#A1A1AA]" title={leave.reason}>
                      {leave.reason || '—'}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          leave.status === 'APPROVED'
                            ? 'badge-success'
                            : leave.status === 'REJECTED'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {leave.status?.toLowerCase()}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="text-right">
                        {leave.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              disabled={Boolean(processing)}
                              onClick={() => handleStatusUpdate(leaveId, 'APPROVED')}
                              className="p-1.5 rounded-[5px] text-[#16A34A] dark:text-emerald-400 hover:bg-[#F0FDF4] dark:hover:bg-emerald-950/30 transition-colors"
                              title="Approve request"
                              aria-label="Approve leave"
                            >
                              {processing === leaveId ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Check className="size-3.5" />
                              )}
                            </button>
                            <button
                              disabled={Boolean(processing)}
                              onClick={() =>
                                setRejectModal({ open: true, leaveId, reason: '' })
                              }
                              className="p-1.5 rounded-[5px] text-[#DC2626] dark:text-rose-400 hover:bg-[#FEF2F2] dark:hover:bg-rose-950/30 transition-colors"
                              title="Reject request"
                              aria-label="Reject leave"
                            >
                              {processing === leaveId ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <X className="size-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#A1A1AA] dark:text-[#71717A]">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Rejection Reason Modal */}
      {rejectModal.open && (
        <div
          className="fixed inset-0 bg-black/25 dark:bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => setRejectModal({ open: false, leaveId: null, reason: '' })}
        >
          <div
            className="card p-6 max-w-md w-full shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E4E7] dark:border-[#27272A] mb-4">
              <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">Reject leave request</h2>
              <button
                onClick={() => setRejectModal({ open: false, leaveId: null, reason: '' })}
                className="p-1 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] rounded-[4px]"
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleRejectSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#18181B] dark:text-[#FAFAFA] mb-1">
                  Reason for rejection
                </label>
                <textarea
                  required
                  rows={3}
                  className="resize-none"
                  placeholder="Specify why this request cannot be approved..."
                  value={rejectModal.reason}
                  onChange={(e) =>
                    setRejectModal((prev) => ({ ...prev, reason: e.target.value }))
                  }
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-[#E4E4E7] dark:border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setRejectModal({ open: false, leaveId: null, reason: '' })}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-danger">
                  Confirm rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeaveHistory