import { Toaster } from "react-hot-toast"
import { Navigate, Route, Routes } from "react-router-dom"
import LoginLanding from "./pages/LoginLanding"
import Layout from "./pages/Layout"
import Dashboard from "./pages/Dashboard"
import Employees from "./pages/Employees"
import Departments from "./pages/Departments"
import Attendance from "./pages/Attendance"
import Leave from "./pages/Leave"
import Payslips from "./pages/Payslips"
import Settings from "./pages/Settings"
import PrintPayslip from "./pages/PrintPayslip"
import LoginForm from "./components/LoginForm"

const App = () => {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#FFFFFF",
            color: "#18181B",
            border: "1px solid #E4E4E7",
            borderRadius: "6px",
            fontSize: "13px",
            padding: "10px 14px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginLanding />} />
        <Route path="/login/admin" element={<LoginForm role="admin" />} />
        <Route path="/login/employee" element={<LoginForm role="employee" />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leave" element={<Leave />} />
          <Route path="/payslips" element={<Payslips />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/print/payslips/:id" element={<PrintPayslip />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}

export default App