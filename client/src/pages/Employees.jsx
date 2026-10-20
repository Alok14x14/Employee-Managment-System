import { useCallback, useEffect, useState } from 'react'
import { useDepartments } from '../constants/departments'
import { Plus, Search, X, PencilIcon, Trash2Icon, Mail, UsersRound } from 'lucide-react'
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
    `${emp.firstName} ${emp.lastName} ${emp.position} ${emp.email}`
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

      <div className="page-header -mt-3">
        <p className="page-subtitle">Find employees by name, department, or job title.</p>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"><UsersRound className="size-3.5" />{loading ? '—' : filtered.length} employees</span>
      </div>

      {/* Directory filters */}
      <div className="card grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_180px_220px]">
        <label className="relative block"><span className="sr-only">Search employees</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] dark:text-[#71717A] size-4" />
          <input
            placeholder="Search by name or email…"
            type="search"
            className="pl-9"
            onChange={(e) => setSearch(e.target.value)}
            value={search}
          />
        </label>
        <label><span className="sr-only">Filter employee status</span><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="active">Active staff</option>
          <option value="deleted">Archived staff</option>
        </select></label>
        <label><span className="sr-only">Filter by department</span><select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((deptName) => (
            <option key={deptName} value={deptName}>
              {deptName}
            </option>
          ))}
        </select></label>
      </div>

      {loading ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="card h-28 skeleton" />)}</div> : filtered.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center"><UsersRound className="size-8 text-zinc-300 dark:text-zinc-600" /><p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">No employees found</p><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Try a different name, department, or status.</p></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((emp) => <article key={emp.id || emp._id} className="card flex items-start gap-3 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">{emp.firstName?.[0]}{emp.lastName?.[0]}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2"><div className="min-w-0"><h2 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{emp.firstName} {emp.lastName}</h2><p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">{emp.position}</p></div>
              {!emp.isDeleted ? <div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => setEditEmployee(emp)} className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100" aria-label={`Edit ${emp.firstName} ${emp.lastName}`} title="Edit"><PencilIcon size={14} /></button><button type="button" onClick={() => setDeleteModal({ open: true, id: emp.id || emp._id })} className="rounded p-1.5 text-zinc-500 hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400" aria-label={`Deactivate ${emp.firstName} ${emp.lastName}`} title="Deactivate"><Trash2Icon size={14} /></button></div> : <span className="badge badge-danger shrink-0">Archived</span>}
            </div>
            <span className="mt-2 inline-flex max-w-full truncate rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{emp.department || 'Unassigned'}</span>
            <a href={`mailto:${emp.email}`} className="mt-3 flex min-w-0 items-center gap-1.5 text-xs text-blue-600 hover:underline dark:text-blue-400"><Mail className="size-3.5 shrink-0" /><span className="truncate">{emp.email}</span></a>
          </div>
        </article>)}</div>
      )}

      {/* Create Employee Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/25 dark:bg-black/60 flex items-start justify-center p-4 overflow-y-auto z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="card p-6 w-full max-w-xl my-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E4E4E7] dark:border-[#27272A] mb-5">
              <div>
                <h2 className="text-base font-semibold text-[#18181B] dark:text-[#FAFAFA]">Add employee</h2>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                  Create a new staff account and profile record
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] rounded-[4px]"
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
          className="fixed inset-0 bg-black/25 dark:bg-black/60 flex items-start justify-center p-4 overflow-y-auto z-50"
          onClick={() => setEditEmployee(null)}
        >
          <div
            className="card p-6 w-full max-w-xl my-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E4E4E7] dark:border-[#27272A] mb-5">
              <div>
                <h2 className="text-base font-semibold text-[#18181B] dark:text-[#FAFAFA]">Edit employee</h2>
                <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                  Update staff credentials and employment information
                </p>
              </div>
              <button
                onClick={() => setEditEmployee(null)}
                className="p-1.5 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] rounded-[4px]"
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
          className="fixed inset-0 bg-black/25 dark:bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => setDeleteModal({ open: false, id: null })}
        >
          <div
            className="card p-6 max-w-md w-full shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E4E7] dark:border-[#27272A]">
              <h2 className="text-sm font-semibold text-[#18181B] dark:text-[#FAFAFA]">Deactivate employee account</h2>
              <button
                onClick={() => setDeleteModal({ open: false, id: null })}
                className="p-1 text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#FAFAFA] rounded-[4px]"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>
            <div className="py-4">
              <p className="text-xs text-[#52525B] dark:text-[#D4D4D8] leading-relaxed">
                Are you sure you want to archive this employee? Their account access will be revoked immediately and their historical records retained.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#E4E4E7] dark:border-[#27272A]">
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
