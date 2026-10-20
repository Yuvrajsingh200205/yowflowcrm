import React from 'react';
import { Receipt, X } from 'lucide-react';
import { OfficeExpense } from '@/types';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
interface Props { open: boolean; variant?: 'modal' | 'page'; setOpen: (value: boolean) => void; editingExpense: OfficeExpense | null; setEditingExpense: (value: OfficeExpense | null) => void; onSubmit: (event: React.FormEvent) => void; title: string; setTitle: (value: string) => void; amount: number | ''; setAmount: (value: number | '') => void; category: string; setCategory: (value: string) => void; date: string; setDate: (value: string) => void; spentBy: string; setSpentBy: (value: string) => void; paidVia: OfficeExpense['paidVia']; setPaidVia: (value: OfficeExpense['paidVia']) => void; notes: string; setNotes: (value: string) => void; expenseToDelete: OfficeExpense | null; setExpenseToDelete: (value: OfficeExpense | null) => void; confirmDelete: (expense: OfficeExpense) => void; }
export function ExpenseModals({ open: showAddExpenseModal, variant = 'modal', setOpen: setShowAddExpenseModal, editingExpense, setEditingExpense, onSubmit: handleAddExpenseSubmit, title: newExpTitle, setTitle: setNewExpTitle, amount: newExpAmount, setAmount: setNewExpAmount, category: newExpCategory, setCategory: setNewExpCategory, date: newExpDate, setDate: setNewExpDate, spentBy: newExpSpentBy, setSpentBy: setNewExpSpentBy, paidVia: newExpPaidVia, setPaidVia: setNewExpPaidVia, notes: newExpNotes, setNotes: setNewExpNotes, expenseToDelete, setExpenseToDelete, confirmDelete: confirmDeleteExpense }: Props) {
  return (<>
  {/* Modal: Log / Edit Office Expense */}
  {showAddExpenseModal && (
    <div className={variant === 'page' ? 'w-full' : 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs'}>
      <div className={variant === 'page' ? 'mx-auto min-h-[calc(100vh-9rem)] w-full max-w-4xl space-y-5 rounded-2xl border border-[#dfd9d2] bg-white p-5 shadow-[0_12px_35px_rgba(22,35,32,.08)] sm:p-7' : 'w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl animate-in fade-in zoom-in-95 duration-200'}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4 text-rose-600" />
            <span>{editingExpense ? 'Edit Office Expense Record' : 'Log New Studio & Office Expense'}</span>
          </h4>
          <button
            type="button"
            onClick={() => {
              setShowAddExpenseModal(false);
              setEditingExpense(null);
            }}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleAddExpenseSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Expense Title / Item Description</label>
            <input
              type="text"
              required
              placeholder="e.g., Studio Rent, Electricity Bill, Chai & Biscuits, Sony Lens Repair"
              value={newExpTitle}
              onChange={(e) => setNewExpTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g., 5000"
                value={newExpAmount}
                onChange={(e) => setNewExpAmount(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Expense Date</label>
              <input
                type="date"
                required
                value={newExpDate}
                onChange={(e) => setNewExpDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={newExpCategory}
                onChange={(e) => setNewExpCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium cursor-pointer"
              >
                <option value="Rent">Rent</option>
                <option value="Electricity & Water">Electricity & Water</option>
                <option value="Studio Equipment & Repair">Studio Equipment & Repair</option>
                <option value="Food & Tea/Chai">Food & Tea/Chai</option>
                <option value="Travel & Fuel">Travel & Fuel</option>
                <option value="Software & Subscriptions">Software & Subscriptions</option>
                <option value="Marketing & Ads">Marketing & Ads</option>
                <option value="Exposing & Operating">Exposing & Operating</option>
                <option value="Albums Print">Albums Print</option>
                <option value="Photo & Video Edit">Photo & Video Edit</option>
                <option value="Miscellaneous">Miscellaneous</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={newExpPaidVia}
                onChange={(e) => setNewExpPaidVia(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium cursor-pointer"
              >
                <option value="UPI / GPay">UPI / GPay</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Spent By (Person / Staff Name)</label>
            <input
              type="text"
              placeholder="Enter person name / role (e.g. Owner, Studio Manager, Ramesh)"
              value={newExpSpentBy}
              onChange={(e) => setNewExpSpentBy(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-xs bg-white"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Notes / Voucher Ref (Optional)</label>
            <input
              type="text"
              placeholder="e.g., Bill #102, paid via PhonePe"
              value={newExpNotes}
              onChange={(e) => setNewExpNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAddExpenseModal(false);
                setEditingExpense(null);
              }}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-xs cursor-pointer"
            >
              {editingExpense ? 'Update Expense Record' : 'Save Office Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

  {/* Confirm Delete Expense Modal */}
  <ConfirmDeleteModal
    isOpen={!!expenseToDelete}
    title="Delete Office Expense"
    itemTitle={expenseToDelete ? `${expenseToDelete.title} (₹${expenseToDelete.amount.toLocaleString('en-IN')})` : ''}
    message={expenseToDelete ? `Are you sure you want to delete expense "${expenseToDelete.title}" (₹${expenseToDelete.amount.toLocaleString('en-IN')})?` : ''}
    onConfirm={() => {
      if (expenseToDelete) {
        confirmDeleteExpense(expenseToDelete);
        setExpenseToDelete(null);
      }
    }}
    onCancel={() => setExpenseToDelete(null)}
  />
  </>);
}
