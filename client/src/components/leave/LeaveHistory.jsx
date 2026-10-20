import { useEffect, useState } from 'react'
import { Check, Loader2, Trash2, X } from 'lucide-react'
import { formatDate, formatStatus, istDayKey } from '../../utils/formatters'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Pagination from '../Pagination'

const LeaveHistory = ({ leaves = [], isAdmin, onUpdate, loading = false, page = 1, total = leaves.length, totalPages = 1, onPageChange }) => {
  const [processing, setProcessing] = useState(null)
  const [rejectModal, setRejectModal] = useState({ open: false, leaveId: null, reason: '' })
  const [selectedLeave, setSelectedLeave] = useState(null)

  useEffect(() => {
    if (!selectedLeave && !rejectModal.open) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedLeave(null)
        setRejectModal({ open: false, leaveId: null, reason: '' })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedLeave, rejectModal.open])

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
      setSelectedLeave(null)
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

  const handleCancel = async (event, leaveId) => {
    event.stopPropagation()
    if (!window.confirm('Cancel this pending leave request?')) return
    setProcessing(leaveId)
    try {
      await api.delete(`/leave/${leaveId}`)
      toast.success('Leave request cancelled')
      onUpdate()
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || 'Cancellation failed')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E4E4E7] dark:border-[#27272A] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">Leave applications</h3>
        <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
          {loading ? '—' : `${total} records`}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {isAdmin && <th>Employee</th>}
              <th>Type</th>
              <th>Period</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, idx) => (
                <tr key={idx}>
                  {isAdmin && (
                    <td>
                      <div className="h-3.5 w-32 skeleton" />
                    </td>
                  )}
                  <td><div className="h-4 w-16 skeleton" /></td>
                  <td><div className="h-3.5 w-32 skeleton" /></td>
                  <td><div className="h-3.5 w-10 skeleton" /></td>
                  <td><div className="h-3.5 w-44 skeleton" /></td>
                  <td><div className="h-4 w-16 skeleton" /></td>
                  <td className="text-right"><div className="h-4 w-14 skeleton ml-auto" /></td>
                </tr>
              ))
            ) : leaves.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="text-center py-14 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                  No leave requests found.
                </td>
              </tr>
            ) : (
              leaves.map((leave) => {
                const leaveId = leave._id || leave.id
                return (
                  <tr
                    key={leaveId}
                    tabIndex={0}
                    aria-label={`View ${leave.type?.toLowerCase() || ''} leave request details`}
                    title="Open leave request details"
                    className="cursor-pointer hover:bg-[#FAFAFA] dark:hover:bg-[#202024] focus-visible:outline-2 focus-visible:outline-primary"
                    onClick={() => setSelectedLeave(leave)}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setSelectedLeave(leave)
                      }
                    }}
                  >
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
                    <td className="text-xs text-[#52525B] dark:text-[#A1A1AA] tabular-nums font-medium">
                      {leave.workingDays != null ? `${leave.workingDays}d` : '—'}
                    </td>
                    <td
                      className="max-w-xs truncate text-xs text-[#71717A] dark:text-[#A1A1AA]"
                      title={
                        leave.status === 'REJECTED' && leave.rejectReason
                          ? `${leave.reason || ''} (Reason for rejection: ${leave.rejectReason})`
                          : leave.reason
                      }
                    >
                      {leave.reason || '—'}
                    </td>
                    <td>
                      <div className="inline-flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`badge ${
                            leave.status === 'APPROVED'
                              ? 'badge-success'
                              : leave.status === 'REJECTED'
                              ? 'badge-danger'
                              : 'badge-warning'
                          }`}
                        >
                          {formatStatus(leave.status)}
                        </span>
                        {(leave.autoRejected || leave.rejectReason === 'Auto Rejected') && (
                          <span
                            className="badge badge-neutral text-[10px] py-0.5 px-1.5 font-normal"
                            title="Auto Rejected: start date and time passed before approval"
                          >
                            Auto Rejected
                          </span>
                        )}
                      </div>
                    </td>
                    {isAdmin ? (
                      <td className="text-right">
                        {leave.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              disabled={Boolean(processing)}
                              onClick={(event) => {
                                event.stopPropagation()
                                handleStatusUpdate(leaveId, 'APPROVED')
                              }}
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
                              onClick={(event) => {
                                event.stopPropagation()
                                setRejectModal({ open: true, leaveId, reason: '' })
                              }}
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
                    ) : (
                      <td className="text-right">
                        {leave.status === 'PENDING' && istDayKey(leave.startDate) > istDayKey(new Date()) ? (
                          <button
                            type="button"
                            disabled={Boolean(processing)}
                            onClick={(event) => handleCancel(event, leaveId)}
                            className="btn-secondary h-7 px-2.5 text-xs inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-300"
                            aria-label="Cancel pending leave request"
                          >
                            {processing === leaveId ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                            Cancel
                          </button>
                        ) : <span className="text-xs text-[#71717A] dark:text-[#A1A1AA]">—</span>}
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {!loading && <Pagination page={page} totalPages={totalPages} totalItems={total} onPageChange={onPageChange} />}

      {/* Full leave request details */}
      {selectedLeave && (
        <div
          className="fixed inset-0 bg-black/25 dark:bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedLeave(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-details-title"
            className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E4E4E7] dark:border-[#27272A] mb-5">
              <div className="min-w-0">
                <h2 id="leave-details-title" className="text-base font-semibold text-[#18181B] dark:text-[#FAFAFA]">
                  Leave request details
                </h2>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1">
                  {formatStatus(selectedLeave.type)} leave · {formatStatus(selectedLeave.status, 'Pending')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeave(null)}
                className="p-1.5 shrink-0 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] rounded-[4px]"
                aria-label="Close leave details"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-5 text-xs">
              {isAdmin && (
                <section className="space-y-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#71717A] dark:text-[#A1A1AA]">Employee</h3>
                  <p className="text-sm font-medium text-[#18181B] dark:text-[#FAFAFA]">
                    {[selectedLeave.employee?.firstName, selectedLeave.employee?.lastName].filter(Boolean).join(' ') || 'Employee details unavailable'}
                  </p>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[#52525B] dark:text-[#D4D4D8]">
                    <div>
                      <dt className="text-[#71717A] dark:text-[#A1A1AA]">Email</dt>
                      <dd className="break-all">{selectedLeave.employee?.email || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-[#71717A] dark:text-[#A1A1AA]">Department</dt>
                      <dd>{selectedLeave.employee?.department || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-[#71717A] dark:text-[#A1A1AA]">Position</dt>
                      <dd>{selectedLeave.employee?.position || '—'}</dd>
                    </div>
                  </dl>
                </section>
              )}

              <section className="space-y-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#71717A] dark:text-[#A1A1AA]">Request</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-[#52525B] dark:text-[#D4D4D8]">
                  <div>
                    <dt className="text-[#71717A] dark:text-[#A1A1AA]">Leave type</dt>
                    <dd className="mt-0.5 font-medium text-[#18181B] dark:text-[#FAFAFA]">{selectedLeave.type || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[#71717A] dark:text-[#A1A1AA]">Working days</dt>
                    <dd className="mt-0.5 font-medium text-[#18181B] dark:text-[#FAFAFA]">{selectedLeave.workingDays != null ? `${selectedLeave.workingDays} days` : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[#71717A] dark:text-[#A1A1AA]">Start date</dt>
                    <dd className="mt-0.5">{formatDate(selectedLeave.startDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-[#71717A] dark:text-[#A1A1AA]">End date</dt>
                    <dd className="mt-0.5">{formatDate(selectedLeave.endDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-[#71717A] dark:text-[#A1A1AA]">Submitted</dt>
                    <dd className="mt-0.5">{formatDate(selectedLeave.createdAt)}</dd>
                  </div>
                </dl>
              </section>

              <section className="space-y-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#71717A] dark:text-[#A1A1AA]">Employee reason</h3>
                <p className="rounded-[6px] border border-[#E4E4E7] dark:border-[#3F3F46] bg-[#FAFAFA] dark:bg-[#111113] p-3 text-[#52525B] dark:text-[#D4D4D8] whitespace-pre-wrap break-words">
                  {selectedLeave.reason || 'No reason provided.'}
                </p>
              </section>

              {(selectedLeave.rejectReason || selectedLeave.autoRejected) && (
                <section className="space-y-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#71717A] dark:text-[#A1A1AA]">
                    {selectedLeave.autoRejected || selectedLeave.rejectReason === 'Auto Rejected' ? 'Automatic decision' : 'Rejection reason'}
                  </h3>
                  <p className="rounded-[6px] border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 p-3 text-[#991B1B] dark:text-rose-300 whitespace-pre-wrap break-words">
                    {selectedLeave.rejectReason || 'Automatically rejected because the leave start date passed before review.'}
                  </p>
                </section>
              )}
            </div>

            {isAdmin && selectedLeave.status === 'PENDING' && (
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-5 mt-5 border-t border-[#E4E4E7] dark:border-[#27272A]">
                <button
                  type="button"
                  className="btn-danger inline-flex items-center justify-center gap-1.5"
                  disabled={Boolean(processing)}
                  onClick={() => {
                    setSelectedLeave(null)
                    setRejectModal({ open: true, leaveId: selectedLeave._id || selectedLeave.id, reason: '' })
                  }}
                >
                  <X className="size-3.5" />
                  Reject application
                </button>
                <button
                  type="button"
                  className="btn-primary inline-flex items-center justify-center gap-1.5"
                  disabled={Boolean(processing)}
                  onClick={() => handleStatusUpdate(selectedLeave._id || selectedLeave.id, 'APPROVED')}
                >
                  {processing === (selectedLeave._id || selectedLeave.id)
                    ? <Loader2 className="size-3.5 animate-spin" />
                    : <Check className="size-3.5" />}
                  Accept application
                </button>
              </div>
            )}
          </section>
        </div>
      )}

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
