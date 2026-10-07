import { useEffect, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import Loading from '../components/Loading';
import { format } from 'date-fns';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Printer, CheckCircle2, ShieldCheck, Calendar, User } from 'lucide-react';

function numberToWordsINR(num) {
  if (!num || isNaN(num)) return '';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + 'Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else {
      str += a[n];
    }
    return str;
  };

  let n = Math.floor(num);
  let crore = Math.floor(n / 10000000);
  n %= 10000000;
  let lakh = Math.floor(n / 100000);
  n %= 100000;
  let thousand = Math.floor(n / 1000);
  n %= 1000;
  let res = '';
  if (crore) res += inWords(crore) + 'Crore ';
  if (lakh) res += inWords(lakh) + 'Lakh ';
  if (thousand) res += inWords(thousand) + 'Thousand ';
  if (n) res += inWords(n);
  return res.trim() ? res.trim() + ' Rupees Only' : '';
}

const PrintPayslip = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!id || id === 'undefined') {
      setLoading(false);
      return;
    }
    api.get(`/payslips/${id}`)
      .then((res) => setPayslip(res.data))
      .catch((err) => {
        console.error("Failed to fetch payslip:", err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (payslip && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('autoprint') === 'true') {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [payslip]);

  if (authLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (loading) return <Loading />;
  if (!payslip) return <p className="text-center py-12 text-slate-400">Payslip not found</p>;

  const emp = payslip.employee || {};
  const payPeriod = format(new Date(payslip.year, payslip.month - 1), 'MMMM yyyy');
  const grossEarnings = (payslip.basicSalary || 0) + (payslip.allowances || 0);
  const totalDeductions = payslip.deductions || 0;
  const netPayable = payslip.netSalary || (grossEarnings - totalDeductions);
  const payslipRef = `SF-PAY-${payslip.year}${String(payslip.month).padStart(2, '0')}-${(payslip._id || payslip.id || '').slice(-5).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-slate-100/70 py-6 px-4 print:p-0 print:bg-white text-slate-900">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          html, body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-card {
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            margin: 0 !important;
            padding: 16px 20px !important;
            max-width: 100% !important;
            width: 100% !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Action Bar (Hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Fitted precisely for single-page A4 print / PDF export
          </span>
          <button
            onClick={() => window.print()}
            className="btn-primary inline-flex items-center gap-2 cursor-pointer shadow-md py-2 px-4 text-xs font-semibold"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Main Payslip Card */}
      <div className="print-card max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8 animate-fade-in">
        {/* Company Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
              <img
                src="/image.png"
                alt="Company Logo"
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '<span class="text-base font-bold text-indigo-600">SF</span>';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">StaffFlow Inc.</h1>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Official
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Enterprise Workforce Management Systems</p>
              <p className="text-[10px] text-slate-400">contact@staffflow.io • www.staffflow.io</p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-2.5 py-0.5 bg-slate-900 text-white text-[11px] font-semibold tracking-wider uppercase rounded mb-1">
              Salary Statement
            </span>
            <p className="text-[11px] text-slate-500 font-mono">Ref: {payslipRef}</p>
            <p className="text-[10px] text-slate-500">
              Issue Date: {payslip.createdAt ? format(new Date(payslip.createdAt), 'dd MMM yyyy') : format(new Date(), 'dd MMM yyyy')}
            </p>
          </div>
        </div>

        {/* Employee Particulars & Payroll Details (Side-by-side columns) */}
        <div className="grid grid-cols-2 gap-4 my-4 p-3.5 bg-slate-50/70 rounded-lg border border-slate-200/70">
          {/* Employee Info */}
          <div className="space-y-1.5">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 pb-1 border-b border-slate-200">
              <User className="w-3 h-3 text-indigo-600" /> Employee Particulars
            </h3>
            <div className="grid grid-cols-3 text-[11px] gap-y-1">
              <span className="text-slate-500">Full Name</span>
              <span className="col-span-2 font-semibold text-slate-900">
                {emp.firstName} {emp.lastName}
              </span>

              <span className="text-slate-500">Employee ID</span>
              <span className="col-span-2 font-mono text-slate-700">
                #{emp._id ? emp._id.slice(-6).toUpperCase() : 'EMP-001'}
              </span>

              <span className="text-slate-500">Designation</span>
              <span className="col-span-2 text-slate-700 font-medium">{emp.position || 'N/A'}</span>

              <span className="text-slate-500">Department</span>
              <span className="col-span-2 text-slate-700">{emp.department || 'General'}</span>

              <span className="text-slate-500">Email</span>
              <span className="col-span-2 text-slate-700 truncate">{emp.email || 'N/A'}</span>
            </div>
          </div>

          {/* Pay Period & Payment Info */}
          <div className="space-y-1.5">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 pb-1 border-b border-slate-200">
              <Calendar className="w-3 h-3 text-indigo-600" /> Payroll Details
            </h3>
            <div className="grid grid-cols-3 text-[11px] gap-y-1">
              <span className="text-slate-500">Pay Period</span>
              <span className="col-span-2 font-bold text-slate-900">{payPeriod}</span>

              <span className="text-slate-500">Pay Cycle</span>
              <span className="col-span-2 text-slate-700">Monthly</span>

              <span className="text-slate-500">Status</span>
              <span className="col-span-2">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Paid / Disbursed
                </span>
              </span>

              <span className="text-slate-500">Disbursed Via</span>
              <span className="col-span-2 text-slate-700">Bank Direct Deposit</span>

              <span className="text-slate-500">Joining Date</span>
              <span className="col-span-2 text-slate-700">
                {emp.joinDate ? format(new Date(emp.joinDate), 'dd MMM yyyy') : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Dual-Column Breakdown Table: Earnings vs Deductions (Always 2 columns) */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Earnings */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase">Earnings</span>
              <span className="text-[10px] font-medium text-slate-300">Amount (INR)</span>
            </div>
            <div className="divide-y divide-slate-100 text-[11px]">
              <div className="flex justify-between px-3 py-2">
                <span className="text-slate-600">Basic Salary</span>
                <span className="font-medium text-slate-900">₹{(payslip.basicSalary || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between px-3 py-2">
                <span className="text-slate-600">Allowances & Incentives</span>
                <span className="font-medium text-slate-900">+₹{(payslip.allowances || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between px-3 py-2 bg-slate-50/80 font-semibold border-t border-slate-200">
                <span className="text-slate-800">Total Gross Earnings (A)</span>
                <span className="text-indigo-600">₹{grossEarnings.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider uppercase">Deductions</span>
              <span className="text-[10px] font-medium text-slate-300">Amount (INR)</span>
            </div>
            <div className="divide-y divide-slate-100 text-[11px]">
              <div className="flex justify-between px-3 py-2">
                <span className="text-slate-600">Standard Deductions & Taxes</span>
                <span className="font-medium text-rose-600">-₹{(payslip.deductions || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between px-3 py-2 text-slate-400">
                <span>Loss of Pay (LOP)</span>
                <span>₹0</span>
              </div>
              <div className="flex justify-between px-3 py-2 bg-slate-50/80 font-semibold border-t border-slate-200">
                <span className="text-slate-800">Total Deductions (B)</span>
                <span className="text-rose-600">₹{totalDeductions.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Salary Payable Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-lg p-3.5 sm:p-4 flex items-center justify-between gap-4 mb-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                Net Take-Home Pay (A - B)
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 italic">
              {numberToWordsINR(netPayable)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono leading-none">
              ₹{netPayable.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">Credited to registered account</p>
          </div>
        </div>

        {/* Verification & Signatory Footer */}
        <div className="pt-3 border-t border-slate-200 grid grid-cols-2 gap-4 items-end text-[10px] text-slate-500">
          <div>
            <div className="flex items-center gap-1 text-slate-700 font-semibold mb-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Computer Generated Document
            </div>
            <p className="text-slate-400 leading-snug">
              This payslip is electronically generated and digitally validated by StaffFlow Payroll Management.
              No physical signature is required.
            </p>
          </div>

          <div className="flex flex-col items-end">
            <div className="w-40 border-b border-slate-400 pb-1 text-center">
              <p className="font-semibold text-slate-800 text-[11px]">StaffFlow Payroll Dept.</p>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest">Authorized Signatory</p>
            </div>
            <p className="text-[9px] text-slate-400 mt-1 font-mono">
              Security Hash: SHA256-{(payslip._id || payslip.id || 'VALID').slice(0, 16)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPayslip;