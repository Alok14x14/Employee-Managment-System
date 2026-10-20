import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDepartments } from '../constants/departments'
import { Plus, Search, X, UsersRound } from 'lucide-react'
import EmployeeForm from '../components/EmployeeForm'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Pagination from '../components/Pagination'

const Employees = () => {
  const departments = useDepartments()
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [page, setPage] = useState(1)
  const [totalEmployees, setTotalEmployees] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '12')
      if (search.trim()) params.set('search', search.trim())
      if (selectedDept) params.append('department', selectedDept)
      if (statusFilter === 'deleted') params.append('status', 'deleted')

      const res = await api.get(`/employees?${params.toString()}`)
      setEmployees(res.data.data)
      setTotalEmployees(res.data.total)
    } catch {
      toast.error('Failed to load employee list')
    } finally {
      setLoading(false)
    }
  }, [page, search, selectedDept, statusFilter])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const totalPages = Math.max(1, Math.ceil(totalEmployees / 12))

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
        <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"><UsersRound className="size-3.5" />{loading ? '—' : totalEmployees} employees</span>
      </div>

      {/* Directory filters */}
      <div className="card grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_180px_220px]">
        <label className="relative block"><span className="sr-only">Search employees</span>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] dark:text-[#71717A] size-4" />
          <input
            placeholder="Search by name or email…"
            type="search"
            className="pl-9"
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            value={search}
          />
        </label>
        <label><span className="sr-only">Filter employee status</span><select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="active">Active staff</option>
          <option value="deleted">Archived staff</option>
        </select></label>
        <label><span className="sr-only">Filter by department</span><select value={selectedDept} onChange={(e) => { setSelectedDept(e.target.value); setPage(1) }}>
          <option value="">All departments</option>
          {departments.map((deptName) => (
            <option key={deptName} value={deptName}>
              {deptName}
            </option>
          ))}
        </select></label>
      </div>

      {loading ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 12 }).map((_, index) => <div key={index} className="card h-28 skeleton" />)}</div> : employees.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center"><UsersRound className="size-8 text-zinc-300 dark:text-zinc-600" /><p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">No employees found</p><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Try a different name, department, or status.</p></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{employees.map((emp) => <article key={emp.id || emp._id} className="card relative flex min-h-20 items-center gap-3 p-4 transition-colors hover:border-blue-300 dark:hover:border-blue-800">
          <button type="button" onClick={() => navigate(`/employees/${emp.id || emp._id}`)} className="absolute inset-0 z-0 rounded-[inherit] focus-visible:outline-2 focus-visible:outline-blue-500" aria-label={`View details for ${emp.firstName} ${emp.lastName}`} />
          <div className="pointer-events-none relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">{emp.firstName?.[0]}{emp.lastName?.[0]}</div>
          <div className="pointer-events-none relative z-10 min-w-0 flex-1"><h2 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{emp.firstName} {emp.lastName}</h2><p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">Click to view details</p></div>
          {emp.isDeleted && <span className="relative z-10 badge badge-danger">Archived</span>}
        </article>)}</div>
      )}

      {!loading && <Pagination page={page} totalPages={totalPages} totalItems={totalEmployees} pageSize={12} onPageChange={setPage} />}

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

    </div>
  )
}

export default Employees
