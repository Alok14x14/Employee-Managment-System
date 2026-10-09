import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";

const Layout = () => {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0B] flex flex-col lg:flex-row text-zinc-900 dark:text-zinc-100">
      <Sidebar />
      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;