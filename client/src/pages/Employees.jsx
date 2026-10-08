import { useCallback, useEffect, useState } from 'react'
import { useDepartments } from '../constants/departments'
import { Plus, Search, X, PencilIcon, Trash2Icon } from 'lucide-react'
import EmployeeForm from '../components/EmployeeForm'
import api from '../api/axios'
import toast from 'react-hot-toast'

const Employees = () => {
  const departments = useDepartments()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [editEmployee, setEditEmployee] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null })

  const fetchEmployees = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (selectedDept) params.append('department', selectedDept)
      if (statusFilter === 'deleted') params.append('status', 'deleted')

      const res = await api.get(`/employees?${params.toString()}`)
      setEmployees(res.data)
    } catch {
      toast.error('Failed to load employee list')
    } finally {
      setLoading(false)
    }
  }, [selectedDept, statusFilter])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const filtered = employees.filter((emp) =>
    `${emp.firstName} ${emp.lastName} ${emp.position}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    if (!deleteModal.id) return
    try {
      await api.delete(`/employees/${deleteModal.id}`)
      toast.success('Employee account deactivated')
      fetchEmployees()
      setDeleteModal({ open: false, id: null })
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Deletion failed')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Directory of active and archived organization personnel.</p>
        </div>
        <div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <Plus size={15} />
            <span>Add employee</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] size-4" />
          <input
            placeholder="Search by name or title..."
            className="pl-9"
            onChange={(e) => setSearch(e.target.value)}
            value={search}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:w-44"
        >
          <option value="active">Active staff</option>
          <option value="deleted">Archived staff</option>
        </select>
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="sm:w-48"
        >
          <option value="">All departments</option>
          {departments.map((deptName) => (
            <option key={deptName} value={deptName}>
              {deptName}
            </option>
          ))}
        </select>
      </div>

      {/* Employees Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Position</th>
                <th>Attendance</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeleton loading rows per Step 6
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="flex items-center gap-2.5 py-1">
                        <div className="size-7 rounded-full skeleton shrink-0" />
                        <div className="space-y-1">
                          <div className="h-3 w-28 skeleton" />
                          <div className="h-2.5 w-36 skeleton" />
                        </div>
                      </div>
                    </td>
                    <td><div className="h-3 w-20 skeleton" /></td>
                    <td><div className="h-3 w-24 skeleton" /></td>
                    <td><div className="h-4 w-14 skeleton" /></td>
                    <td className="text-right"><div className="h-4 w-12 skeleton ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-14 text-xs text-[#71717A]">
                    No employees matching the current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id || emp._id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-full bg-[#F4F4F5] border border-[#E4E4E7] text-[#52525B] text-xs font-medium flex items-center justify-center shrink-0">
                          {emp.firstName?.[0]}
                          {emp.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-[#18181B] text-xs leading-tight">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <p className="text-[11px] text-[#71717A] leading-tight mt-0.5">
                            {emp.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-[#52525B]">
                      {emp.department || 'Unassigned'}
                    </td>
                    <td className="text-xs text-[#52525B]">{emp.position}</td>
                    <td>
                      {emp.isPresentToday ? (
                        <span className="badge badge-success">Present</span>
                      ) : (
                        <span className="badge badge-neutral">Absent</span>
                      )}
                    </td>
                    <td className="text-right">
                      {!emp.isDeleted ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditEmployee(emp)}
                            className="p-1.5 text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded-[5px] transition-colors"
                            aria-label="Edit employee"
                            title="Edit"
                          >
                            <PencilIcon size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, id: emp.id || emp._id })}
                            className="p-1.5 text-[#71717A] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-[5px] transition-colors"
                            aria-label="Deactivate employee"
                            title="Deactivate"
                          >
                            <Trash2Icon size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="badge badge-danger">Archived</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Employee Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/25 flex items-start justify-center p-4 overflow-y-auto z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="card p-6 w-full max-w-xl my-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E4E4E7] mb-5">
              <div>
                <h2 className="text-base font-semibold text-[#18181B]">Add employee</h2>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Create a new staff account and profile record
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-[#71717A] hover:text-[#18181B] rounded-[4px]"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>
            <EmployeeForm
              onSuccess={() => {
                setShowCreateModal(false)
                fetchEmployees()
              }}
              onCancel={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editEmployee && (
        <div
          className="fixed inset-0 bg-black/25 flex items-start justify-center p-4 overflow-y-auto z-50"
          onClick={() => setEditEmployee(null)}
        >
          <div
            className="card p-6 w-full max-w-xl my-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E4E4E7] mb-5">
              <div>
                <h2 className="text-base font-semibold text-[#18181B]">Edit employee</h2>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Update staff credentials and employment information
                </p>
              </div>
              <button
                onClick={() => setEditEmployee(null)}
                className="p-1.5 text-[#71717A] hover:text-[#18181B] rounded-[4px]"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>
            <EmployeeForm
              initialData={editEmployee}
              onSuccess={() => {
                setEditEmployee(null)
                fetchEmployees()
              }}
              onCancel={() => setEditEmployee(null)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div
          className="fixed inset-0 bg-black/25 flex items-center justify-center p-4 z-50"
          onClick={() => setDeleteModal({ open: false, id: null })}
        >
          <div
            className="card p-6 max-w-md w-full shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E4E7]">
              <h2 className="text-sm font-semibold text-[#18181B]">Deactivate employee account</h2>
              <button
                onClick={() => setDeleteModal({ open: false, id: null })}
                className="p-1 text-[#71717A] hover:text-[#18181B] rounded-[4px]"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>
            <div className="py-4">
              <p className="text-xs text-[#52525B] leading-relaxed">
                Are you sure you want to archive this employee? Their account access will be revoked immediately and their historical records retained.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#E4E4E7]">
              <button
                onClick={() => setDeleteModal({ open: false, id: null })}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button onClick={handleDelete} className="btn-danger text-xs">
                Deactivate account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Employees