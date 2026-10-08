import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RequireRole = ({ role, children }) => {
  const { user } = useAuth();

  if (user?.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};

export default RequireRole;
