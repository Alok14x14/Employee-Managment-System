import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { BotIcon } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";
import HrAssistant from "./HrAssistant";

const Layout = () => {
  const { user, loading } = useAuth();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [showHelpLabel, setShowHelpLabel] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowHelpLabel(false), 5000);
    return () => window.clearTimeout(timer);
  }, []);

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" />;
  if (user.mustChangePassword) return <Navigate to="/change-password-required" replace />;

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col lg:flex-row text-zinc-900 dark:text-zinc-100">
      <Sidebar />
      {user.role === "EMPLOYEE" && (
        <>
          <section
            role="dialog"
            aria-label="HR assistant"
            aria-hidden={!assistantOpen}
            className={`${assistantOpen ? "fixed" : "hidden"} bottom-[88px] right-5 z-40 h-[80vh] max-h-[calc(100vh-7rem)] w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border-2 border-blue-500/70 bg-white shadow-[0_0_28px_rgba(37,99,235,0.22)] dark:border-blue-400/70 dark:bg-zinc-900 dark:shadow-[0_0_30px_rgba(59,130,246,0.2)] sm:w-[40vw] sm:min-w-[360px] sm:max-w-[600px]`}
          >
            <HrAssistant onClose={() => setAssistantOpen(false)} />
          </section>
          <button
            type="button"
            className="group fixed bottom-5 right-5 z-50 inline-flex items-center gap-2.5 focus-visible:outline-none"
            aria-label={assistantOpen ? "Close HR assistant" : "Open HR assistant"}
            aria-expanded={assistantOpen}
            onClick={() => setAssistantOpen((open) => !open)}
            onMouseEnter={() => setShowHelpLabel(true)}
            onMouseLeave={() => setShowHelpLabel(false)}
            onFocus={() => setShowHelpLabel(true)}
            onBlur={() => setShowHelpLabel(false)}
          >
            <span aria-hidden="true" className={`rounded-full border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-lg transition-all duration-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 ${!assistantOpen && showHelpLabel ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-2 opacity-0'}`}>
              Need help?
            </span>
            <span className="inline-flex size-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-950/25 transition-transform group-hover:scale-105 group-hover:bg-blue-700 group-focus-visible:ring-2 group-focus-visible:ring-blue-500 group-focus-visible:ring-offset-2 dark:group-focus-visible:ring-offset-[#0A0A0B]">
              <BotIcon className="size-6" aria-hidden="true" />
            </span>
          </button>
        </>
      )}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
