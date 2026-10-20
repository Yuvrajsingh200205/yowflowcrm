import React, { useState } from 'react';
import { Freelancer, FreelancerAssignment, FreelancerPayment, FreelancerDataReceived, FreelancerCategory } from '@/types';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Filter, 
  FileText, 
  DollarSign, 
  Film, 
  Calendar, 
  Search,
  CheckCircle,
  Clock
} from 'lucide-react';

interface FreelancerReportsViewProps {
  freelancers: Freelancer[];
  assignments: FreelancerAssignment[];
  payments: FreelancerPayment[];
  dataReceivedList: FreelancerDataReceived[];
  categories: FreelancerCategory[];
}

export const FreelancerReportsView: React.FC<FreelancerReportsViewProps> = ({
  freelancers,
  assignments,
  payments,
  dataReceivedList,
  categories,
}) => {
  // Filter States
  const [selectedFreelancerId, setSelectedFreelancerId] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Filter logic for assignments report
  const filteredAssignments = assignments.filter((a) => {
    const matchesFl = selectedFreelancerId === 'all' || a.freelancerId === selectedFreelancerId;
    const matchesCat = selectedCategory === 'all' || a.category === selectedCategory;
    const matchesPayStatus = selectedPaymentStatus === 'all' || a.paymentStatus === selectedPaymentStatus;

    const matchesFromDate = !fromDate || a.shootDate >= fromDate;
    const matchesToDate = !toDate || a.shootDate <= toDate;

    return matchesFl && matchesCat && matchesPayStatus && matchesFromDate && matchesToDate;
  });

  const paidForAssignment = (assignmentId: string) =>
    payments.filter((p) => p.assignmentId === assignmentId).reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const totalReportAgreed = filteredAssignments.reduce((sum, a) => sum + (a.totalAgreedAmount || 0), 0);
  const totalReportPaid = filteredAssignments.reduce((sum, a) => sum + paidForAssignment(a.id), 0);
  const totalReportPending = Math.max(0, totalReportAgreed - totalReportPaid);
  const categoryCost = categories.map((c) => ({
    name: c.name,
    cost: filteredAssignments.filter((a) => a.category === c.name).reduce((s, a) => s + (a.totalAgreedAmount || 0), 0),
  }));
  const upcomingCommitments = assignments
    .filter((a) => a.assignmentStatus !== 'cancelled' && a.assignmentStatus !== 'completed')
    .reduce((s, a) => s + Math.max(0, (a.totalAgreedAmount || 0) - paidForAssignment(a.id)), 0);

  // Export CSV Function
  const handleExportCSV = () => {
    const headers = [
      'Shoot ID',
      'Freelancer Name',
      'Category',
      'Sub Category',
      'Project / Client',
      'Event Name',
      'Shoot Date',
      'Venue',
      'Role',
      'Agreed Charges (INR)',
      'Paid Amount (INR)',
      'Pending Amount (INR)',
      'Payment Status',
      'Assignment Status',
    ];

    const rows = filteredAssignments.map((a) => [
      a.id,
      `"${a.freelancerName}"`,
      `"${a.category}"`,
      `"${a.subCategory}"`,
      `"${a.projectName}"`,
      `"${a.eventName}"`,
      a.shootDate,
      `"${a.venue}"`,
      `"${a.role}"`,
      a.totalAgreedAmount,
      a.advancePaid,
      a.pendingAmount,
      a.paymentStatus,
      a.assignmentStatus,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Freelancer_Shoot_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#464B43] flex items-center justify-center font-bold text-white shadow-xs">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">Freelancer Team & Payroll Reports</h2>
            <p className="text-xs text-slate-500">Comprehensive cost breakdown, shoot ledger & CSV exports</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV / Excel</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 print:hidden">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[#464B43]" />
          <span>Report Filters</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Freelancer</label>
            <select
              value={selectedFreelancerId}
              onChange={(e) => setSelectedFreelancerId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-bold"
            >
              <option value="all">All Freelancers</option>
              {freelancers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-bold"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Payment Status</label>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-bold"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50"
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Filtered Total Agreed Cost</span>
          <h3 className="text-xl font-black text-slate-900 font-mono">₹{totalReportAgreed.toLocaleString('en-IN')}</h3>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Amount Disbursed</span>
          <h3 className="text-xl font-black text-emerald-600 font-mono">₹{totalReportPaid.toLocaleString('en-IN')}</h3>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Pending Balance</span>
          <h3 className="text-xl font-black text-red-600 font-mono">₹{totalReportPending.toLocaleString('en-IN')}</h3>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#e2d9d3] bg-white p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Upcoming commitments</p>
          <p className="mt-1 text-lg font-black text-slate-900">₹{upcomingCommitments.toLocaleString('en-IN')}</p>
        </div>
        <div className="rounded-2xl border border-[#e2d9d3] bg-white p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Category-wise cost</p>
          <div className="mt-2 space-y-1">
            {categoryCost.filter((c) => c.cost > 0).map((c) => (
              <p key={c.name} className="flex justify-between text-xs font-bold text-slate-700">
                <span>{c.name}</span>
                <span>₹{c.cost.toLocaleString('en-IN')}</span>
              </p>
            ))}
            {categoryCost.every((c) => c.cost === 0) && <p className="text-xs text-slate-500">No category spend in this filter.</p>}
          </div>
        </div>
      </div>

      {/* Report Detailed Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Shoot Assignments & Payment Ledger Report ({filteredAssignments.length} Records)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-extrabold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Shoot Date</th>
                <th className="p-3.5">Freelancer Name</th>
                <th className="p-3.5">Category / Role</th>
                <th className="p-3.5">Project / Event</th>
                <th className="p-3.5 text-right">Agreed Cost</th>
                <th className="p-3.5 text-right">Paid</th>
                <th className="p-3.5 text-right">Pending</th>
                <th className="p-3.5 text-center">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    No shoot records match the selected report filter.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-800">{a.shootDate}</td>
                    <td className="p-3.5 font-extrabold text-slate-900">{a.freelancerName}</td>
                    <td className="p-3.5 text-slate-600">
                      <strong>{a.category}</strong> ({a.role})
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">
                      {a.projectName} - <span className="text-slate-500 text-[11px] font-normal">{a.eventName}</span>
                    </td>
                    <td className="p-3.5 text-right font-black text-slate-900 font-mono">
                      ₹{a.totalAgreedAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-right font-black text-emerald-600 font-mono">
                      ₹{paidForAssignment(a.id).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-right font-black text-red-600 font-mono">
                      ₹{Math.max(0, (a.totalAgreedAmount || 0) - paidForAssignment(a.id)).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase ${
                        a.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {(a.paymentStatus || 'unpaid').replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
