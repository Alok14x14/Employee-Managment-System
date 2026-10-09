import { useCallback, useEffect, useState } from "react"
import Loading from "../components/Loading";
import PayslipList from "../components/payslip/PayslipList";
import GeneratePayslipForm from "../components/payslip/GeneratePayslipForm";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

const Payslips = () => {
  const [payslips, setPayslips] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true);

  const {user} = useAuth()
  const isAdmin = user?.role === "ADMIN";

  const fetchPayslips = useCallback(async ()=>{
    try {
      const res = await api.get('/payslips')
      setPayslips(res.data.data || [])
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message);
    }finally{
      setLoading(false)
    }
  },[])

  useEffect(()=>{
    fetchPayslips()
  },[fetchPayslips])

  useEffect(()=>{
    if(isAdmin) api.get("/employees").then((res)=> setEmployees(res.data.filter((e)=> !e.isDeleted))).catch(()=>{})
  },[isAdmin])

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">Payslips</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {isAdmin ? "Generate, review, and issue employee compensation records." : "Review and download issued payroll records."}
          </p>
        </div>
        {isAdmin && <GeneratePayslipForm employees={employees} onSuccess={fetchPayslips} />}
      </div>
      <PayslipList payslips={payslips} isAdmin={isAdmin} />
    </div>
  );
};

export default Payslips;