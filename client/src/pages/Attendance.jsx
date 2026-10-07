import { useCallback, useEffect, useState } from "react";
import Loading from "../components/Loading";
import CheckInButton from "../components/attendance/CheckInButton";
import AttendanceStats from "../components/attendance/AttendanceStats";
import AttendanceHistory from "../components/attendance/AttendanceHistory";
import AttendanceCalendar from "../components/attendance/AttendanceCalendar";
import api from "../api/axios";
import { toast } from "react-hot-toast";
import { Calendar, List } from "lucide-react";

const Attendance = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleted, setIsDeleted] = useState(false);
  const [viewMode, setViewMode] = useState("calendar"); // "calendar" | "table"

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get("/attendance");
      const json = res.data;
      setHistory(json.data || []);
      if (json.employee?.isDeleted) setIsDeleted(true);
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <Loading />;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayRecord = history.find(
    (r) => new Date(r.date).toDateString() === today.toDateString()
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">Track your work hours and daily check-ins</p>
      </div>

      {isDeleted ? (
        <div className="mb-8 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <p className="text-rose-600">
            You can no longer clock in or out because your employee records have been marked as deleted.
          </p>
        </div>
      ) : (
        <div className="mb-8">
          <CheckInButton todayRecord={todayRecord} onAction={fetchData} />
        </div>
      )}

      <AttendanceStats history={history} />

      {/* View Switcher Controls */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 shadow-2xs">
          <button
            onClick={() => setViewMode("calendar")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "calendar"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-4 h-4" /> Monthly Calendar Heatmap
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "table"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <List className="w-4 h-4" /> Log History Table
          </button>
        </div>
      </div>

      {/* Dynamic View Rendering */}
      {viewMode === "calendar" ? (
        <AttendanceCalendar history={history} />
      ) : (
        <AttendanceHistory history={history} />
      )}
    </div>
  );
};

export default Attendance;