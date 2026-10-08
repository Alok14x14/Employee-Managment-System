import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDepartments } from '../constants/departments'
import { Loader2Icon } from 'lucide-react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const EmployeeForm = ({ initialData, onSuccess, onCancel }) => {
  const navigate = useNavigate()
  const departments = useDepartments()
  const [loading, setLoading] = useState(false)
  const isEditMode = Boolean(initialData)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    if (isEditMode) {
      const pwd = formData.get('password')
      if (!pwd) formData.delete('password')
    }

    try {
      const url = isEditMode ? `/employees/${initialData.id || initialData._id}` : '/employees'
      const method = isEditMode ? 'put' : 'post'
      await api[method](url, formData)
      toast.success(isEditMode ? 'Employee updated' : 'Employee created')
      if (onSuccess) onSuccess()
      else navigate('/employees')
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div>
        <h3 className="text-xs font-semibold text-[#18181B] uppercase tracking-wider pb-2 border-b border-[#E4E4E7]">
          Personal details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3 text-xs">
          <div>
            <label className="block font-medium text-[#18181B] mb-1">First name</label>
            <input name="firstName" required defaultValue={initialData?.firstName} placeholder="First name" />
          </div>
          <div>
            <label className="block font-medium text-[#18181B] mb-1">Last name</label>
            <input name="lastName" required defaultValue={initialData?.lastName} placeholder="Last name" />
          </div>
          <div>
            <label className="block font-medium text-[#18181B] mb-1">Phone number</label>
            <input name="phone" required defaultValue={initialData?.phone} placeholder="+1 555-0100" />
          </div>
          <div>
            <label className="block font-medium text-[#18181B] mb-1">Join date</label>
            <input
              type="date"
              name="joinDate"
              required
              defaultValue={
                initialData?.joinDate
                  ? new Date(initialData.joinDate).toISOString().split('T')[0]
                  : new Date().toISOString().split('T')[0]
              }
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-medium text-[#18181B] mb-1">Bio (optional)</label>
            <textarea
              name="bio"
              defaultValue={initialData?.bio}
              rows={2}
              className="resize-none"
              placeholder="Brief professional background..."
            />
          </div>
        </div>
      </div>

      {/* Employment Details */}
      <div>
        <h3 className="text-xs font-semibold text-[#18181B] uppercase tracking-wider pb-2 border-b border-[#E4E4E7]">
          Employment & compensation
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3 text-xs">
          <div>
            <label className="block font-medium text-[#18181B] mb-1">Department</label>
            <select name="department" required defaultValue={initialData?.department || ''}>
              <option value="">Select department</option>
              {departments.map((deptName) => (
                <option key={deptName} value={deptName}>
                  {deptName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium text-[#18181B] mb-1">Position title</label>
            <input name="position" required defaultValue={initialData?.position} placeholder="e.g. Software Engineer" />
          </div>
          <div>
            <label className="block font-medium text-[#18181B] mb-1">Basic salary</label>
            <input
              type="number"
              name="basicSalary"
              required
              min="0"
              step="0.01"
              defaultValue={initialData?.basicSalary ?? 0}
            />
          </div>
          <div>
            <label className="block font-medium text-[#18181B] mb-1">Allowances</label>
            <input
              type="number"
              name="allowances"
              min="0"
              step="0.01"
              required
              defaultValue={initialData?.allowances ?? 0}
            />
          </div>
          <div>
            <label className="block font-medium text-[#18181B] mb-1">Deductions</label>
            <input
              type="number"
              name="deductions"
              min="0"
              step="0.01"
              required
              defaultValue={initialData?.deductions ?? 0}
            />
          </div>
          {isEditMode && (
            <div>
              <label className="block font-medium text-[#18181B] mb-1">Status</label>
              <select name="employmentStatus" defaultValue={initialData?.employmentStatus || 'ACTIVE'}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Account Setup */}
      <div>
        <h3 className="text-xs font-semibold text-[#18181B] uppercase tracking-wider pb-2 border-b border-[#E4E4E7]">
          Authentication & role
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3 text-xs">
          <div className="sm:col-span-2">
            <label className="block font-medium text-[#18181B] mb-1">Work email</label>
            <input
              type="email"
              name="email"
              required
              defaultValue={initialData?.email}
              placeholder="name@company.com"
            />
          </div>
          {!isEditMode && (
            <div>
              <label className="block font-medium text-[#18181B] mb-1">Initial password</label>
              <input type="password" name="password" required placeholder="••••••••" minLength={8} />
            </div>
          )}
          {isEditMode && (
            <div>
              <label className="block font-medium text-[#18181B] mb-1">Change password (optional)</label>
              <input type="password" name="password" placeholder="Leave blank to keep" minLength={8} />
            </div>
          )}
          <div>
            <label className="block font-medium text-[#18181B] mb-1">Role</label>
            <select name="role" defaultValue={initialData?.user?.role || 'EMPLOYEE'}>
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E4E4E7]">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => (onCancel ? onCancel() : navigate(-1))}
        >
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <Loader2Icon className="size-3.5 mr-1.5 animate-spin" />}
          {isEditMode ? 'Save changes' : 'Create employee'}
        </button>
      </div>
    </form>
  )
}

export default EmployeeForm