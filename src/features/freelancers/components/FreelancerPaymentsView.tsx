import React, { useState } from 'react';
import { Freelancer, FreelancerAssignment, FreelancerPayment } from '@/types';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Filter, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  X, 
  Check, 
  ExternalLink,
  FileText,
  User
} from 'lucide-react';

interface FreelancerPaymentsViewProps {
  payments: FreelancerPayment[];
  assignments: FreelancerAssignment[];
  freelancers: Freelancer[];
  onSavePayment?: (payment: FreelancerPayment) => void;
}

export const FreelancerPaymentsView: React.FC<FreelancerPaymentsViewProps> = ({
  payments,
  assignments,
  freelancers,
  onSavePayment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // New Payment Form States
  const [selectedFreelancerId, setSelectedFreelancerId] = useState(freelancers[0]?.id || '');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [amountPaid, setAmountPaid] = useState<number>(2000);
  const [paymentType, setPaymentType] = useState<'advance' | 'second_payment' | 'final_settlement' | 'travel' | 'extra'>('advance');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Bank Transfer' | 'Cash' | 'Check'>('UPI');
  const [transactionId, setTransactionId] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [notes, setNotes] = useState('');

  // Auto-fill assignment based on selected freelancer
  const freelancerAssignments = assignments.filter((a) => a.freelancerId === selectedFreelancerId);

  const handleFreelancerSelect = (flId: string) => {
    setSelectedFreelancerId(flId);
    const flAssigns = assignments.filter((a) => a.freelancerId === flId);
    if (flAssigns.length > 0) {
      setSelectedAssignmentId(flAssigns[0].id);
      setAmountPaid(flAssigns[0].pendingAmount || 2000);
    } else {
      setSelectedAssignmentId('');
    }
  };

  const handleCreatePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fl = freelancers.find((f) => f.id === selectedFreelancerId);
    const assign = assignments.find((a) => a.id === selectedAssignmentId);

    const createdPayment: FreelancerPayment = {
      id: `f-pay-${Date.now()}`,
      freelancerId: selectedFreelancerId,
      freelancerName: fl?.name || 'Freelancer',
      assignmentId: selectedAssignmentId || undefined,
      projectName: assign?.projectName || 'General Advance',
      amountPaid: Number(amountPaid) || 0,
      paymentType,
      paymentDate,
      paymentMethod,
      transactionId: transactionId.trim(),
      receiptUrl: receiptUrl.trim(),
      notes: notes.trim(),
      createdBy: 'Accounts Admin',
    };

    if (!onSavePayment) return;
    onSavePayment(createdPayment);
    setShowPaymentModal(false);
    setTransactionId('');
    setReceiptUrl('');
    setNotes('');
  };

  // Metrics
  const totalPaidSum = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const totalAgreedSum = assignments.reduce((sum, a) => sum + a.totalAgreedAmount, 0);
  const totalPendingSum = Math.max(0, totalAgreedSum - totalPaidSum);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.freelancerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.transactionId && p.transactionId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMethod = methodFilter === 'all' || p.paymentMethod === methodFilter;

    return matchesSearch && matchesMethod;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Agreed Shoot Value</span>
            <h3 className="text-xl font-black text-slate-900 font-mono mt-0.5">₹{totalAgreedSum.toLocaleString('en-IN')}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#464B43]">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Disbursed / Paid</span>
            <h3 className="text-xl font-black text-emerald-600 font-mono mt-0.5">₹{totalPaidSum.toLocaleString('en-IN')}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Outstanding Pending</span>
            <h3 className="text-xl font-black text-red-600 font-mono mt-0.5">₹{totalPendingSum.toLocaleString('en-IN')}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Strip & Add Payment button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search freelancer name, project, transaction ref ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#50574D]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-700"
          >
            <option value="all">All Payment Methods</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
            <option value="Check">Check</option>
          </select>

          {onSavePayment && (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#7d4e53]/20 bg-[#464B43] px-4 py-2 text-xs font-extrabold text-white shadow-xs transition hover:bg-[#373B35] focus-visible:ring-2 focus-visible:ring-[#50574D]/35"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Record Freelancer Payment</span>
          </button>
          )}
        </div>
      </div>

      {/* Payments History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-extrabold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Freelancer</th>
                <th className="p-3.5">Project / Event</th>
                <th className="p-3.5">Payment Type</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Method & Txn Ref</th>
                <th className="p-3.5 text-right">Amount Paid</th>
                <th className="p-3.5 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No freelancer payments yet. Record a payout after a shoot is assigned.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-extrabold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-rose-50 text-[#373B35] font-bold text-xs flex items-center justify-center">
                        {payment.freelancerName[0]}
                      </div>
                      <span>{payment.freelancerName}</span>
                    </td>

                    <td className="p-3.5 font-bold text-slate-800">{payment.projectName || 'General Advance'}</td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-rose-50 text-[#30342E] text-[10px] font-black rounded uppercase">
                        {(payment.paymentType || 'Advance').replace('_', ' ')}
                      </span>
                    </td>

                    <td className="p-3.5 font-bold text-slate-600">{payment.paymentDate}</td>

                    <td className="p-3.5">
                      <span className="font-bold text-slate-800">{payment.paymentMethod}</span>
                      {payment.transactionId && (
                        <span className="block text-[10px] font-mono text-slate-400">{payment.transactionId}</span>
                      )}
                    </td>

                    <td className="p-3.5 text-right font-black text-emerald-600 text-sm font-mono">
                      +₹{payment.amountPaid.toLocaleString('en-IN')}
                    </td>

                    <td className="p-3.5 text-center">
                      {payment.receiptUrl ? (
                        <a
                          href={payment.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-[#464B43] hover:bg-rose-50 rounded inline-block"
                          title="View Receipt Slip"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {onSavePayment && showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-6">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-sm">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black">Record Freelancer Payment</h2>
                  <p className="text-xs text-emerald-300">Disburse advance or settle pending shoot payments</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePaymentSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Select Freelancer</label>
                <select
                  value={selectedFreelancerId}
                  onChange={(e) => handleFreelancerSelect(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-bold"
                >
                  {freelancers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.mainCategory})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Linked Shoot / Project</label>
                <select
                  value={selectedAssignmentId}
                  onChange={(e) => setSelectedAssignmentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-bold"
                >
                  {freelancerAssignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.projectName} ({a.eventName}) - Pending: ₹{a.pendingAmount.toLocaleString('en-IN')}
                    </option>
                  ))}
                  <option value="">General Payment / Unlinked Advance</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-bold font-mono text-emerald-700 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Payment Type</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-bold"
                  >
                    <option value="advance">Advance</option>
                    <option value="second_payment">2nd Payment</option>
                    <option value="final_settlement">Final Settlement</option>
                    <option value="travel">Travel Allowance</option>
                    <option value="extra">Extra Charges</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-bold"
                  >
                    <option value="UPI">UPI (GPay / Paytm)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT)</option>
                    <option value="Cash">Cash Handover</option>
                    <option value="Check">Check</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Transaction Ref ID / UTR</label>
                <input
                  type="text"
                  placeholder="e.g. UPI/1234567890/IMPS"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Receipt Slip Image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Remarks / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Settle balance post raw data receipt verification"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Payment Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
