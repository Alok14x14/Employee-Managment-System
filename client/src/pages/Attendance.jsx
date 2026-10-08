import { useCallback, useEffect, useState } from "react";
import Loading from "../components/Loading";
import CheckInButton from "../components/attendance/CheckInButton";
import AttendanceStats from "../components/attendance/AttendanceStats";
import AttendanceHistory from "../components/attendance/AttendanceHistory";
import AttendanceCalendar from "../components/attendance/AttendanceCalendar";
import api from "../api/axios";
import { toast } from "react-hot-toast";
import { Calendar, List } from "lucide-react";

import { format } from "date-fns";

const Attendance = () => {
  const [history, setHistory] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [isDeleted, setIsDeleted] = useState(false);
  const [viewMode, setViewMode] = useState("calendar"); // "calendar" | "table"

  const fetchData = useCallback(async (monthDate = currentMonth, mode = viewMode) => {
    try {
      const queryParam = mode === "calendar"
        ? `?month=${format(monthDate, "yyyy-MM")}`
        : "?limit=50";
      const res = await api.get(`/attendance${queryParam}`);
      const json = res.data;
      setHistory(json.data || []);
      if (json.todayRecord !== undefined) {
        setTodayRecord(json.todayRecord);
      }
      if (json.employee?.isDeleted) setIsDeleted(true);
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, viewMode]);

  useEffect(() => {
    fetchData(currentMonth, viewMode);
  }, [currentMonth, viewMode, fetchData]);

  if (loading && history.length === 0) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">Attendance</h1>
          <p className="text-sm text-zinc-500 mt-1">Track daily shifts, check-in timestamps, and attendance records.</p>
        </div>
      </div>

      {isDeleted ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-[6px] text-center">
          <p className="text-xs text-rose-700">
            Attendance logging is disabled because this employee record has been marked as inactive.
          </p>
        </div>
      ) : (
        <div>
          <CheckInButton todayRecord={todayRecord} onAction={fetchData} />
        </div>
      )}

      <AttendanceStats history={history} />

      {/* View Switcher Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex p-0.5 bg-zinc-100 rounded-[6px] border border-zinc-200">
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-medium transition-colors ${
              viewMode === "calendar"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>Monthly Calendar</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-medium transition-colors ${
              viewMode === "table"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <List className="w-3.5 h-3.5 text-zinc-500" />
            <span>Attendance Log</span>
          </button>
        </div>
      </div>

      {/* Dynamic View Rendering */}
      {viewMode === "calendar" ? (
        <AttendanceCalendar
          history={history}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />
      ) : (
        <AttendanceHistory history={history} />
      )}
    </div>
  );
};

export default Attendance;