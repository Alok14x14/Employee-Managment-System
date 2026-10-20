import AdminCorrectionRequests from '../components/attendance/AdminCorrectionRequests'

const AdminAttendanceCorrections = () => (
  <div className="space-y-6">
    <div className="page-header">
      <div>
        <h1 className="page-title">Attendance corrections</h1>
        <p className="page-subtitle">Review employee requests to add missed check-in or check-out times.</p>
      </div>
    </div>
    <AdminCorrectionRequests />
  </div>
)

export default AdminAttendanceCorrections
