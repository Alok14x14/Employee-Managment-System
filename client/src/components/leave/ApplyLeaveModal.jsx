import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const ApplyLeaveModal = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState('')

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

    try {
      await api.post('/leave', data)
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25"
      onClick={onClose}
    >
      <div
        className="card p-6 w-full max-w-lg shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E4E7] mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[#18181B]">Apply for leave</h2>
            <p className="text-xs text-[#71717A] mt-0.5">Submit a formal time-off request for review</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#71717A] hover:text-[#18181B] rounded-[4px]"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#18181B] mb-1">Leave category</label>
            <select name="type" required>
              <option value="SICK">Sick leave</option>
              <option value="CASUAL">Casual leave</option>
              <option value="ANNUAL">Annual leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#18181B] mb-1">Start date</label>
              <input
                type="date"
                name="startDate"
                required
                min={minDate}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-medium text-[#18181B] mb-1">End date</label>
              <input
                type="date"
                name="endDate"
                required
                min={startDate || minDate}
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#18181B] mb-1">Reason for request</label>
            <textarea
              name="reason"
              required
              rows={3}
              className="resize-none"
              placeholder="State the context or purpose of time off..."
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-3 border-t border-[#E4E4E7]">
            <button
              onClick={onClose}
              type="button"
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              disabled={loading}
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