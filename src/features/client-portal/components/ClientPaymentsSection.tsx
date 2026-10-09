'use client';

import React, { useState } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Download, 
  FileText, 
  AlertCircle, 
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  Receipt,
  Sparkles
} from 'lucide-react';
import { Project, PaymentRecord, ScheduledPayment } from '@/types';

interface ClientPaymentsSectionProps {
  project: Project;
  onMakePayment?: (amount: number, stageName: string) => void;
}

export const ClientPaymentsSection: React.FC<ClientPaymentsSectionProps> = ({
  project,
  onMakePayment,
}) => {
  const [selectedPaymentModal, setSelectedPaymentModal] = useState<ScheduledPayment | null>(null);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);

  const totalBudget = project.totalBudget || 450000;
  const advanceReceived = project.advanceReceived || 250000;
  const balanceDue = project.balanceDue || Math.max(0, totalBudget - advanceReceived);
  const percentPaid = Math.round((advanceReceived / totalBudget) * 100);

  // Fallback scheduled timeline if not in project
  const scheduledStages: ScheduledPayment[] = project.paymentSchedule && project.paymentSchedule.length > 0 
    ? project.paymentSchedule 
    : [
        {
          id: 'sp-1',
          stageName: 'Booking Advance (30%)',
          dueDate: '2026-07-10',
          amount: 150000,
          status: 'received',
          notes: 'Received via NEFT / UPI'
        },
        {
          id: 'sp-2',
          stageName: 'Pre-Wedding & Shoot Advance (25%)',
          dueDate: '2026-08-15',
          amount: 100000,
          status: 'received',
          notes: 'Received prior to Goa Pre-Wedding'
        },
        {
          id: 'sp-3',
          stageName: 'Main Wedding Shoot Date (25%)',
          dueDate: '2026-10-15',
          amount: 100000,
          status: 'pending',
          notes: 'Due on Day 1 of Udaipur Wedding'
        },
        {
          id: 'sp-4',
          stageName: 'Final Delivery & Album Handover (20%)',
          dueDate: '2026-12-05',
          amount: 100000,
          status: 'pending',
          notes: 'Due upon final 4K drive & printed album dispatch'
        }
      ];

  const handleSimulateOnlinePayment = (stage: ScheduledPayment) => {
    // Simulate secure Razorpay/Stripe checkout
    if (onMakePayment) {
      onMakePayment(stage.amount, stage.stageName);
    }
    setPaymentSuccessMessage(`Payment of ₹${stage.amount.toLocaleString('en-IN')} for "${stage.stageName}" completed successfully! Transaction ID: WPP_TXN_${Date.now()}`);
    setSelectedPaymentModal(null);
    setTimeout(() => {
      setPaymentSuccessMessage(null);
    }, 5000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Success Notification Banner */}
      {paymentSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-xs sm:text-sm font-medium">{paymentSuccessMessage}</p>
          </div>
          <button 
            onClick={() => setPaymentSuccessMessage(null)}
            className="text-xs text-emerald-700 font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top 3 Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Package Value */}
        <div className="bg-white rounded-2xl p-6 border border-[#e2d9d3] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total Package Value</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-slate-900">
            ₹{totalBudget.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400">
            All services, shoots, 4K films & albums included
          </p>
        </div>

        {/* Amount Paid */}
        <div className="bg-white rounded-2xl p-6 border border-[#e2d9d3] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-medium uppercase tracking-wider">Amount Paid</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-emerald-700">
            ₹{advanceReceived.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${percentPaid}%` }} />
            </div>
            <span className="text-[11px] font-medium text-emerald-700">{percentPaid}% Cleared</span>
          </div>
        </div>

        {/* Balance Remaining */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 rounded-2xl p-6 shadow-md space-y-2">
          <div className="flex items-center justify-between text-amber-950/70">
            <span className="text-xs font-semibold uppercase tracking-wider">Balance Remaining</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-serif font-medium">
            ₹{balanceDue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-amber-950/80">
            Linked to upcoming milestones & delivery
          </p>
        </div>
      </div>

      {/* Scheduled Payment Milestones & Online Pay */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e2d9d3] shadow-sm space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-serif text-slate-900">Payment Milestones &amp; Schedule</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely track every payment installment or settle due amounts online
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            100% Encrypted Payments
          </span>
        </div>

        <div className="space-y-3">
          {scheduledStages.map((stage, idx) => {
            const isReceived = stage.status === 'received';
            return (
              <div 
                key={stage.id}
                className={`p-4 sm:p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isReceived 
                    ? 'bg-emerald-50/40 border-emerald-200' 
                    : 'bg-slate-50/70 border-slate-200 hover:border-amber-400'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`mt-0.5 p-2 rounded-full ${
                    isReceived ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isReceived ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">{stage.stageName}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        isReceived ? 'bg-emerald-200/80 text-emerald-800' : 'bg-amber-200 text-amber-900'
                      }`}>
                        {isReceived ? 'Completed' : 'Upcoming / Due'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Due Date: <span className="font-medium text-slate-700">{stage.dueDate}</span> {stage.notes && `• ${stage.notes}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Amount</span>
                    <span className="text-base font-serif font-medium text-slate-900">
                      ₹{stage.amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {!isReceived ? (
                    <button
                      onClick={() => setSelectedPaymentModal(stage)}
                      className="px-4 py-2 bg-[#6d2f45] hover:bg-[#8f3655] text-white text-xs font-medium rounded-xl flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Pay Online
                    </button>
                  ) : (
                    <button
                      onClick={() => alert(`Receipt WPP-REC-${stage.id.toUpperCase()} downloaded for ₹${stage.amount.toLocaleString('en-IN')}`)}
                      className="px-3 py-1.5 bg-white text-slate-700 hover:text-slate-900 text-xs font-medium rounded-lg border border-slate-200 flex items-center gap-1 hover:bg-slate-50 transition-colors"
                      title="Download Official Tax Receipt"
                    >
                      <Receipt className="w-3.5 h-3.5 text-slate-500" />
                      Receipt
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Records & Receipts History */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e2d9d3] shadow-sm space-y-4">
        <h3 className="text-lg font-serif text-slate-900">Payment History & Tax Invoices</h3>
        
        {project.payments && project.payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {project.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800">{p.receiptNumber}</td>
                    <td className="py-3.5 px-4 text-slate-600">{p.date}</td>
                    <td className="py-3.5 px-4 capitalize">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium">
                        {p.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{p.paymentMode}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700">₹{p.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button 
                        onClick={() => alert(`Downloading official PDF for receipt ${p.receiptNumber}`)}
                        className="text-amber-800 hover:text-amber-950 font-medium inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic py-3">
            Initial booking receipt generated. Detailed logs will appear as installments are confirmed.
          </p>
        )}
      </div>

      {/* Online Payment Modal */}
      {selectedPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="space-y-1 text-center">
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                Wedding Photo Planet Secure Gateway
              </span>
              <h3 className="text-xl font-serif text-slate-900 mt-2">
                Pay ₹{selectedPaymentModal.amount.toLocaleString('en-IN')}
              </h3>
              <p className="text-xs text-slate-500">
                Milestone: {selectedPaymentModal.stageName}
              </p>
            </div>

            {/* Payment Options */}
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-500 bg-slate-50/50 cursor-pointer flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    UPI
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">UPI / QR Code</div>
                    <div className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-500 bg-slate-50/50 cursor-pointer flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <CreditCard className="w-8 h-8 p-1.5 rounded-lg bg-[#6d2f45] text-white" />
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Credit / Debit Card</div>
                    <div className="text-[11px] text-slate-500">Visa, Mastercard, RuPay, Amex</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-500 bg-slate-50/50 cursor-pointer flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="w-8 h-8 p-1.5 rounded-lg bg-blue-600 text-white" />
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Net Banking / NEFT</div>
                    <div className="text-[11px] text-slate-500">All major Indian banks supported</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPaymentModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSimulateOnlinePayment(selectedPaymentModal)}
                className="flex-1 py-2.5 rounded-xl bg-[#6d2f45] hover:bg-[#8f3655] text-white text-xs font-semibold shadow-md transition-all"
              >
                Confirm & Settle ₹{selectedPaymentModal.amount.toLocaleString('en-IN')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
