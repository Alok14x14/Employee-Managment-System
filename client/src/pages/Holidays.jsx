import { useCallback, useEffect, useState } from 'react'
import { CalendarDays, Loader2, Plus, Search, Trash2Icon, X } from 'lucide-react'
import { formatDate } from '../utils/formatters'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Pagination from '../components/Pagination'

const Holidays = () => {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  // Add holiday modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [addDate, setAddDate] = useState('')
  const [addName, setAddName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({ open: false, holiday: null })
  const [deleting, setDeleting] = useState(false)

  const fetchHolidays = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ year: String(selectedYear), page: String(page), limit: '10' })
      if (search.trim()) params.set('search', search.trim())
      const res = await api.get(`/holidays?${params.toString()}`)
      setHolidays(res.data.data || [])
      setTotal(res.data.total || 0)
    } catch {
      toast.error('Failed to load organization holidays')
    } finally {
      setLoading(false)
    }
  }, [selectedYear, page, search])

  useEffect(() => {
    fetchHolidays()
  }, [fetchHolidays])

  const totalPages = Math.max(1, Math.ceil(total / 10))

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!addDate || !addName.trim()) {
      toast.error('Please enter both date and holiday name')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/holidays', {
        date: addDate,
        name: addName.trim(),
      })
      toast.success('Holiday added successfully')
      setShowAddModal(false)
      setAddDate('')
      setAddName('')

      // If the added holiday belongs to a different year, switch to that year
      const holidayYear = parseInt(addDate.split('-')[0], 10)
      if (holidayYear && holidayYear !== selectedYear) {
        setSelectedYear(holidayYear)
      } else {
        fetchHolidays()
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to add holiday')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.holiday) return
    setDeleting(true)
    try {
      await api.delete(`/holidays/${deleteModal.holiday.id || deleteModal.holiday._id}`)
      toast.success('Holiday removed successfully')
      setDeleteModal({ open: false, holiday: null })
      fetchHolidays()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to delete holiday')
    } finally {
      setDeleting(false)
    }
  }

  const getWeekday = (dateStr) => {
    try {
      const d = new Date(dateStr)
      return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long' }).format(d)
    } catch {
      return '—'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Holidays</h1>
          <p className="page-subtitle">
            Configure observed organization non-working days for leave quota and attendance rules.
          </p>
        </div>
        <div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <Plus size={15} />
            <span>Add holiday</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] dark:text-[#71717A] size-4" />
          <input
            placeholder="Search holiday by name..."
            className="pl-9"
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            value={search}
          />
        </div>
        <select
          value={selectedYear}
          onChange={(e) => { setSelectedYear(parseInt(e.target.value, 10)); setPage(1) }}
          className="sm:w-36"
        >
          {Array.from({ length: 5 }, (_, i) => currentYear - 1 + i).map((y) => (
            <option key={y} value={y}>
              Year {y}
            </option>
          ))}
        </select>
      </div>

      {/* Table Card */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E4E4E7] dark:border-[#27272A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-[#71717A] dark:text-[#A1A1AA]" />
            <h3 className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">
              Observed holidays ({selectedYear})
            </h3>
          </div>
          <span className="text-xs text-[#71717A] dark:text-[#A1A1AA] tabular-nums">
            {loading ? '—' : `${total} days`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Holiday Name</th>
                <th>Type</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, idx) => (
                  <tr key={idx}>
                    <td><div className="h-3.5 w-24 skeleton" /></td>
                    <td><div className="h-3.5 w-20 skeleton" /></td>
                    <td><div className="h-3.5 w-40 skeleton" /></td>
                    <td><div className="h-4 w-16 skeleton" /></td>
                    <td className="text-right"><div className="h-4 w-8 skeleton ml-auto" /></td>
                  </tr>
                ))
              ) : holidays.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-14 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                    {search
                      ? 'No matching holidays found.'
                      : `No holidays configured for ${selectedYear}. Use "Add holiday" to create one.`}
                  </td>
                </tr>
              ) : (
                holidays.map((h) => {
                  const hid = h.id || h._id
                  return (
                    <tr key={hid}>
                      <td className="text-xs font-medium text-[#18181B] dark:text-[#FAFAFA] tabular-nums">
                        {formatDate(h.date)}
                      </td>
                      <td className="text-xs text-[#71717A] dark:text-[#A1A1AA]">
                        {getWeekday(h.date)}
                      </td>
                      <td className="text-xs font-medium text-[#18181B] dark:text-[#FAFAFA]">
                        {h.name}
                      </td>
                      <td>
                        <span className="badge badge-neutral">Holiday</span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => setDeleteModal({ open: true, holiday: h })}
                          className="p-1.5 rounded-[5px] text-[#DC2626] dark:text-rose-400 hover:bg-[#FEF2F2] dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete holiday"
                          aria-label={`Delete ${h.name}`}
                        >
                          <Trash2Icon className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && <Pagination page={page} totalPages={totalPages} totalItems={total} onPageChange={setPage} />}
      </div>

      {/* Add Holiday Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 dark:bg-black/60"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="card p-6 w-full max-w-md shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E4E7] dark:border-[#27272A] mb-4">
              <div>
                <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">Add holiday</h2>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                  Designate an organization non-working day
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] rounded-[4px]"
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#18181B] dark:text-[#FAFAFA] mb-1">
                  Holiday date
                </label>
                <input
                  type="date"
                  required
                  value={addDate}
                  onChange={(e) => setAddDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-medium text-[#18181B] dark:text-[#FAFAFA] mb-1">
                  Holiday name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Republic Day, Diwali, New Year's Day"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E4E4E7] dark:border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  type="submit"
                  className="btn-primary"
                >
                  {submitting && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
                  <span>Save holiday</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.holiday && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 dark:bg-black/60"
          onClick={() => setDeleteModal({ open: false, holiday: null })}
        >
          <div
            className="card p-6 w-full max-w-sm shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E4E7] dark:border-[#27272A] mb-3">
              <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">
                Remove holiday
              </h2>
              <button
                onClick={() => setDeleteModal({ open: false, holiday: null })}
                className="p-1 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] rounded-[4px]"
                aria-label="Close dialog"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
              Are you sure you want to remove <strong className="text-[#18181B] dark:text-[#FAFAFA]">{deleteModal.holiday.name}</strong> on {formatDate(deleteModal.holiday.date)}?
            </p>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#E4E4E7] dark:border-[#27272A] mt-4">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, holiday: null })}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={handleDelete}
                className="btn-danger"
              >
                {deleting && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
                <span>Delete holiday</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Holidays
