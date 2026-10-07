import { format } from 'date-fns';
import { Download } from 'lucide-react';
import React from 'react';

const PayslipList = ({ payslips, isAdmin }) => {
  return (
    <div className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {isAdmin && <th>Employee</th>}
              <th>Period</th>
              <th>Basic Salary</th>
              <th>Net Salary</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payslips.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="text-center py-12 text-slate-400">
                  No payslips found
                </td>
              </tr>
            ) : (
              payslips.map((payslip) => {
                const targetId = payslip._id || payslip.id;
                return (
                  <tr key={targetId}>
                    {isAdmin && (
                      <td className="text-slate-900">
                        {payslip.employee?.firstName} {payslip.employee?.lastName}
                      </td>
                    )}

                    <td className="text-slate-500">
                      {format(new Date(payslip.year, payslip.month - 1), 'MMMM yyyy')}
                    </td>

                    <td className="text-slate-500">
                      ₹{payslip.basicSalary?.toLocaleString()}
                    </td>

                    <td className="font-medium text-slate-800">
                      ₹{payslip.netSalary?.toLocaleString()}
                    </td>

                    <td className="text-center">
                      <a
                        href={`/print/payslips/${targetId}?autoprint=true`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors ring-1 ring-indigo-600/10 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Download
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