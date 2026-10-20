import { IndianRupee } from 'lucide-react';

interface Props { totalRevenue: number; totalAdvanceReceived: number; totalBalanceDue: number; currentUserName?: string; }
export function FinancialCollectionStatus({ totalRevenue, totalAdvanceReceived, totalBalanceDue, currentUserName }: Props) {
  const collected = totalRevenue > 0 ? (totalAdvanceReceived / totalRevenue) * 100 : 0;
  const due = totalRevenue > 0 ? (totalBalanceDue / totalRevenue) * 100 : 0;
  return <section className="dashboard-panel dashboard-panel--finance space-y-4 rounded-2xl border border-[#dfd9d2] border-t-3 border-t-[#4F554C] bg-linear-to-br from-white to-[#fcf8f4] p-5 shadow-[0_10px_30px_rgba(48,44,46,.07)]">
    <div className="flex items-center justify-between border-b border-slate-100 pb-2"><div><h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-slate-800"><IndianRupee className="size-4 text-rose-700" />Financial Collection Status (₹)</h3><p className="mt-0.5 text-xs text-slate-500">Studio revenue collection progress vs pending client balances</p></div><span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold uppercase text-rose-700">{currentUserName ? `${currentUserName} Studio Ledger` : 'Studio Ledger'}</span></div>
    <div className="space-y-1.5 pt-1"><div className="flex justify-between text-xs font-semibold"><span className="text-green-700">Advance Received: ₹{totalAdvanceReceived.toLocaleString('en-IN')}</span><span className="text-red-600">Balance Due: ₹{totalBalanceDue.toLocaleString('en-IN')}</span></div><div className="flex h-2.5 w-full overflow-hidden rounded-full border border-slate-200 bg-slate-100"><div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${collected}%` }} /><div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${due}%` }} /></div><div className="flex justify-between text-xs font-medium text-slate-500"><span>Total Bookings: ₹{totalRevenue.toLocaleString('en-IN')}</span><span>{Math.round(collected)}% Collected</span></div></div>
  </section>;
}
