import { Toaster } from "react-hot-toast"
import { Navigate, Route, Routes, Outlet } from "react-router-dom"
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
import RequireRole from "./components/RequireRole"
import { useAuth } from "./context/AuthContext"
import { useTheme } from "./context/ThemeContext"

const RedirectIfAuth = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return children || <Outlet />
}

const App = () => {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: isDark ? "#18181B" : "#FFFFFF",
            color: isDark ? "#FAFAFA" : "#18181B",
            border: isDark ? "1px solid #27272A" : "1px solid #E4E4E7",
            borderRadius: "6px",
            fontSize: "13px",
            padding: "10px 14px",
            boxShadow: isDark ? "0 4px 12px rgba(0, 0, 0, 0.4)" : "0 4px 12px rgba(0, 0, 0, 0.05)",
          },
          success: {
            iconTheme: {
              primary: "#16A34A",
              secondary: isDark ? "#18181B" : "#FFFFFF",
            },
          },
          error: {
            iconTheme: {
              primary: "#DC2626",
              secondary: isDark ? "#18181B" : "#FFFFFF",
            },
          },
        }}
      />
      <Routes>
        <Route
          path="/login"
          element={
            <RedirectIfAuth>
              <LoginLanding />
            </RedirectIfAuth>
          }
        />
        <Route
          path="/login/admin"
          element={
            <RedirectIfAuth>
              <LoginForm role="admin" />
            </RedirectIfAuth>
          }
        />
        <Route
          path="/login/employee"
          element={
            <RedirectIfAuth>
              <LoginForm role="employee" />
            </RedirectIfAuth>
          }
        />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/employees"
            element={
              <RequireRole role="ADMIN">
                <Employees />
              </RequireRole>
            }
          />
          <Route
            path="/departments"
            element={
              <RequireRole role="ADMIN">
                <Departments />
              </RequireRole>
            }
          />
          <Route
            path="/attendance"
            element={
              <RequireRole role="EMPLOYEE">
                <Attendance />
              </RequireRole>
            }
          />
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