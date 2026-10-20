'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AlertTriangle, BarChart3, Banknote, BriefcaseBusiness, CalendarDays, Camera, Check, ChevronDown, ChevronRight, CircleDollarSign, Download, FileBarChart, Filter, IndianRupee, Laptop, MoreHorizontal, Pencil, Plus, Receipt, Repeat2, Search, Trash2, TrendingDown, TrendingUp, Truck, Users, WalletCards, X } from 'lucide-react';
import { Project, TeamMember } from '@/types';
import { useToast } from '@/components/common';
import { usePermission } from '@/features/access';
import { expenseService, type ExpenseSummary } from '../services/expenseService';
import { Expense, ExpenseApprovalStatus, ExpenseCategory, ExpensePaymentMethod, ExpensePaymentStatus } from '../types';
import { IncomeManagement } from '@/features/income';
import { incomeService } from '@/features/income/services/incomeService';
import { BRAND } from '@/config/brand';

type Section = 'overview' | 'income' | 'monthly' | 'shoots' | 'office' | 'freelancers' | 'travel' | 'equipment' | 'vendors' | 'other' | 'recurring' | 'reports';
type FreelancerOption = { id: string; name: string; role?: string };

const sections: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Expense Overview', icon: BarChart3 }, { id: 'monthly', label: 'Monthly Expenses', icon: CalendarDays },
  { id: 'income', label: 'Income', icon: TrendingUp },
  { id: 'shoots', label: 'Shoot Expenses', icon: Camera }, { id: 'office', label: 'Office Expenses', icon: BriefcaseBusiness },
  { id: 'freelancers', label: 'Freelancer Expenses', icon: Users }, { id: 'travel', label: 'Travel & Cab', icon: Truck },
  { id: 'equipment', label: 'Equipment', icon: Laptop }, { id: 'vendors', label: 'Vendor Payments', icon: WalletCards },
  { id: 'other', label: 'Other Expenses', icon: MoreHorizontal }, { id: 'recurring', label: 'Recurring Expenses', icon: Repeat2 },
  { id: 'reports', label: 'Expense Reports', icon: FileBarChart },
];

const categoryMap: Record<Section, ExpenseCategory[] | null> = {
  overview: null, income: null, monthly: null, shoots: ['Shoot'], office: ['Office', 'Software', 'Utilities'], freelancers: ['Freelancer'],
  travel: ['Travel', 'Cab'], equipment: ['Equipment'], vendors: ['Vendor'], other: ['Marketing', 'Miscellaneous', 'Other'], recurring: null, reports: null,
};
const categories: ExpenseCategory[] = ['Shoot', 'Freelancer', 'Office', 'Travel', 'Cab', 'Equipment', 'Vendor', 'Marketing', 'Software', 'Utilities', 'Miscellaneous', 'Other'];
const subcategories: Record<ExpenseCategory, string[]> = {
  Shoot: ['Photographer payment', 'Cinematographer payment', 'Drone operator', 'Editor', 'Food', 'Venue-related expense', 'Equipment rental', 'Miscellaneous', 'Other'],
  Freelancer: ['Photographer', 'Cinematographer', 'Drone Operator', 'Editor', 'Album Designer', 'Retoucher', 'Other freelancer', 'Other'],
  Office: ['Rent', 'Stationery', 'Printing', 'Cleaning', 'Furniture', 'Repairs', 'Pantry', 'Courier', 'Other'],
  Travel: ['Flight', 'Train', 'Bus', 'Hotel', 'Fuel', 'Toll', 'Parking', 'Food', 'Local transportation', 'Other'],
  Cab: ['Uber', 'Ola', 'Rapido', 'Local Taxi', 'Private Cab', 'Driver Payment', 'Other'], Equipment: ['Camera purchase', 'Lens purchase', 'Drone', 'Lighting', 'Computer', 'Storage', 'Repair', 'Maintenance', 'Rental Equipment', 'Other'],
  Vendor: ['Album Printing', 'Photo Lab', 'Equipment Rental', 'Hotel', 'Travel Agency', 'Cab Provider', 'Decoration', 'Makeup', 'Venue', 'Catering', 'Other'],
  Marketing: ['Advertising', 'Social Media', 'Commission', 'Client Gifts', 'Events', 'Other'], Software: ['Adobe', 'Google Workspace', 'Microsoft', 'Dropbox', 'Hosting', 'Domains', 'AWS', 'Other software', 'Other'],
  Utilities: ['Electricity', 'Water', 'Internet', 'Mobile', 'Maintenance', 'Other'], Miscellaneous: ['Miscellaneous', 'Other'],
  Other: ['General Expense', 'Project / Wedding Expense', 'Personal Advance', 'Other'],
};
const methods: ExpensePaymentMethod[] = ['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Cheque', 'Other'];
const money = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;
const monthKey = (date: string) => date.slice(0, 7);
const currentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};
const todayKey = () => {
  const now = new Date();
  return `${currentMonthKey()}-${String(now.getDate()).padStart(2, '0')}`;
};
const projectTitle = (project?: Project) => project?.clientWeddingTitle || project?.projectName || project?.name || '—';
const displayExpenseId = (expense: Expense) => expense.id.startsWith('EXP-') ? expense.id : `EXP-${expense.date.replaceAll('-', '')}-${expense.id.slice(-4).toUpperCase()}`;

