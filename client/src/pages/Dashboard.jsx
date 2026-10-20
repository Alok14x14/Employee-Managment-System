import { useEffect, useState } from "react"
import EmployeeDashboard from "../components/EmployeeDashboard"
import AdminDashboard from "../components/AdminDashboard"
import { useAuth } from "../context/AuthContext"
import api from "../api/axios"
import toast from "react-hot-toast"

const Dashboard = () => {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard')
      .then(async (res) => {
        if (res.data.role !== 'ADMIN') {
          setData(res.data)
          return
        }
        const [leaveResult, correctionResult] = await Promise.allSettled([
          api.get('/leave'),
          api.get('/attendance/corrections?status=PENDING'),
        ])
        const leaveRequests = leaveResult.status === 'fulfilled'
          ? (leaveResult.value.data.data || []).filter((leave) => leave.status === 'PENDING')
          : []
        const correctionRequests = correctionResult.status === 'fulfilled'
          ? (correctionResult.value.data.data || [])
          : []
        const reviewErrors = [leaveResult, correctionResult].filter((result) => result.status === 'rejected')
        setData({ ...res.data, leaveRequests, correctionRequests, reviewErrors })
      })
      .catch((err) => toast.error(err.response?.data?.error || err?.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              {user?.role === "ADMIN"
                ? "Organization workforce metrics, shift attendance, and department distribution."
                : "Personal attendance tracking, leave status, and payroll summary."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-32 rounded skeleton" />
          </div>
        </div>

        {/* 4 Stat Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="card p-4">
              <div className="h-3 w-20 skeleton mb-2" />
              <div className="h-7 w-16 skeleton mb-2" />
              <div className="h-2.5 w-28 skeleton" />
            </div>
          ))}
        </div>

        {/* Charts Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-4 sm:p-5 lg:col-span-2">
            <div className="mb-4">
              <div className="h-4 w-32 skeleton mb-1.5" />
              <div className="h-3 w-48 skeleton" />
            </div>
            <div className="h-[250px] w-full rounded skeleton" />
          </div>
          <div className="card p-4 sm:p-5">
            <div className="mb-4">
              <div className="h-4 w-28 skeleton mb-1.5" />
              <div className="h-3 w-40 skeleton" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-10 w-full rounded skeleton" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return <p className="text-center text-slate-500 py-12">Failed to load dashboard</p>

  if (data.role === "ADMIN") {
    return <AdminDashboard data={data} />
  } else {
    return <EmployeeDashboard data={data} />
  }
}

export default Dashboard
