import { CreditCard, IndianRupee, Plus, Receipt, Users } from 'lucide-react';
interface Props { fromDate: string; toDate: string; totalPayments: number; paymentCount: number; totalExpenses: number; totalPaidPayroll: number; formatDate: (value: string) => string; onAddExpense: () => void; onRecordPayment: () => void; }
export function MonthlyProfitLoss({ fromDate: finFromDate, toDate: finToDate, totalPayments: totalMonthlyPaymentsReceived, paymentCount, totalExpenses: totalMonthlyExpenses, totalPaidPayroll, formatDate: formatDateDots, onAddExpense, onRecordPayment }: Props) {
  return (
  <div className="space-y-5 rounded-3xl border border-[#ddc89c]/30 bg-[radial-gradient(circle_at_90%_0%,rgba(221,200,156,.16),transparent_28%),linear-gradient(125deg,#29443e,#432a34_50%,#17201e)] p-5 text-white shadow-xl md:p-6">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-rose-900/60 pb-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-rose-500/30 text-rose-300 border border-rose-400/30 font-extrabold text-xs uppercase tracking-wider">
            Monthly Profit & Loss Summary
          </span>
          {(finFromDate || finToDate) && (
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
              Period: {formatDateDots(finFromDate)} to {formatDateDots(finToDate)}
            </span>
          )}
        </div>
        <h3 className="text-base md:text-lg font-black text-white mt-1">
          Monthly Inflow vs Outflow
        </h3>
      </div>
    </div>

    {/* 4 Financial KPI Stat Cards */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Card 1: Total Client Payments Received */}
      <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-3.5 backdrop-blur-xs">
        <div className="flex items-center justify-between text-emerald-300">
          <span className="text-xs font-extrabold uppercase tracking-wider">Payments Received</span>
          <CreditCard className="w-4 h-4 text-emerald-400" />
        </div>
        <p className="text-xl md:text-2xl font-black text-emerald-400 mt-1">
          ₹{totalMonthlyPaymentsReceived.toLocaleString('en-IN')}
        </p>
        <p className="text-xs text-emerald-200/80 font-medium mt-1">
          From {paymentCount} client payments
        </p>
      </div>

      {/* Card 2: Total Office Expenses */}
      <div className="bg-rose-950/50 border border-rose-500/40 rounded-xl p-3.5 backdrop-blur-xs">
        <div className="flex items-center justify-between text-rose-300">
          <span className="text-xs font-extrabold uppercase tracking-wider">Office Expenses</span>
          <Receipt className="w-4 h-4 text-rose-400" />
        </div>
        <p className="text-xl md:text-2xl font-black text-rose-400 mt-1">
          ₹{totalMonthlyExpenses.toLocaleString('en-IN')}
        </p>
        <p className="text-xs text-rose-200/80 font-medium mt-1">
          Studio operating costs, all categories
        </p>
      </div>

      {/* Card 3: Staff Salary / Payroll Paid */}
      <div className="bg-amber-950/50 border border-amber-400/40 rounded-xl p-3.5 backdrop-blur-xs">
        <div className="flex items-center justify-between text-amber-200">
          <span className="text-xs font-extrabold uppercase tracking-wider">Staff Salaries Paid</span>
          <Users className="w-4 h-4 text-amber-300" />
        </div>
        <p className="text-xl md:text-2xl font-black text-amber-300 mt-1">
          ₹{totalPaidPayroll.toLocaleString('en-IN')}
        </p>
        <p className="text-xs text-amber-100/80 font-medium mt-1">
          Team Member Salary Disbursed
        </p>
      </div>

      {/* Card 4: Net Profit / Cash Balance */}
      {(() => {
        const totalOutflow = totalMonthlyExpenses + totalPaidPayroll;
        const netProfit = totalMonthlyPaymentsReceived - totalOutflow;
        const isProfit = netProfit >= 0;

        return (
          <div
            className={`border rounded-xl p-3.5 backdrop-blur-xs ${
              isProfit
                ? 'bg-rose-950/80 border-rose-400/50 text-rose-100'
                : 'bg-red-950/80 border-red-500/50 text-red-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider">
                {isProfit ? '🟢 Net Profit' : '🔻 Deficit'}
              </span>
              <IndianRupee className="w-4 h-4" />
            </div>
            <p
              className={`text-xl md:text-2xl font-black mt-1 ${
                isProfit ? 'text-amber-300' : 'text-red-300'
              }`}
            >
              ₹{Math.abs(netProfit).toLocaleString('en-IN')}
            </p>
            <p className="text-xs opacity-80 font-medium mt-1">
              Outflow: ₹{totalOutflow.toLocaleString('en-IN')}
            </p>
          </div>
        );
      })()}
    </div>
  </div>

  );
}
