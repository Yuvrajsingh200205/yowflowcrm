import { Pencil, Plus, Receipt, Trash2 } from 'lucide-react';
import { OfficeExpense } from '@/types';
interface Props { expenses: OfficeExpense[]; allExpenses: OfficeExpense[]; totalExpenses: number; totalPaidPayroll: number; categoryFilter: string; setCategoryFilter: (value: string) => void; spentByFilter: string; setSpentByFilter: (value: string) => void; fromDate: string; toDate: string; formatDate: (value: string) => string; onAdd: () => void; onEdit: (expense: OfficeExpense) => void; onDelete: (expense: OfficeExpense) => void; }
export function MonthlyOfficeExpenses({ expenses: filteredOfficeExpenses, allExpenses: officeExpenses, totalExpenses: totalMonthlyExpenses, totalPaidPayroll, categoryFilter: expenseCategoryFilter, setCategoryFilter: setExpenseCategoryFilter, spentByFilter: expenseSpentByFilter, setSpentByFilter: setExpenseSpentByFilter, fromDate: finFromDate, toDate: finToDate, formatDate: formatDateDots, onAdd, onEdit: handleOpenEditExpense, onDelete: setExpenseToDelete }: Props) {
  return (
  <section className="flex h-[34rem] flex-col overflow-hidden rounded-2xl border border-[#dfd9d2] bg-white p-4 shadow-[0_10px_30px_rgba(48,44,46,.07)] sm:p-5">
    <div className="flex shrink-0 items-center justify-between border-b border-slate-100 pb-2.5">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-rose-100 text-rose-800 rounded-xl">
          <Receipt className="w-4 h-4" />
        </div>
        <div>
          <h3 className="flex flex-wrap items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-900">
            <span>Monthly Office Expense</span>
            {(finFromDate || finToDate) && (
              <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                {formatDateDots(finFromDate)} - {formatDateDots(finToDate)}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 font-medium">Studio operating cost ledger, by category</p>
        </div>
      </div>

      <button
        onClick={onAdd}
        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs transition shadow-2xs flex items-center gap-1 cursor-pointer"
      >
        <Plus className="w-3 h-3" /> Log New Expense
      </button>
    </div>

    {/* Slim context line — full totals already live in the Monthly P&L snapshot above */}
    <p className="mt-4 shrink-0 text-xs font-semibold text-slate-500">
      <span className="font-black text-rose-600">{filteredOfficeExpenses.length}</span> expense{filteredOfficeExpenses.length === 1 ? '' : 's'} logged this period, totalling <span className="font-black text-rose-600">₹{totalMonthlyExpenses.toLocaleString('en-IN')}</span>.
    </p>

    {/* Category & Spent By Filters */}
    <div className="mt-4 grid shrink-0 grid-cols-2 gap-2 bg-[#faf8f6] p-3 rounded-xl border border-[#e6ded8] text-xs">
      <div>
        <label className="block text-xs font-extrabold text-slate-500 uppercase mb-0.5">Filter Category</label>
        <select
          aria-label="Filter by category"
          value={expenseCategoryFilter}
          onChange={(e) => setExpenseCategoryFilter(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-bold text-xs focus:ring-2 focus:ring-rose-500 cursor-pointer"
        >
          <option value="all">All Categories</option>
          <option value="Rent">Rent</option>
          <option value="Electricity & Water">Electricity & Water</option>
          <option value="Studio Equipment & Repair">Equipment & Repair</option>
          <option value="Food & Tea/Chai">Food & Tea/Chai</option>
          <option value="Travel & Fuel">Travel & Fuel</option>
          <option value="Software & Subscriptions">Software & Subscriptions</option>
          <option value="Marketing & Ads">Marketing & Ads</option>
          <option value="Exposing & Operating">Exposing & Operating</option>
          <option value="Albums Print">Albums Print</option>
          <option value="Photo & Video Edit">Photo & Video Edit</option>
          <option value="Miscellaneous">Miscellaneous</option>
          <option value="Other">Other</option>
          {Array.from(new Set<string>(officeExpenses.map(e => String(e.category))))
            .filter((c: string) => !['Rent', 'Electricity & Water', 'Studio Equipment & Repair', 'Food & Tea/Chai', 'Travel & Fuel', 'Software & Subscriptions', 'Marketing & Ads', 'Exposing & Operating', 'Albums Print', 'Photo & Video Edit', 'Miscellaneous', 'Other'].includes(c))
            .map(customCat => (
              <option key={customCat} value={customCat}>{customCat}</option>
            ))
          }
        </select>
      </div>

      <div>
        <label className="block text-xs font-extrabold text-slate-500 uppercase mb-0.5">Filter Spent By</label>
        <select
          aria-label="Filter by who spent"
          value={expenseSpentByFilter}
          onChange={(e) => setExpenseSpentByFilter(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-bold text-xs focus:ring-2 focus:ring-rose-500 cursor-pointer"
        >
          <option value="all">All Persons / Roles</option>
          <option value="Owner">Spent by Owner</option>
          <option value="Studio Manager">Spent by Studio Manager</option>
          <option value="Account Manager">Spent by Account Manager</option>
          <option value="Other Staff">Spent by Other Staff</option>
          {Array.from(new Set<string>(officeExpenses.map(e => String(e.spentBy))))
            .filter((sb: string) => !['Owner', 'Studio Manager', 'Account Manager', 'Other Staff'].includes(sb))
            .map(customSb => (
              <option key={customSb} value={customSb}>{customSb}</option>
            ))
          }
        </select>
      </div>
    </div>

    {/* Expenses List */}
    <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
      {filteredOfficeExpenses.length === 0 ? (
        <p className="text-xs text-slate-400 py-4 text-center italic">No office expenses logged for selected filters.</p>
      ) : (
        filteredOfficeExpenses.map((exp) => (
          <div key={exp.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs gap-2 hover:border-rose-200 transition">
            <div className="min-w-0 flex-1">
              <div className="font-extrabold text-slate-900 truncate text-xs">{exp.title}</div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="text-xs font-mono font-bold text-slate-500">{exp.expenseDate}</span>
                <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 font-bold text-xs rounded">
                  {exp.category}
                </span>
                <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 border border-rose-100 font-bold text-xs rounded">
                  Spent by: {exp.spentBy}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono font-black text-rose-600 text-xs">
                - ₹{exp.amount.toLocaleString('en-IN')}
              </span>
              <button
                onClick={() => handleOpenEditExpense(exp)}
                className="text-slate-400 hover:text-rose-700 p-1 rounded transition cursor-pointer"
                title="Edit expense"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setExpenseToDelete(exp)}
                className="text-slate-400 hover:text-red-600 p-1 rounded transition cursor-pointer"
                title="Delete expense"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  </section>
  );
}
