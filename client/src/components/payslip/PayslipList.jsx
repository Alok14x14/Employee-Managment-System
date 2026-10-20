import { Download } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatCurrency, formatISTDate } from '../../utils/formatters';
import Pagination from '../Pagination';

const PayslipList = ({ payslips, isAdmin, loading = false, page = 1, total = payslips.length, totalPages = 1, onPageChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div className="bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-[6px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
              {isAdmin && (
                <th className="px-3.5 py-2.5 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[11px]">
                  Employee
                </th>
              )}
              <th className="px-3.5 py-2.5 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[11px]">
                Period
              </th>
              <th className="px-3.5 py-2.5 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[11px]">
                Issued
              </th>
              <th className="px-3.5 py-2.5 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[11px] text-right">
                Basic Salary
              </th>
              <th className="px-3.5 py-2.5 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[11px] text-right">
                Net Salary
              </th>
              <th className="px-3.5 py-2.5 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[11px]">
                Status
              </th>
              <th className="px-3.5 py-2.5 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[11px] text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {loading ? (
              Array.from({ length: 10 }).map((_, idx) => (
                <tr key={idx}>
                  {isAdmin && (
                    <td className="px-3.5 py-2.5">
                      <div className="h-3.5 w-32 skeleton" />
                    </td>
                  )}
                  <td className="px-3.5 py-2.5"><div className="h-3.5 w-24 skeleton" /></td>
                  <td className="px-3.5 py-2.5"><div className="h-3.5 w-24 skeleton" /></td>
                  <td className="px-3.5 py-2.5 text-right"><div className="h-3.5 w-20 skeleton ml-auto" /></td>
                  <td className="px-3.5 py-2.5 text-right"><div className="h-3.5 w-20 skeleton ml-auto" /></td>
                  <td className="px-3.5 py-2.5"><div className="h-4 w-16 skeleton" /></td>
                  <td className="px-3.5 py-2.5 text-right"><div className="h-4 w-16 skeleton ml-auto" /></td>
                </tr>
              ))
            ) : payslips.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 7 : 6}
                  className="px-3.5 py-12 text-center text-zinc-400 dark:text-zinc-500"
                >
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">No payslips found</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Generated payslips will appear here for review and download.</p>
                </td>
              </tr>
            ) : (
              payslips.map((payslip) => {
                const targetId = payslip._id || payslip.id;
                return (
                  <tr key={targetId} role={isAdmin ? 'link' : undefined} tabIndex={isAdmin ? 0 : undefined} onClick={isAdmin ? () => navigate(`/employees/${payslip.employee?.id || payslip.employee?._id}`, { state: { from: location } }) : undefined} onKeyDown={isAdmin ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(`/employees/${payslip.employee?.id || payslip.employee?._id}`, { state: { from: location } }) } } : undefined} aria-label={isAdmin ? `View details for ${payslip.employee?.firstName || 'employee'} ${payslip.employee?.lastName || ''}` : undefined} className={`hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors ${isAdmin ? 'cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500' : ''}`}>
                    {isAdmin && (
                      <td className="px-3.5 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                        {payslip.employee?.firstName} {payslip.employee?.lastName}
                      </td>
                    )}

                    <td className="px-3.5 py-2.5 text-zinc-600 dark:text-zinc-400">
                      {formatISTDate(new Date(Date.UTC(payslip.year, payslip.month - 1, 1)), { month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-3.5 py-2.5 text-zinc-600 dark:text-zinc-400">
                      {payslip.createdAt ? formatISTDate(payslip.createdAt, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>

                    <td className="px-3.5 py-2.5 text-right text-zinc-600 dark:text-zinc-400 font-mono tabular-nums">
                      {formatCurrency(payslip.basicSalary)}
                    </td>

                    <td className="px-3.5 py-2.5 text-right font-medium text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
                      {formatCurrency(payslip.netSalary)}
                    </td>

                    <td className="px-3.5 py-2.5"><span className="badge badge-success">Issued</span></td>

                    <td className="px-3.5 py-2.5 text-right">
                      <a
                        href={`/print/payslips/${targetId}?autoprint=true`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                        className="btn-secondary h-7 px-2.5 py-0 text-xs inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                        <span>Download</span>
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {!loading && <Pagination page={page} totalPages={totalPages} totalItems={total} onPageChange={onPageChange} />}
    </div>
  );
};

export default PayslipList;
