import { useCallback, useEffect, useState } from 'react'
import { PlusIcon } from 'lucide-react'
import LeaveHistory from '../components/leave/LeaveHistory'
import ApplyLeaveModal from '../components/leave/ApplyLeaveModal'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

const Leave = () => {
  const { user } = useAuth()
  const [leaves, setLeaves] = useState([])
  const [balances, setBalances] = useState([])
  const [loading, setLoading] = useState(true)
  const [balanceLoading, setBalanceLoading] = useState(true)
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

  const fetchBalances = useCallback(async () => {
    if (isAdmin) return
    try {
      const res = await api.get('/leave/balance')
      setBalances(res.data.data || [])
    } catch (error) {
      console.error('Failed to fetch leave balance:', error)
    } finally {
      setBalanceLoading(false)
    }
  }, [isAdmin])

  const refreshAll = useCallback(async () => {
    fetchLeaves()
    if (!isAdmin) fetchBalances()
  }, [fetchLeaves, fetchBalances, isAdmin])

  useEffect(() => {
    fetchLeaves()
    if (!isAdmin) fetchBalances()
  }, [fetchLeaves, fetchBalances, isAdmin])

  const activeBalances = balances

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
          {activeBalances.map((b) => {
            const label =
              b.type === 'SICK'
                ? 'Sick leave'
                : b.type === 'CASUAL'
                ? 'Casual leave'
                : 'Annual leave'
            return (
              <div key={b.type} className="card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#52525B] dark:text-[#D4D4D8]">{label}</p>
                  <span className="text-[11px] font-medium text-[#2563EB] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-[4px] tabular-nums">
                    {balanceLoading ? 'Loading…' : `${b.remaining} available`}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <p className="text-2xl font-semibold text-[#18181B] dark:text-[#FAFAFA] tabular-nums tracking-tight">
                    {balanceLoading ? '—' : b.remaining}
                  </p>
                  <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
                    available of {b.quota} days
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-[#52525B] dark:text-[#D4D4D8]">
                  Remaining includes pending requests ({balanceLoading ? '—' : b.pending} days).
                </p>
                <div className="mt-3 pt-2.5 border-t border-[#E4E4E7] dark:border-[#27272A] flex items-center justify-between text-[11px] text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
                  <span>Used: <strong className="font-medium text-[#18181B] dark:text-[#FAFAFA]">{b.used}</strong></span>
                  <span>Pending: <strong className="font-medium text-[#18181B] dark:text-[#FAFAFA]">{b.pending}</strong></span>
                  <span>Quota: <strong className="font-medium text-[#18181B] dark:text-[#FAFAFA]">{b.quota}</strong></span>
                </div>
              </div>
            )
          })}
          {balanceLoading && activeBalances.length === 0 && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card space-y-4 p-4" role="status" aria-label="Loading leave balance">
              <div className="flex items-center justify-between"><div className="h-3 w-24 rounded skeleton" /><div className="h-5 w-28 rounded skeleton" /></div>
              <div className="h-8 w-16 rounded skeleton" />
              <div className="h-3 w-40 rounded skeleton" />
              <div className="flex justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800">{Array.from({ length: 3 }).map((__, j) => <div key={j} className="h-3 w-14 rounded skeleton" />)}</div>
            </div>
          ))}
          {!balanceLoading && activeBalances.length === 0 && (
            <div className="card p-4 text-sm text-[#52525B] dark:text-[#D4D4D8] sm:col-span-3">
              Leave balances are unavailable right now. Refresh the page or contact HR if this continues.
            </div>
          )}
        </div>
      )}

      {/* Leave History Table */}
      <LeaveHistory leaves={leaves} isAdmin={isAdmin} onUpdate={refreshAll} loading={loading} />

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={refreshAll}
        balances={activeBalances}
      />
    </div>
  )
}

export default Leave
