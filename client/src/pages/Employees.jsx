import { useCallback, useEffect, useState } from "react"
import { DEPARTMENTS } from "../assets/assets"
import { Plus, Search, X, PencilIcon, Trash2Icon } from "lucide-react"
import EmployeeForm from "../components/EmployeeForm"
import api from "../api/axios"
import toast from "react-hot-toast"



const Employees = () => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("")
  const [statusFilter, setStatusFilter] = useState("active")
  const [editEmployee, setEditEmployee] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null })


  const fetchEmployees = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDept) params.append("department", selectedDept);
      if (statusFilter === "deleted") params.append("status", "deleted");

      const res = await api.get(`/employees?${params.toString()}`)
      setEmployees(res.data)
    } catch (error) {
      console.error("Failed to fetch employees");
    } finally {
      setLoading(false)
    }
  }, [selectedDept, statusFilter])

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees])

  const filtered = employees.filter((emp) => `${emp.firstName} ${emp.lastName} ${emp.position}`.toLowerCase().includes(search.toLowerCase()))

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await api.delete(`/employees/${deleteModal.id}`)
      fetchEmployees()
      setDeleteModal({ open: false, id: null })
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    }
  }

  return (
    <div className="animate-fade-in">
      {/* ----- header ------ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Manage your team members</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
          <Plus size={16} /> Add Employee
        </button>
      </div>
      {/* ----- search bar --------- */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input placeholder="Search employees..." className="w-full pl-10!" onChange={(e) => setSearch(e.target.value)} value={search} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-48">
          <option value="active">Active Employees</option>
          <option value="deleted">Deleted Employees</option>
        </select>
        <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="max-w-40">
          <option value="">All Departments</option>
          {DEPARTMENTS.map((deptName) => (
            <option key={deptName} value={deptName}>{deptName}</option>
          ))}
        </select>
      </div>

      {/* -------- employee cards ---------- */}

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Attendance</th>
                  <th className="text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-16 text-slate-400">
                      No employees found
                    </td>
                  </tr>
                ) : (
                  filtered.map((emp) => (
                    <tr key={emp.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                            <span className="font-medium text-indigo-600">
                              {emp.firstName[0]}{emp.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{emp.firstName} {emp.lastName}</p>
                            <p className="text-xs text-slate-500">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-slate-100 text-slate-600">{emp.department || "Remote"}</span>
                      </td>
                      <td className="text-slate-500">{emp.position}</td>
                      <td>
                        {emp.isPresentToday ? (
                          <span className="badge bg-emerald-50 text-emerald-600 border border-emerald-100">Present</span>
                        ) : (
                          <span className="badge bg-rose-50 text-rose-600 border border-rose-100">Absent</span>
                        )}
                      </td>
                      <td className="text-right pr-4">
                        {!emp.isDeleted && (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditEmployee(emp)} className="p-1.5 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteModal({ open: true, id: emp.id })} className="p-1.5 bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                              <Trash2Icon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Employee Modal */}
      {showCreateModal && (
        <div className="fixed bg-black/40 backdrop-blur-sm inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowCreateModal(false)}>

          <div className="fixed inset-0" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 pb-0">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Add New Employee</h2>
                <p className="text-sm text-slate-500 mt-0.5">Create a user account and employee profile</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <EmployeeForm
                onSuccess={() => {
                  setShowCreateModal(false);
                  fetchEmployees();
                }} onCancel={() => setShowCreateModal(false)} />
            </div>
          </div>

        </div>
      )}

      {/* Edit Employee Modal */}
      {editEmployee && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/40 backdrop-blur-sm" onClick={() => setEditEmployee(null)}>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 pb-0">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Edit Employee</h2>
                <p className="text-sm text-slate-500 mt-0.5">Update employee details</p>
              </div>
              <button onClick={() => setEditEmployee(null)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <EmployeeForm initialData={editEmployee}
                onSuccess={() => {
                  setEditEmployee(null);
                  fetchEmployees();
                }} onCancel={() => setEditEmployee(null)} />
            </div>
          </div>

        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed bg-black/40 backdrop-blur-sm inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteModal({ open: false, id: null })}>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 pb-0">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Delete Employee</h2>
                <p className="text-sm text-slate-500 mt-0.5">This action cannot be undone.</p>
              </div>
              <button onClick={() => setDeleteModal({ open: false, id: null })} className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-6 text-sm">Are you sure you want to delete this employee account? They will lose access to the portal immediately.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal({ open: false, id: null })} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button onClick={handleDelete} className="btn-primary flex-1 flex justify-center from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 shadow-rose-500/25">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Employees