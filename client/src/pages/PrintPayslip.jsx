import React, { useEffect, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import Loading from '../components/Loading';
import { format } from 'date-fns';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Printer } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

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
  const [loading, setLoading] = useState(() => Boolean(id && id !== 'undefined'));

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!id || id === 'undefined') return;
    let ignore = false;
    api.get(`/payslips/${id}`)
      .then((res) => {
        if (!ignore) setPayslip(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch payslip:", err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
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
  if (!payslip) return <p className="text-center py-12 text-zinc-400">Payslip not found</p>;

  const emp = payslip.employee || {};
  const payPeriod = format(new Date(payslip.year, payslip.month - 1), 'MMMM yyyy');
  const basicSalary = payslip.basicSalary || 0;
  const allowances = payslip.allowances || 0;
  const grossEarnings = basicSalary + allowances;
  const totalDeductions = payslip.deductions || 0;
  const netPayable = payslip.netSalary ?? (grossEarnings - totalDeductions);
  const payslipRef = `SF-PAY-${payslip.year}${String(payslip.month).padStart(2, '0')}-${(payslip._id || payslip.id || '').slice(-6).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8 px-4 print:p-0 print:bg-white text-zinc-900 font-sans">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          html, body {
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-card {
            box-shadow: none !important;
            border: 1px solid #e4e4e7 !important;
            margin: 0 !important;
            padding: 24px !important;
            max-width: 100% !important;
            width: 100% !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Action Bar */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary text-xs inline-flex items-center gap-1.5 h-8 px-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          onClick={() => window.print()}
          className="btn-primary text-xs inline-flex items-center gap-1.5 h-8 px-3.5"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Main Document */}
      <div className="print-card max-w-3xl mx-auto bg-white rounded-[6px] border border-zinc-200 p-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-zinc-200">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">StaffFlow Inc.</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Salary Statement</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono text-zinc-700">Ref: {payslipRef}</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Period: {payPeriod}
            </p>
            <p className="text-xs text-zinc-500 font-mono">
              Issue Date: {payslip.createdAt ? format(new Date(payslip.createdAt), 'dd MMM yyyy') : format(new Date(), 'dd MMM yyyy')}
            </p>
          </div>
        </div>

        {/* Employee Particulars */}
        <div className="my-6 border border-zinc-200 rounded-[6px] p-4 bg-zinc-50/50">
          <div className="grid grid-cols-2 gap-y-2.5 text-xs">
            <div className="flex">
              <span className="w-28 text-zinc-500">Employee Name:</span>
              <span className="font-semibold text-zinc-900">{emp.firstName} {emp.lastName}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-zinc-500">Employee ID:</span>
              <span className="font-mono text-zinc-800">
                {emp._id ? emp._id.slice(-6).toUpperCase() : 'EMP-001'}
              </span>
            </div>
            <div className="flex">
              <span className="w-28 text-zinc-500">Position:</span>
              <span className="text-zinc-800">{emp.position || '—'}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-zinc-500">Department:</span>
              <span className="text-zinc-800">{emp.department || '—'}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-zinc-500">Email:</span>
              <span className="font-mono text-zinc-700">{emp.email || '—'}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-zinc-500">Date of Joining:</span>
              <span className="text-zinc-800">
                {emp.joinDate ? format(new Date(emp.joinDate), 'dd MMM yyyy') : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Earnings & Deductions Table */}
        <div className="border border-zinc-200 rounded-[6px] overflow-hidden mb-6 text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th className="px-4 py-2.5 font-medium text-zinc-600 uppercase tracking-wider text-[11px] w-1/2">
                  Earnings
                </th>
                <th className="px-4 py-2.5 font-medium text-zinc-600 uppercase tracking-wider text-[11px] text-right">
                  Amount
                </th>
                <th className="px-4 py-2.5 font-medium text-zinc-600 uppercase tracking-wider text-[11px] w-1/2 border-l border-zinc-200">
                  Deductions
                </th>
                <th className="px-4 py-2.5 font-medium text-zinc-600 uppercase tracking-wider text-[11px] text-right">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              <tr>
                <td className="px-4 py-2.5 text-zinc-700">Basic Salary</td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums text-zinc-900">
                  {formatCurrency(basicSalary)}
                </td>
                <td className="px-4 py-2.5 text-zinc-700 border-l border-zinc-200">Standard Deductions</td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums text-zinc-900">
                  {formatCurrency(totalDeductions)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-zinc-700">Allowances</td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums text-zinc-900">
                  {formatCurrency(allowances)}
                </td>
                <td className="px-4 py-2.5 text-zinc-400 border-l border-zinc-200">—</td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums text-zinc-400">—</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-200 bg-zinc-50 font-medium">
                <td className="px-4 py-2.5 text-zinc-800">Total Earnings</td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums text-zinc-900">
                  {formatCurrency(grossEarnings)}
                </td>
                <td className="px-4 py-2.5 text-zinc-800 border-l border-zinc-200">Total Deductions</td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums text-zinc-900">
                  {formatCurrency(totalDeductions)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Net Salary Payable */}
        <div className="border border-zinc-200 rounded-[6px] p-4 bg-zinc-50 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-xs uppercase font-medium text-zinc-500 tracking-wider">Net Payable</span>
            <p className="text-xs text-zinc-600 mt-1 italic">
              {numberToWordsINR(netPayable)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold font-mono tabular-nums text-zinc-900">
              {formatCurrency(netPayable)}
            </span>
          </div>
        </div>

        {/* Signatory line */}
        <div className="pt-8 mt-8 border-t border-zinc-200 flex justify-between items-end text-xs text-zinc-500">
          <p>This is a computer-generated document.</p>
          <div className="text-right">
            <div className="w-48 border-b border-zinc-300 mb-1.5" />
            <p className="text-zinc-600 font-medium">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPayslip;