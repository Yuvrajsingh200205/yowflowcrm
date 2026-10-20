import React, { useState } from 'react';
import { Project, PaymentRecord } from '@/types';
import { useToast } from '@/components/common';
import { usePermission } from '@/features/access';
import { 
  X, 
  Search, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Phone, 
  MapPin, 
  Calendar, 
  Eye, 
  Upload, 
  TrendingUp, 
  ShieldCheck, 
  CreditCard,
  Building2,
  QrCode,
  Banknote,
  ChevronDown,
  ChevronUp,
  Maximize2
} from 'lucide-react';

interface AllPaymentsModalProps {
  isOpen: boolean;
  variant?: 'modal' | 'page';
  onClose: () => void;
  projects: Project[];
  onUpdateProject: (updatedProject: Project) => void;
  onSelectProject?: (project: Project) => void;
}

export const AllPaymentsModal: React.FC<AllPaymentsModalProps> = ({
  isOpen,
  variant = 'modal',
  onClose,
  projects,
  onUpdateProject,
  onSelectProject,
}) => {
  const { showToast } = useToast();
  const { can } = usePermission();
  const canRecordPayment = can('finance.record_payment');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'paid'>('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'due_desc' | 'budget_desc' | 'recent_pay' | 'title'>('due_desc');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  // Quick Payment Addition inside Modal
  const [addPayForProjectId, setAddPayForProjectId] = useState<string | null>(null);
  const [newPayAmount, setNewPayAmount] = useState<number | ''>('');
  const [newPayMode, setNewPayMode] = useState<'UPI / GPay' | 'Bank Transfer' | 'Cash' | 'Cheque'>('UPI / GPay');
  const [newPayNotes, setNewPayNotes] = useState('');
  const [newPayScreenshot, setNewPayScreenshot] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Overall Financial Calculations
  const totalRevenue = projects.reduce((acc, p) => acc + (p.totalBudget || 0), 0);
  const totalAdvanceReceived = projects.reduce((acc, p) => acc + (p.advanceReceived || 0), 0);
  const totalBalanceDue = projects.reduce((acc, p) => acc + (p.balanceDue || 0), 0);

  // Payment mode statistics
  const modeTotals = projects.reduce(
    (acc, p) => {
      p.payments?.forEach((pay) => {
        if (pay.paymentMode === 'UPI / GPay') acc.upi += pay.amount;
        else if (pay.paymentMode === 'Bank Transfer') acc.bank += pay.amount;
        else if (pay.paymentMode === 'Cash') acc.cash += pay.amount;
        else if (pay.paymentMode === 'Cheque') acc.cheque += pay.amount;
      });
      return acc;
    },
    { upi: 0, bank: 0, cash: 0, cheque: 0 }
  );

  // Handle image/screenshot upload for new installment
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be under 5MB.', { variant: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setNewPayScreenshot(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add new payment to project
  const handleAddPayment = (project: Project, e: React.FormEvent) => {
    e.preventDefault();
    if (!canRecordPayment) return;
    if (!newPayAmount || Number(newPayAmount) <= 0) return;

    const amountNum = Number(newPayAmount);
    const newRecord: PaymentRecord = {
      id: `pay-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: amountNum,
      type: 'installment',
      paymentMode: newPayMode,
      receiptNumber: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: newPayNotes || 'Payment Installment',
      receiptScreenshot: newPayScreenshot || undefined,
    };

    const updatedPayments = [newRecord, ...(project.payments || [])];
    const updatedAdvance = (project.advanceReceived || 0) + amountNum;
    const updatedBalance = Math.max(0, project.totalBudget - updatedAdvance);

    const currentSchedules = project.paymentSchedule || [];
    let cumulativeReq = 0;
    const updatedSchedules = currentSchedules.map((item) => {
      cumulativeReq += item.amount;
      const isMet = updatedBalance === 0 || (updatedAdvance >= cumulativeReq && cumulativeReq > 0);
      return { ...item, status: isMet ? ('received' as const) : ('pending' as const) };
    });

    const updatedProject: Project = {
      ...project,
      advanceReceived: updatedAdvance,
      balanceDue: updatedBalance,
      payments: updatedPayments,
      paymentSchedule: updatedSchedules.length > 0 ? updatedSchedules : project.paymentSchedule,
    };

    onUpdateProject(updatedProject);

    // Reset form
    setNewPayAmount('');
    setNewPayNotes('');
    setNewPayScreenshot('');
    setAddPayForProjectId(null);
  };

  // Filter & Sort Projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = 
      p.clientWeddingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientContactMobile.includes(searchTerm) ||
      p.venueLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.payments && p.payments.some(pay => pay.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) || (pay.notes && pay.notes.toLowerCase().includes(searchTerm.toLowerCase()))));

    const isPaid = p.balanceDue <= 0;
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'due' && !isPaid) || 
      (statusFilter === 'paid' && isPaid);

    const matchesMode = 
      paymentModeFilter === 'all' || 
      (p.payments && p.payments.some(pay => pay.paymentMode === paymentModeFilter));

    return matchesSearch && matchesStatus && matchesMode;
  }).sort((a, b) => {
    if (sortBy === 'due_desc') return b.balanceDue - a.balanceDue;
    if (sortBy === 'budget_desc') return b.totalBudget - a.totalBudget;
    if (sortBy === 'title') return a.clientWeddingTitle.localeCompare(b.clientWeddingTitle);
    if (sortBy === 'recent_pay') {
      const lastA = a.payments?.[0]?.date || a.createdAt;
      const lastB = b.payments?.[0]?.date || b.createdAt;
      return new Date(lastB).getTime() - new Date(lastA).getTime();
    }
    return 0;
  });

  if (!isOpen) return null;

  return (
    <div
      className={variant === 'page' ? 'w-full' : 'fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/75 p-2 backdrop-blur-sm sm:p-4'}
      onClick={variant === 'modal' ? onClose : undefined}
    >
      <div 
        className={variant === 'page' ? 'relative flex min-h-[calc(100vh-9rem)] w-full flex-col overflow-hidden rounded-2xl border border-[#dfd9d2] bg-slate-100 shadow-[0_12px_35px_rgba(14,17,12,.08)]' : 'relative my-auto flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-2xl'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <IndianRupee className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white uppercase">
                  All Client Payment & Revenue Audit
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] border border-emerald-500/30">
                  LIVE FINANCIAL REPORT
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Track payments received, pending balances, payment modes, and receipt slips for all clients.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

          {/* 1. Overall Revenue Summary Banner Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Budget / Revenue */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Studio Budget</p>
                <p className="text-2xl font-black text-slate-900 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{projects.length} Total Client Projects</p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            {/* Total Received / Advance */}
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Total Collected / Received</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">₹{totalAdvanceReceived.toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-emerald-600 mt-0.5 font-bold">
                  {totalRevenue > 0 ? `${((totalAdvanceReceived / totalRevenue) * 100).toFixed(1)}% Collected` : '0%'}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>

            {/* Total Pending / Balance Due */}
            <div className="p-4 rounded-xl bg-red-50/80 border border-red-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold text-red-800 uppercase tracking-wider">Total Pending Balance Due</p>
                <p className="text-2xl font-black text-red-600 mt-1">₹{totalBalanceDue.toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-red-600 mt-0.5 font-bold">
                  {projects.filter(p => p.balanceDue > 0).length} Clients Pending Payment
                </p>
              </div>
              <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Payment Mode Collections breakdown bar */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              Received by Payment Mode:
            </span>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-bold text-slate-800">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-slate-500 text-[10px] uppercase">UPI / GPay:</span>
                <span className="text-indigo-700">₹{modeTotals.upi.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-slate-500 text-[10px] uppercase">Bank:</span>
                <span className="text-blue-700">₹{modeTotals.bank.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-slate-500 text-[10px] uppercase">Cash:</span>
                <span className="text-emerald-700">₹{modeTotals.cash.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* 2. Search & Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
              {/* Search input */}
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search client title, mobile, location, receipt #..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-medium focus:outline-none"
                >
                  <option value="all">Filter: All Clients ({projects.length})</option>
                  <option value="due">Pending Balance Due ({projects.filter(p => p.balanceDue > 0).length})</option>
                  <option value="paid">Fully Paid ({projects.filter(p => p.balanceDue <= 0).length})</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-medium focus:outline-none"
                >
                  <option value="due_desc">Sort: Highest Pending Due</option>
                  <option value="budget_desc">Sort: Highest Total Budget</option>
                  <option value="recent_pay">Sort: Most Recent Payment</option>
                  <option value="title">Sort: Client Name A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Clients Payment List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
              <span>Showing {filteredProjects.length} Client Projects</span>
              <span className="text-[11px] text-slate-400 font-normal">Click any client row to view/record payment installments</span>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                <IndianRupee className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No payment records found matching filters</p>
                <p className="text-xs text-slate-400">Try clearing your search or filter options above.</p>
              </div>
            ) : (
              filteredProjects.map((project) => {
                const isPaid = project.balanceDue <= 0;
                const percentReceived = project.totalBudget > 0 ? Math.min(100, Math.round((project.advanceReceived / project.totalBudget) * 100)) : 0;
                const isExpanded = expandedProjectId === project.id;
                const isAddingPay = addPayForProjectId === project.id;

                return (
                  <div 
                    key={project.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition overflow-hidden"
                  >
                    {/* Main Client Row */}
                    <div className="p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Client Info */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 
                              onClick={() => {
                                if (onSelectProject) {
                                  onClose();
                                  onSelectProject(project);
                                }
                              }}
                              className="text-base font-black text-slate-900 hover:text-indigo-600 cursor-pointer transition flex items-center gap-1.5"
                            >
                              <span>{project.clientWeddingTitle}</span>
                            </h4>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                              {project.primaryServiceType}
                            </span>
                            {isPaid ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> FULLY PAID
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] uppercase border border-amber-200 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" /> BALANCE PENDING
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                            <a href={`tel:${project.clientContactMobile}`} className="hover:text-indigo-600 flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-indigo-500" /> {project.clientContactMobile}
                            </a>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {project.venueLocation}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" /> {project.weddingFunctionDates}
                            </span>
                          </div>
                        </div>

                        {/* Right Financial Pill Box */}
                        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                          <div className="text-right">
                            <div className="text-xs text-slate-400 font-bold uppercase">Total Budget: <span className="text-slate-900 font-black">₹{project.totalBudget.toLocaleString('en-IN')}</span></div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs font-black">
                              <span className="text-emerald-600">Rec: ₹{project.advanceReceived.toLocaleString('en-IN')}</span>
                              <span className="text-slate-300">•</span>
                              <span className={project.balanceDue > 0 ? "text-red-600 font-black" : "text-emerald-600"}>
                                Due: ₹{project.balanceDue.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold transition flex items-center gap-1 text-xs"
                          >
                            <span>{isExpanded ? 'Hide Slips' : 'View Installments'}</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Payment Progress bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px] font-extrabold uppercase text-slate-500">
                          <span>Payment Received Progress ({percentReceived}%)</span>
                          <span>Pending ₹{project.balanceDue.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-emerald-500 h-full transition-all duration-300" 
                            style={{ width: `${percentReceived}%` }} 
                          />
                          <div 
                            className="bg-red-200 h-full transition-all duration-300" 
                            style={{ width: `${100 - percentReceived}%` }} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expandable Payment Installment Details Section */}
                    {(isExpanded || isAddingPay) && (
                      <div className="bg-slate-50 border-t border-slate-200 p-4 space-y-3 text-xs">
                        
                        <div className="flex items-center justify-between">
                          <h5 className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-indigo-600" />
                            Recorded Payment Installments ({project.payments?.length || 0})
                          </h5>

                          {canRecordPayment && (
                          <button
                            onClick={() => setAddPayForProjectId(isAddingPay ? null : project.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg uppercase tracking-wider text-[10px] transition shadow-2xs flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>{isAddingPay ? 'Cancel Form' : '+ Record New Payment'}</span>
                          </button>
                          )}
                        </div>

                        {/* Inline Form to Add Payment */}
                        {isAddingPay && (
                          <form onSubmit={(e) => handleAddPayment(project, e)} className="p-3.5 bg-white rounded-xl border border-emerald-300 shadow-sm space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs items-end">
                              <div>
                                <label className="block text-slate-600 mb-1 font-extrabold text-[10px] uppercase">Amount (₹)</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 50000"
                                  value={newPayAmount}
                                  onChange={(e) => setNewPayAmount(Number(e.target.value))}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-bold focus:ring-1 focus:ring-emerald-500"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-slate-600 mb-1 font-extrabold text-[10px] uppercase">Mode</label>
                                <select
                                  value={newPayMode}
                                  onChange={(e) => setNewPayMode(e.target.value as any)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                                >
                                  <option value="UPI / GPay">UPI / GPay</option>
                                  <option value="Bank Transfer">Bank Transfer</option>
                                  <option value="Cash">Cash</option>
                                  <option value="Cheque">Cheque</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-slate-600 mb-1 font-extrabold text-[10px] uppercase">Notes / Remarks</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 2nd Installment"
                                  value={newPayNotes}
                                  onChange={(e) => setNewPayNotes(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                                />
                              </div>

                              {/* Upload Slip Screenshot */}
                              <div>
                                <label className="block text-slate-600 mb-1 font-extrabold text-[10px] uppercase flex items-center justify-between">
                                  <span>Slip Screenshot</span>
                                  {newPayScreenshot && <span className="text-[9px] text-emerald-600 font-bold">Uploaded ✓</span>}
                                </label>
                                <label className="cursor-pointer bg-slate-50 border border-dashed border-slate-300 hover:border-indigo-500 rounded-lg p-1.5 text-center text-slate-600 hover:text-indigo-600 transition flex items-center justify-center gap-1.5 font-bold">
                                  <Upload className="w-3.5 h-3.5 text-indigo-500" />
                                  <span className="text-[10px]">
                                    {newPayScreenshot ? 'Change File' : 'Upload Slip'}
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleScreenshotUpload}
                                    className="hidden"
                                  />
                                </label>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setAddPayForProjectId(null)}
                                className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider shadow-xs"
                              >
                                Save Payment Record
                              </button>
                            </div>
                          </form>
                        )}

                        {/* List of Payments */}
                        {(!project.payments || project.payments.length === 0) ? (
                          <p className="text-xs text-slate-400 italic py-1">No payment installments recorded yet. Booking advance: ₹{project.advanceReceived.toLocaleString('en-IN')}</p>
                        ) : (
                          <div className="space-y-2">
                            {project.payments.map((p) => (
                              <div 
                                key={p.id}
                                className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-slate-900 text-sm">₹{p.amount.toLocaleString('en-IN')}</span>
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold text-[10px] border border-indigo-100">
                                      {p.paymentMode}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">Receipt #{p.receiptNumber}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 mt-0.5">
                                    {p.notes || 'Payment Installment'} • <span className="text-slate-400">{p.date}</span>
                                  </p>
                                </div>

                                {/* Slip Screenshot preview if available */}
                                {p.receiptScreenshot && p.receiptScreenshot.trim() && (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedImage(p.receiptScreenshot!)}
                                    className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                                  >
                                    <img
                                      src={p.receiptScreenshot}
                                      alt="Slip"
                                      className="w-5 h-5 rounded object-cover border border-indigo-300"
                                    />
                                    <span>View Slip Proof</span>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-200 border-t border-slate-300 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-600 font-bold">
            Studio Total Collection: <span className="text-emerald-700 font-extrabold">₹{totalAdvanceReceived.toLocaleString('en-IN')}</span> / ₹{totalRevenue.toLocaleString('en-IN')}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg uppercase tracking-wider text-xs transition"
          >
            Close Audit
          </button>
        </div>
      </div>

      {/* Lightbox Preview for Payment Slip Screenshot */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative bg-white rounded-2xl p-4 max-w-2xl w-full shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" /> Payment Slip Screenshot
              </span>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-center bg-slate-900/5 rounded-xl p-2 max-h-[70vh] overflow-auto border border-slate-200">
              <img
                src={selectedImage || undefined}
                alt="Payment Slip Screenshot"
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-md"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 font-medium">Click outside or press X to close</span>
              <a
                href={selectedImage}
                download="payment-slip-screenshot.png"
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Download Proof</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