const emptyExpense = (addedBy: string): Expense => ({
  id: '', date: todayKey(), category: 'Shoot', subcategory: 'Photographer payment', description: '', amount: 0, paidAmount: 0,
  paymentMethod: 'UPI', paymentStatus: 'Pending', approvalStatus: 'Draft', addedBy, createdAt: '', updatedAt: '', payments: [],
});

export function ExpenseManagement({ projects, freelancers, currentUser }: { projects: Project[]; freelancers: FreelancerOption[]; currentUser: TeamMember }) {
  const toast = useToast();
  const { can } = usePermission();
  const canCreate = can('EXPENSE_CREATE');
  const canEdit = can('EXPENSE_UPDATE');
  const canDelete = can('EXPENSE_DELETE');
  const canApprovePerm = can('EXPENSE_APPROVE') || can('finance.approve_expenses');
  const canExport = can('REPORT_EXPORT') || can('finance.export');
  const canMarkPaid = can('PAYMENT_CREATE') || can('finance.record_payment') || canEdit;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Array<{id:string;name:string}>>([]);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary>({});
  const [profitLoss, setProfitLoss] = useState<{ month?: any; year?: any }>({});
  const loadedRef = useRef(false);
  const [recurring] = useState(() => expenseService.recurring());
  const [budgets] = useState(() => expenseService.budgets());
  const [section, setSection] = useState<Section>('overview');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | ExpenseCategory>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | ExpensePaymentStatus>('All');
  // Monthly Expenses must open on the actual current month, not a fixed demo month.
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [modal, setModal] = useState<'form' | 'detail' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Expense | null>(null);
  const [draft, setDraft] = useState<Expense>(() => emptyExpense(currentUser.name));

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    void Promise.all([expenseService.list(), expenseService.categories(), expenseService.summary(), incomeService.profitLoss('month'), incomeService.profitLoss('year')])
      .then(([items, options, summary, month, year]) => { setExpenses(items); setCategoryOptions(options); setExpenseSummary(summary); setProfitLoss({ month, year }); })
      .catch(() => toast.showToast('Unable to load expenses.'));
  }, []);

  const visibleExpenses = useMemo(() => expenses.filter((expense) => {
    const scoped = categoryMap[section];
    if (scoped && !scoped.includes(expense.category)) return false;
    if (categoryFilter !== 'All' && expense.category !== categoryFilter) return false;
    if (statusFilter !== 'All' && expense.paymentStatus !== statusFilter) return false;
    const project = projects.find((item) => item.id === expense.projectId);
    const haystack = [expense.id, expense.description, expense.category, expense.subcategory, expense.payee, expense.vendor, projectTitle(project)].join(' ').toLowerCase();
    return haystack.includes(search.toLowerCase());
  }), [expenses, section, selectedMonth, categoryFilter, statusFilter, search, projects]);

  const nowMonth = currentMonthKey();
  const sum = (items: Expense[]) => items.reduce((total, item) => total + item.amount, 0);
  const monthExpenses = expenses.filter((item) => monthKey(item.date) === nowMonth);
  const lastMonthExpenses = expenses.filter((item) => monthKey(item.date) === '2026-07');
  const thisMonth = sum(monthExpenses);
  const lastMonth = sum(lastMonthExpenses);
  const trendPercent = lastMonth ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
  const categoryTotal = (values: ExpenseCategory[]) => sum(monthExpenses.filter((item) => values.includes(item.category)));
  const pending = monthExpenses.reduce((total, item) => total + Math.max(0, item.amount - item.paidAmount), 0);
  const monthlyBudget = budgets.find((item) => item.month === nowMonth && item.category === 'Overall')?.amount || 0;
  const budgetPercent = monthlyBudget ? Math.round((thisMonth / monthlyBudget) * 100) : 0;

  const openAdd = (category?: ExpenseCategory) => {
    if (!canCreate) return;
    const next = emptyExpense(currentUser.name);
    if (category) { next.category = category; next.subcategory = subcategories[category][0]; }
    setDraft(next); setSelected(null); setModal('form');
  };
  const openEdit = (expense: Expense) => { if (!canEdit) return; setDraft({ ...expense }); setSelected(expense); setModal('form'); };
  const saveExpense = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selected ? !canEdit : !canCreate) return;
    const categoryId = categoryOptions.find((item) => item.name === draft.category)?.id;
    if (!categoryId) return toast.showToast('Select a valid expense category.');
    try { if (selected) {
      const updated = await expenseService.update(selected.id, draft, categoryId); setExpenses((items) => items.map((item) => item.id === selected.id ? updated : item));
      toast.showToast('Expense updated successfully.');
    } else {
      const created = await expenseService.create(draft, categoryId); setExpenses((items) => [created, ...items]);
      toast.showToast('Expense submitted successfully.');
    }
    setModal(null); } catch { toast.showToast('Unable to save expense.'); }
  };
  const updateApproval = (expense: Expense, approvalStatus: ExpenseApprovalStatus) => {
    if (!canApprovePerm) return;
    setExpenses((items) => items.map((item) => item.id === expense.id ? { ...item, approvalStatus, updatedAt: new Date().toISOString() } : item));
    setSelected((item) => item ? { ...item, approvalStatus } : item);
    toast.showToast(`Expense ${approvalStatus.toLowerCase()}.`);
  };
  const markPaid = async (expense: Expense) => {
    if (!canMarkPaid) return;
    const updated = await expenseService.addPayment(expense.id, expense.amount-expense.paidAmount, expense.paymentMethod);
    setExpenses((items) => items.map((item) => item.id === expense.id ? updated : item)); setSelected(updated); toast.showToast('Expense marked as paid.');
  };
  const remove = async () => { if (!selected || !canDelete) return; await expenseService.remove(selected.id); setExpenses((items) => items.filter((item) => item.id !== selected.id)); setModal(null); setSelected(null); toast.showToast('Expense deleted.'); };
  const exportPdf = (reportTitle = 'Expense Report') => {
    if (!canExport) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const reportTotal = visibleExpenses.reduce((total, expense) => total + expense.amount, 0);
    const outstanding = visibleExpenses.reduce((total, expense) => total + Math.max(0, expense.amount - expense.paidAmount), 0);
    doc.setFillColor(90, 47, 62);
    doc.rect(0, 0, 297, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(reportTitle, 14, 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`${BRAND.name}  |  Generated ${new Date().toLocaleDateString('en-IN')}`, 14, 22);
    doc.setTextColor(48, 44, 46);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Records: ${visibleExpenses.length}`, 14, 39);
    doc.text(`Total: Rs. ${Math.round(reportTotal).toLocaleString('en-IN')}`, 70, 39);
    doc.text(`Outstanding: Rs. ${Math.round(outstanding).toLocaleString('en-IN')}`, 145, 39);
    autoTable(doc, {
      startY: 46,
      head: [['Expense ID', 'Date', 'Category', 'Description', 'Project / Shoot', 'Paid To', 'Method', 'Amount', 'Paid', 'Status']],
      body: visibleExpenses.map((expense) => {
        const project = projects.find((item) => item.id === expense.projectId);
        return [expense.id, expense.date, `${expense.category} / ${expense.subcategory}`, expense.description, projectTitle(project), expense.payee || expense.vendor || '-', expense.paymentMethod, `Rs. ${expense.amount.toLocaleString('en-IN')}`, `Rs. ${expense.paidAmount.toLocaleString('en-IN')}`, expense.paymentStatus];
      }),
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2.2, textColor: [48, 44, 46], lineColor: [223, 217, 210], lineWidth: 0.2 },
      headStyles: { fillColor: [109, 47, 69], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 246, 247] },
      margin: { left: 10, right: 10 },
    });
    doc.save(`${reportTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${selectedMonth}.pdf`);
    toast.showToast('Expense PDF exported successfully.');
  };

  return <div className="mx-auto w-full max-w-[1600px] space-y-5 pb-12">
    <header className="overflow-hidden rounded-3xl border border-[#8f7368] bg-[linear-gradient(120deg,#42483F,#1f2d29)] px-5 py-6 text-white shadow-xl sm:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.2em] text-rose-100"><CircleDollarSign className="h-5 w-5"/> Financial Control Center</div><h1 className="text-2xl font-black sm:text-3xl">Expense Management</h1><p className="mt-2 max-w-2xl text-sm text-rose-100">Track every rupee from project production to office operations, approvals and profitability.</p></div>
        <div className="flex flex-wrap gap-2">{canExport && <button onClick={() => exportPdf()} className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-bold hover:bg-white/20"><Download className="h-4 w-4"/> Export PDF</button>}<button onClick={() => setSection('income')} className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-bold hover:bg-white/20"><TrendingUp className="h-4 w-4"/> Income</button>{canCreate && <button onClick={() => openAdd()} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-[#31342F] shadow-lg"><Plus className="h-4 w-4"/> Add Expense</button>}</div>
      </div>
    </header>

    <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      {sections.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setSection(id)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${section === id ? 'bg-[#31342F] text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}><Icon className="h-4 w-4"/>{label}</button>)}
    </nav>

    {section === 'overview' && <><ProfitLossCard month={profitLoss.month} year={profitLoss.year}/><Overview expenses={expenses} projects={projects} monthExpenses={monthExpenses} thisMonth={thisMonth} summaryMonth={expenseSummary.month?.total} summaryYear={expenseSummary.year?.total} lastMonth={lastMonth} trendPercent={trendPercent} pending={pending} recurringTotal={recurring.reduce((t, r) => t + r.amount, 0)} categoryTotal={categoryTotal} monthlyBudget={monthlyBudget} budgetPercent={budgetPercent} /></>}
    {section === 'income' ? <IncomeManagement projects={projects} /> : section === 'recurring' ? <RecurringView items={recurring} /> : section === 'reports' ? <ReportsView expenses={expenses} onExport={canExport ? exportPdf : undefined} /> : <>
      {section === 'shoots' && <Profitability projects={projects} expenses={expenses} />}
      {section === 'monthly' && <MonthlySummary expenses={expenses} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />}
      {section !== 'overview' && <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-lg font-black text-slate-900">{sections.find((item) => item.id === section)?.label}</h2><p className="text-xs text-slate-500">{visibleExpenses.length} records · {money(sum(visibleExpenses))} total</p></div><Filters search={search} setSearch={setSearch} category={categoryFilter} setCategory={setCategoryFilter} status={statusFilter} setStatus={setStatusFilter} />{canCreate && <button onClick={() => openAdd(categoryMap[section]?.[0])} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-xs font-bold text-white"><Plus className="h-4 w-4"/> Add Expense</button>}</div></div>}
      <ExpenseTable expenses={section === 'overview' ? expenses.slice(0, 6) : visibleExpenses} projects={projects} onView={(expense) => { setSelected(expense); setModal('detail'); }} onEdit={canEdit ? openEdit : undefined} />
    </>}

    {(canCreate || canEdit) && modal === 'form' && <ExpenseForm draft={draft} setDraft={setDraft} projects={projects} freelancers={freelancers} categoryOptions={categoryOptions} editing={!!selected} onClose={() => setModal(null)} onSubmit={saveExpense} />}
    {modal === 'detail' && selected && <ExpenseDetail expense={selected} project={projects.find((p) => p.id === selected.projectId)} canApprove={canApprovePerm} canEdit={canEdit} canDelete={canDelete} canMarkPaid={canMarkPaid} onClose={() => setModal(null)} onEdit={() => openEdit(selected)} onDelete={() => setModal('delete')} onApproval={updateApproval} onMarkPaid={markPaid} />}
    {canDelete && modal === 'delete' && selected && <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-red-100 text-red-600"><Trash2/></div><h3 className="text-lg font-black">Delete {selected.id}?</h3><p className="mt-2 text-sm text-slate-500">This expense and its payment history will be removed.</p><div className="mt-6 flex justify-end gap-2"><button onClick={() => setModal('detail')} className="rounded-xl border px-4 py-2 text-sm font-bold">Cancel</button><button onClick={remove} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">Delete Expense</button></div></div></div>}
  </div>;
}

function Overview({ expenses, projects, monthExpenses, thisMonth, summaryMonth, summaryYear, lastMonth, trendPercent, pending, recurringTotal, categoryTotal, monthlyBudget, budgetPercent }: any) {
  const yearTotal = expenses.filter((e: Expense) => e.date.startsWith('2026')).reduce((t: number, e: Expense) => t + e.amount, 0);
  const cards = [
    ['This Month', summaryMonth ?? thisMonth, `${trendPercent >= 0 ? '+' : ''}${trendPercent.toFixed(1)}% from last month`, IndianRupee], ['This Year', summaryYear ?? yearTotal, '2026 total spending', CalendarDays],
    ['Shoot Expenses', categoryTotal(['Shoot']), 'Production linked', Camera], ['Freelancer Payments', categoryTotal(['Freelancer']), 'Crew & post-production', Users],
    ['Travel & Cab', categoryTotal(['Travel','Cab']), 'Transport & stays', Truck], ['Equipment', categoryTotal(['Equipment']), 'Purchase, rental & repair', Laptop],
    ['Pending Payments', pending, 'Outstanding balance', AlertTriangle], ['Recurring', recurringTotal, 'Upcoming scheduled costs', Repeat2],
    ['Average Monthly', yearTotal / 8, 'Year-to-date average', BarChart3],
  ];
  const categoryValues = ['Shoot','Freelancer','Office','Travel','Cab','Equipment','Software'].map((cat) => ({ cat, value: monthExpenses.filter((e: Expense) => e.category === cat).reduce((t: number,e: Expense) => t + e.amount, 0) }));
  const max = Math.max(...categoryValues.map((item) => item.value), 1);
  return <>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label,value,note,Icon]: any) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-900">{money(value)}</p><p className={`mt-1 text-xs font-semibold ${label === 'This Month' && trendPercent > 0 ? 'text-red-600' : 'text-slate-500'}`}>{note}</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-700"><Icon className="h-5 w-5"/></span></div></article>)}</section>
    <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]"><article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-black">Expense Trend</h2><p className="text-xs text-slate-500">Last 6 months</p></div><TrendingUp className="text-emerald-600"/></div><TrendChart expenses={expenses}/></article><article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-black">Expense Categories</h2><p className="mb-4 text-xs text-slate-500">August 2026 breakdown</p><div className="space-y-3">{categoryValues.map(({cat,value}) => <div key={cat}><div className="mb-1 flex justify-between text-xs font-bold"><span>{cat}</span><span>{money(value)}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-[#4F554C] to-[#b99a5e]" style={{width:`${(value/max)*100}%`}}/></div></div>)}</div></article></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-2 flex justify-between"><div><h2 className="font-black">August Budget</h2><p className="text-xs text-slate-500">{money(thisMonth)} spent of {money(monthlyBudget)}</p></div><span className={`text-lg font-black ${budgetPercent >= 90 ? 'text-red-600' : budgetPercent >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>{budgetPercent}%</span></div><div className="h-3 rounded-full bg-slate-100"><div className={`h-full rounded-full ${budgetPercent >= 90 ? 'bg-red-500' : budgetPercent >= 80 ? 'bg-amber-500' : 'bg-emerald-600'}`} style={{width:`${Math.min(budgetPercent,100)}%`}}/></div><p className="mt-2 text-xs font-semibold text-slate-500">{money(Math.max(0,monthlyBudget-thisMonth))} budget remaining</p></section>
    <div><h2 className="mb-3 text-lg font-black">Recent Expenses</h2></div>
  </>;
}

function ProfitLossCard({month,year}:{month?:any;year?:any}) { const Card=({label,data}:{label:string;data?:any})=>{const value=Number(data?.netProfit||0);return <div className="rounded-xl bg-white/10 p-3"><p className="text-xs font-bold text-rose-100">{label}</p><p className={`mt-1 text-xl font-black ${value>=0?'text-emerald-300':'text-red-300'}`}>{money(value)}</p><p className="text-[10px] text-rose-100">Income {money(Number(data?.totalIncome||0))} · Expense {money(Number(data?.totalExpense||0))}</p></div>}; return <section className="rounded-2xl border border-[#8f7368] bg-[linear-gradient(120deg,#42483F,#1f2d29)] p-5 text-white shadow-xl"><div className="mb-3 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-300"/><h2 className="font-black">Profit / Loss</h2></div><div className="grid gap-3 sm:grid-cols-2"><Card label="This Month" data={month}/><Card label="This Year" data={year}/></div></section> }

function TrendChart({ expenses }: { expenses: Expense[] }) { const months = ['Mar','Apr','May','Jun','Jul','Aug']; const keys = ['2026-03','2026-04','2026-05','2026-06','2026-07','2026-08']; const values = keys.map((key) => expenses.filter((e) => monthKey(e.date) === key).reduce((t,e) => t+e.amount,0)); const max=Math.max(...values,1); return <div className="flex h-44 items-end gap-3">{values.map((value,index)=><div key={keys[index]} className="flex h-full flex-1 flex-col justify-end gap-2"><span className="text-center text-[10px] font-bold text-slate-500">{value ? money(value) : '—'}</span><div className="min-h-1 rounded-t-lg bg-gradient-to-t from-[#31342F] to-[#b99a5e]" style={{height:`${Math.max(4,(value/max)*120)}px`}}/><span className="text-center text-[10px] font-bold">{months[index]}</span></div>)}</div> }

function Filters({search,setSearch,category,setCategory,status,setStatus}: any) { return <div className="flex flex-1 flex-wrap gap-2"><label className="relative min-w-48 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search expense, shoot or vendor" className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs"/></label><select value={category} onChange={(e)=>setCategory(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"><option>All</option>{categories.map(c=><option key={c}>{c}</option>)}</select><select value={status} onChange={(e)=>setStatus(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold"><option>All</option>{['Unpaid','Pending','Partially Paid','Paid','Overdue'].map(s=><option key={s}>{s}</option>)}</select></div> }

function ExpenseTable({ expenses, projects, onView, onEdit }: { expenses: Expense[]; projects: Project[]; onView:(e:Expense)=>void; onEdit?:(e:Expense)=>void }) { return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr>{['Expense ID','Date','Category / Description','Shoot / Project','Paid To','Method','Amount','Status','Added By','Actions'].map(h=><th key={h} className="px-4 py-3 font-black">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{expenses.length===0?<tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-slate-500">No expenses match these filters.</td></tr>:expenses.map(e=>{const p=projects.find(item=>item.id===e.projectId);return <tr key={e.id} onClick={()=>onView(e)} className="cursor-pointer hover:bg-rose-50/40"><td className="px-4 py-3 font-mono font-bold text-rose-700">{displayExpenseId(e)}</td><td className="px-4 py-3 whitespace-nowrap">{new Date(`${e.date}T00:00`).toLocaleDateString('en-IN')}</td><td className="px-4 py-3"><span className="font-bold">{e.category} · {e.subcategory}</span><p className="mt-0.5 max-w-52 truncate text-slate-500">{e.description}</p></td><td className="px-4 py-3 max-w-44 truncate">{projectTitle(p)}</td><td className="px-4 py-3 font-semibold">{e.payee||e.vendor||'—'}</td><td className="px-4 py-3">{e.paymentMethod}</td><td className="px-4 py-3 font-black">{money(e.amount)}<p className="font-medium text-slate-400">Due {money(e.amount-e.paidAmount)}</p></td><td className="px-4 py-3"><StatusBadge status={e.paymentStatus}/><p className="mt-1 text-[10px] font-bold text-slate-400">{e.approvalStatus}</p></td><td className="px-4 py-3">{e.addedBy}</td><td className="px-4 py-3">{onEdit && <button onClick={(event)=>{event.stopPropagation();onEdit(e)}} className="rounded-lg border p-2 text-slate-500 hover:text-rose-700"><Pencil className="h-3.5 w-3.5"/></button>}</td></tr>})}</tbody></table></div></div> }
function StatusBadge({status}:{status:ExpensePaymentStatus}) { const cls=status==='Paid'?'bg-emerald-100 text-emerald-700':status==='Overdue'?'bg-red-100 text-red-700':status==='Partially Paid'?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-600'; return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-black ${cls}`}>{status}</span> }

function MonthlySummary({expenses,selectedMonth,setSelectedMonth}:any){const scoped=expenses.filter((e:Expense)=>monthKey(e.date)===selectedMonth);return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-black">Monthly Summary</h2><p className="text-xs text-slate-500">Complete category-wise spending</p></div><input type="month" value={selectedMonth} onChange={(e)=>setSelectedMonth(e.target.value)} className="rounded-xl border px-3 py-2 text-sm font-bold"/></div><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{categories.map(c=>{const total=scoped.filter((e:Expense)=>e.category===c).reduce((t:number,e:Expense)=>t+e.amount,0);return <div key={c} className="flex justify-between rounded-xl bg-slate-50 p-3 text-xs"><span className="font-semibold">{c}</span><span className="font-black">{money(total)}</span></div>})}</div><div className="mt-4 flex justify-between rounded-xl bg-[#31342F] p-4 text-white"><span className="font-bold">Total Monthly Expense</span><span className="text-lg font-black">{money(scoped.reduce((t:number,e:Expense)=>t+e.amount,0))}</span></div></section>}

function Profitability({projects,expenses}:{projects:Project[];expenses:Expense[]}){return <section className="grid gap-3 lg:grid-cols-2">{projects.slice(0,4).map(p=>{const actual=expenses.filter(e=>e.projectId===p.id).reduce((t,e)=>t+e.amount,0);const revenue=p.totalBudget||0;const estimated=Math.round(revenue*.35);const profit=revenue-actual;const margin=revenue?(profit/revenue)*100:0;return <article key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex justify-between"><div><h3 className="font-black">{projectTitle(p)}</h3><p className="text-xs text-slate-500">Shoot Expense & Profitability</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${margin>=50?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{margin.toFixed(1)}% margin</span></div><div className="grid grid-cols-2 gap-3 text-xs"><Metric label="Client Package" value={revenue}/><Metric label="Estimated Expenses" value={estimated}/><Metric label="Actual Expenses" value={actual} danger={actual>estimated}/><Metric label="Gross Profit" value={profit}/></div>{actual>estimated&&<p className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 p-2 text-xs font-bold text-red-700"><TrendingDown className="h-4 w-4"/> Overspent by {money(actual-estimated)}</p>}</article>})}</section>}
function Metric({label,value,danger}:{label:string;value:number;danger?:boolean}){return <div className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">{label}</p><p className={`mt-1 text-base font-black ${danger?'text-red-600':''}`}>{money(value)}</p></div>}

function RecurringView({items}:any){return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-black">Recurring Expenses</h2><p className="mb-4 text-xs text-slate-500">Upcoming subscriptions, rent and contracts</p><div className="grid gap-3 lg:grid-cols-3">{items.map((item:any)=><article key={item.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex justify-between"><Repeat2 className="text-rose-700"/><span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">{item.status}</span></div><h3 className="mt-3 font-black">{item.name}</h3><p className="text-xs text-slate-500">{item.vendor} · {item.frequency}</p><p className="mt-3 text-xl font-black">{money(item.amount)}</p><p className="mt-1 text-xs font-semibold text-amber-700">Next due {item.nextDueDate}</p></article>)}</div></section>}
function ReportsView({expenses,onExport}:any){const reports=['Monthly Expense Report','Yearly Expense Report','Shoot Expense Report','Freelancer Payment Report','Vendor Payment Report','Office Expense Report','Travel Expense Report','Equipment Expense Report','Outstanding Payment Report','Category-wise Expense Report','Profitability Report'];return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-black">Expense Reports</h2><p className="mb-5 text-xs text-slate-500">Financial reports calculated from {expenses.length} expense records · PDF format</p><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{reports.map((report:string)=><button key={report} onClick={()=>onExport?.(report)} disabled={!onExport} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left text-sm font-bold hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"><span className="flex items-center gap-3"><FileBarChart className="h-5 w-5 text-rose-700"/>{report}</span><Download className="h-4 w-4 text-slate-400"/></button>)}</div></section>}

const expenseField = 'w-full rounded-2xl border border-[#ded5cf] bg-[#FBFDF6] py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#50574D] focus:bg-white focus:ring-4 focus:ring-rose-100';

function ExpenseForm({draft,setDraft,projects,freelancers,categoryOptions,editing,onClose,onSubmit}:any){
  const conditional=draft.category;
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#151714]/75 p-3 backdrop-blur-sm sm:p-6">
    <div role="dialog" aria-modal="true" aria-labelledby="expense-form-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/50 bg-white shadow-[0_30px_90px_rgba(14,15,13,.42)]">
      <header className="relative overflow-hidden bg-[radial-gradient(circle_at_86%_10%,rgba(236,190,169,.24),transparent_32%),linear-gradient(125deg,#41463E,#55333f_52%,#21241F)] px-5 py-5 text-white sm:px-7 sm:py-6">
        <div className="absolute -bottom-14 -right-8 size-44 rounded-full border-[24px] border-white/5" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-4"><span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-white/30 bg-white/15 shadow-inner"><Receipt className="size-7 text-[#f6d9ca]" /></span><div><p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[.18em] text-[#D9DCD8]"><CircleDollarSign className="size-3.5" /> Expense Record Intake</p><h2 id="expense-form-title" className="mt-1 text-xl font-black sm:text-2xl">{editing?'Edit Expense Record':'Add New Expense'}</h2><p className="mt-1 text-sm leading-relaxed text-[#dfeae7]">Capture the cost, link it correctly and record its payment status.</p></div></div>
          <button type="button" onClick={onClose} aria-label="Close expense form" className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-black/15 text-white/80 transition hover:bg-white/15 hover:text-white"><X className="size-5" /></button>
        </div>
      </header>
      <form onSubmit={onSubmit} className="space-y-6 p-5 sm:p-7">
        <ExpenseFormSection number="01" title="Expense Details" description="Record the date, type and purpose of this expense.">
          <ExpenseField label="Expense Date *" icon={<CalendarDays className="size-5"/>}><input className={expenseField} required type="date" value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})}/></ExpenseField>
          <ExpenseField label="Amount (₹) *" icon={<IndianRupee className="size-5"/>}><input className={expenseField} required min="1" type="number" value={draft.amount||''} onChange={e=>setDraft({...draft,amount:Number(e.target.value)})} placeholder="25000"/></ExpenseField>
          <ExpenseField label="Expense Category" icon={<Filter className="size-5"/>}><select className={`${expenseField} appearance-none pr-10`} value={draft.category} onChange={e=>{const c=e.target.value as ExpenseCategory;setDraft({...draft,category:c,subcategory:subcategories[c]?.[0]||'Other'})}}>{categoryOptions.map((c:any)=><option key={c.id}>{c.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-500"/></ExpenseField>
          <ExpenseField label="Subcategory" icon={<ChevronRight className="size-5"/>}><select className={`${expenseField} appearance-none pr-10`} value={draft.subcategory} onChange={e=>setDraft({...draft,subcategory:e.target.value})}>{subcategories[draft.category as ExpenseCategory].map(s=><option key={s}>{s}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-500"/></ExpenseField>
          <div className="sm:col-span-2"><ExpenseField label="Description *" icon={<Receipt className="size-5"/>}><input className={expenseField} required value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})} placeholder="What was this expense for?"/></ExpenseField></div>
        </ExpenseFormSection>

        <ExpenseFormSection number="02" title="CRM Link & Payee" description="Connect this expense with its project, freelancer or vendor.">
          {['Shoot','Freelancer','Travel','Cab','Equipment','Vendor','Other','Miscellaneous'].includes(conditional)&&<ExpenseField label="Shoot / Project" icon={<Camera className="size-5"/>}><select className={`${expenseField} appearance-none pr-10`} value={draft.projectId||''} onChange={e=>setDraft({...draft,projectId:e.target.value})}><option value="">Not linked</option>{projects.map((p:Project)=><option key={p.id} value={p.id}>{projectTitle(p)}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-500"/></ExpenseField>}
          {conditional==='Freelancer'&&<ExpenseField label="Freelancer / Role" icon={<Users className="size-5"/>}><select className={`${expenseField} appearance-none pr-10`} value={draft.freelancerId||''} onChange={e=>{const f=freelancers.find((x:FreelancerOption)=>x.id===e.target.value);setDraft({...draft,freelancerId:e.target.value,payee:f?.name,role:f?.role})}}><option value="">Select freelancer</option>{freelancers.map((f:FreelancerOption)=><option key={f.id} value={f.id}>{f.name} — {f.role}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-500"/></ExpenseField>}
          {['Vendor','Equipment','Office','Software','Other','Miscellaneous'].includes(conditional)&&<ExpenseField label="Vendor / Paid To" icon={<BriefcaseBusiness className="size-5"/>}><input className={expenseField} value={draft.vendor||''} onChange={e=>setDraft({...draft,vendor:e.target.value,payee:e.target.value})} placeholder="Vendor or business name"/></ExpenseField>}
          {['Travel','Cab'].includes(conditional)&&<><ExpenseField label="From" icon={<Truck className="size-5"/>}><input className={expenseField} value={draft.from||''} onChange={e=>setDraft({...draft,from:e.target.value})} placeholder="Pickup location"/></ExpenseField><ExpenseField label="To" icon={<ChevronRight className="size-5"/>}><input className={expenseField} value={draft.to||''} onChange={e=>setDraft({...draft,to:e.target.value})} placeholder="Destination"/></ExpenseField><ExpenseField label="Distance (km)" icon={<TrendingUp className="size-5"/>}><input className={expenseField} type="number" value={draft.distance||''} onChange={e=>setDraft({...draft,distance:Number(e.target.value)})} placeholder="42"/></ExpenseField></>}
          {!['Shoot','Freelancer','Travel','Cab','Equipment','Vendor','Office','Software','Other','Miscellaneous'].includes(conditional)&&<div className="sm:col-span-2 rounded-2xl border border-dashed border-[#ded5cf] bg-[#FBFDF6] p-4 text-sm text-slate-500">No additional CRM link is required for this category.</div>}
        </ExpenseFormSection>

        <ExpenseFormSection number="03" title="Payment & Proof" description="Track settlement progress and attach supporting proof.">
          <ExpenseField label="Payment Method" icon={<WalletCards className="size-5"/>}><select className={`${expenseField} appearance-none pr-10`} value={draft.paymentMethod} onChange={e=>setDraft({...draft,paymentMethod:e.target.value})}>{methods.map(m=><option key={m}>{m}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-500"/></ExpenseField>
          <ExpenseField label="Paid Amount (₹)" icon={<Banknote className="size-5"/>}><input className={expenseField} min="0" max={draft.amount} type="number" value={draft.paidAmount||''} onChange={e=>setDraft({...draft,paidAmount:Number(e.target.value)})} placeholder="0"/></ExpenseField>
          <ExpenseField label="Payment Status" icon={<Check className="size-5"/>}><select className={`${expenseField} appearance-none pr-10`} value={draft.paymentStatus} onChange={e=>setDraft({...draft,paymentStatus:e.target.value})}>{['Unpaid','Pending','Partially Paid','Paid','Overdue'].map(s=><option key={s}>{s}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-500"/></ExpenseField>
          <ExpenseField label="Receipt / Invoice" icon={<Download className="size-5"/>}><input className={`${expenseField} file:mr-2 file:rounded-lg file:border-0 file:bg-rose-100 file:px-2 file:py-1 file:text-xs file:font-bold file:text-rose-700`} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e=>{const file=e.target.files?.[0];if(file)setDraft({...draft,receipt:{fileName:file.name,fileType:file.type,fileUrl:'',uploadDate:new Date().toISOString(),uploadedBy:draft.addedBy}})}}/></ExpenseField>
          <div className="sm:col-span-2"><ExpenseField label="Notes / Approval Remarks" icon={<Pencil className="size-5"/>}><textarea className={`${expenseField} min-h-24 resize-none`} rows={3} value={draft.notes||''} onChange={e=>setDraft({...draft,notes:e.target.value})} placeholder="Payment terms, invoice reference or approval notes…"/></ExpenseField></div>
        </ExpenseFormSection>
        <footer className="flex flex-col-reverse gap-2 border-t border-[#eee7e2] pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#464B43] to-[#373B35] px-6 py-2.5 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(55,59,53,.25)] transition hover:-translate-y-0.5 hover:shadow-lg"><Plus className="size-5 transition group-hover:rotate-90"/>{editing?'Update Expense':'Save Expense Record'}</button></footer>
      </form>
    </div>
  </div>
}
function ExpenseFormSection({number,title,description,children}:{number:string;title:string;description:string;children:React.ReactNode}){return <section className="space-y-3 border-t border-[#eee7e2] pt-5 first:border-t-0 first:pt-0"><div><p className="text-sm font-black uppercase tracking-[.1em] text-[#373B35]">{number} · {title}</p><p className="mt-0.5 text-sm text-slate-500">{description}</p></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div></section>}
function ExpenseField({label,icon,children}:{label:string;icon:React.ReactNode;children:React.ReactNode}){return <label className="block text-sm font-bold text-slate-700">{label}<span className="relative mt-1.5 block"><span className="absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-[#50574D]">{icon}</span>{children}</span></label>}

function ExpenseDetail({expense,project,canApprove,canEdit,canDelete,canMarkPaid,onClose,onEdit,onDelete,onApproval,onMarkPaid}:any){return <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/55 backdrop-blur-sm"><aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="font-mono text-xs font-bold text-rose-700">{expense.id}</p><h2 className="mt-1 text-xl font-black">{expense.description}</h2><div className="mt-2 flex gap-2"><StatusBadge status={expense.paymentStatus}/><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black">{expense.approvalStatus}</span></div></div><button onClick={onClose} className="rounded-xl border p-2"><X/></button></div><div className="my-6 rounded-2xl bg-[#31342F] p-5 text-white"><p className="text-xs text-rose-100">Total Expense</p><p className="text-3xl font-black">{money(expense.amount)}</p><div className="mt-3 grid grid-cols-2 text-xs"><div>Paid <strong>{money(expense.paidAmount)}</strong></div><div>Remaining <strong>{money(expense.amount-expense.paidAmount)}</strong></div></div></div><div className="grid grid-cols-2 gap-3 text-xs">{[['Date',expense.date],['Category',`${expense.category} · ${expense.subcategory}`],['Project',projectTitle(project)],['Paid To',expense.payee||expense.vendor||'—'],['Payment Method',expense.paymentMethod],['Added By',expense.addedBy],['Created',new Date(expense.createdAt).toLocaleString('en-IN')],['Updated',new Date(expense.updatedAt).toLocaleString('en-IN')]].map(([l,v])=><div key={l} className="rounded-xl bg-slate-50 p-3"><p className="text-slate-500">{l}</p><p className="mt-1 font-bold">{v}</p></div>)}</div>{expense.notes&&<div className="mt-4 rounded-xl border p-4 text-sm"><p className="mb-1 text-xs font-bold text-slate-500">Notes</p>{expense.notes}</div>}<div className="mt-5"><h3 className="font-black">Payment History</h3><div className="mt-2 space-y-2">{expense.payments.length?expense.payments.map((p:any)=><div key={p.id} className="flex justify-between rounded-xl bg-emerald-50 p-3 text-xs"><span>{p.date} · {p.method}</span><strong>{money(p.amount)}</strong></div>):<p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">No payments recorded yet.</p>}</div></div><div className="mt-6 flex flex-wrap gap-2 border-t pt-5">{canEdit&&<button onClick={onEdit} className="flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold"><Pencil className="h-4 w-4"/> Edit</button>}{canMarkPaid&&expense.paymentStatus!=='Paid'&&<button onClick={()=>onMarkPaid(expense)} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white"><Check className="h-4 w-4"/> Mark Paid</button>}{canApprove&&expense.approvalStatus==='Submitted'&&<><button onClick={()=>onApproval(expense,'Approved')} className="rounded-xl bg-rose-700 px-4 py-2 text-xs font-bold text-white">Approve</button><button onClick={()=>onApproval(expense,'Rejected')} className="rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600">Reject</button></>}{canDelete&&<button onClick={onDelete} className="ml-auto rounded-xl border border-red-200 p-2 text-red-600"><Trash2 className="h-4 w-4"/></button>}</div></aside></div>}
