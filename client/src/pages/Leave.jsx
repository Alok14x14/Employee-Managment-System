import { useCallback, useEffect, useState } from 'react'
import Loading from '../components/Loading'
import { PlusIcon } from 'lucide-react'
import LeaveHistory from '../components/leave/LeaveHistory'
import ApplyLeaveModal from '../components/leave/ApplyLeaveModal'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

const Leave = () => {
  const { user } = useAuth()
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isDeleted, setIsDeleted] = useState(false)
  const isAdmin = user?.role === 'ADMIN'

  const fetchLeaves = useCallback(async () => {
    try {
      const res = await api.get('/leave')
      setLeaves(res.data.data || [])
      if (res.data.employee?.isDeleted) setIsDeleted(true)
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message || 'Failed to fetch leave requests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeaves()
  }, [fetchLeaves])

  if (loading) return <Loading />

  const approvedLeaves = leaves.filter((l) => l.status === 'APPROVED')
  const countDays = (items) =>
    items.reduce((sum, l) => {
      const start = new Date(l.startDate)
      const end = new Date(l.endDate)
      const diffMs = end.getTime() - start.getTime()
      const days = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1
      return sum + (days > 0 ? days : 1)
    }, 0)

  const sickCount = countDays(approvedLeaves.filter((l) => l.type === 'SICK'))
  const casualCount = countDays(approvedLeaves.filter((l) => l.type === 'CASUAL'))
  const annualCount = countDays(approvedLeaves.filter((l) => l.type === 'ANNUAL'))

  const leaveStats = [
    { label: 'Sick leave', value: sickCount, helper: 'Days approved' },
    { label: 'Casual leave', value: casualCount, helper: 'Days approved' },
    { label: 'Annual leave', value: annualCount, helper: 'Days approved' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave management</h1>
          <p className="page-subtitle">
            {isAdmin
              ? 'Review and administer employee time-off requests.'
              : 'Submit time-off requests and track balance approval.'}
          </p>
        </div>
        {!isAdmin && !isDeleted && (
          <div>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              <PlusIcon className="size-3.5" />
              <span>Apply for leave</span>
            </button>
          </div>
        )}
      </div>

      {/* Stat Cards (Employee view) */}
      {!isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {leaveStats.map((s) => (
            <div key={s.label} className="card p-4">
              <p className="text-xs font-medium text-[#71717A] dark:text-[#A1A1AA]">{s.label}</p>
              <p className="text-2xl font-semibold text-[#18181B] dark:text-[#FAFAFA] mt-1 tabular-nums tracking-tight">
                {s.value}
              </p>
              <p className="text-[11px] text-[#A1A1AA] dark:text-[#71717A] mt-1">{s.helper}</p>
            </div>
          ))}
        </div>
      )}

      {/* Leave History Table */}
      <LeaveHistory leaves={leaves} isAdmin={isAdmin} onUpdate={fetchLeaves} />

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchLeaves}
      />
    </div>
  )
}

export default Leave