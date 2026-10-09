import { Download } from 'lucide-react';
import { formatCurrency, formatISTDate } from '../../utils/formatters';

const PayslipList = ({ payslips, isAdmin }) => {
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
              <th className="px-3.5 py-2.5 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[11px] text-right">
                Basic Salary
              </th>
              <th className="px-3.5 py-2.5 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[11px] text-right">
                Net Salary
              </th>
              <th className="px-3.5 py-2.5 font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[11px] text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {payslips.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 5 : 4}
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
                  <tr key={targetId} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    {isAdmin && (
                      <td className="px-3.5 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                        {payslip.employee?.firstName} {payslip.employee?.lastName}
                      </td>
                    )}

                    <td className="px-3.5 py-2.5 text-zinc-600 dark:text-zinc-400">
                      {formatISTDate(new Date(Date.UTC(payslip.year, payslip.month - 1, 1)), { month: 'long', year: 'numeric' })}
                    </td>

                    <td className="px-3.5 py-2.5 text-right text-zinc-600 dark:text-zinc-400 font-mono tabular-nums">
                      {formatCurrency(payslip.basicSalary)}
                    </td>

                    <td className="px-3.5 py-2.5 text-right font-medium text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
                      {formatCurrency(payslip.netSalary)}
                    </td>

                    <td className="px-3.5 py-2.5 text-right">
                      <a
                        href={`/print/payslips/${targetId}?autoprint=true`}
                        target="_blank"
                        rel="noopener noreferrer"
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
    </div>
  );
};

export default PayslipList;