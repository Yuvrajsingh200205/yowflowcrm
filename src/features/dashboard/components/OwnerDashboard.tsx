import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { OfficeExpense } from '@/types';
import { MemberSalaryRecord, OwnerDashboardProps, SalaryInstallment } from './dashboardTypes';
import { DashboardHeader } from './DashboardHeader';
import { DashboardKpiGrid } from './DashboardKpiGrid';
import { DashboardSecurityAlerts } from './DashboardSecurityAlerts';
import { TeamActivity } from './TeamActivity';
import { PanelSkeleton } from './PanelSkeleton';

import { ClientProjectsDeadlines } from './ClientProjectsDeadlines';
import { UpcomingShoots } from './UpcomingShoots';
import { FinancialFilterBar } from './FinancialFilterBar';
import { MonthlyProfitLoss } from './MonthlyProfitLoss';
import { MonthlyPayments } from './MonthlyPayments';
import { MonthlyOfficeExpenses } from './MonthlyOfficeExpenses';
import { MonthlyStaffSalary } from './MonthlyStaffSalary';
import { SalaryPaymentModal } from './SalaryPaymentModal';
import { ExpenseModals } from './ExpenseModals';
import { QuickActionsPanel } from './QuickActionsPanel';
import { DashboardCharts } from './DashboardCharts';
import { DashboardOnboarding } from './DashboardOnboarding';
import { useToast } from '@/components/common';
import { usePermission } from '@/features/access';
import { settingsApi } from '@/lib/api/settings';
import { Expense, ExpenseCategory, ExpensePaymentMethod } from '@/features/expenses/types';
import { expenseService } from '@/features/expenses/services/expenseService';


export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  projects,
  onSelectProject,
  onOpenNewProjectModal,
  onUpdateProject,
  onOpenAllPaymentsModal,
  setActiveTab,
  onProjectStatusNavigate,
  team = [],
  attendance = [],
  tasks = [],
  onUpdateTask,
  onDeleteTask,
  onAddTask,
  onOpenMemberModal,
  currentUser,
  attendanceSlot,
  summary,
  projectsPending = false,
  teamPending = false,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const { can } = usePermission();
  const isAddExpensePage = pathname === '/expenses/new';

  const expenseToOfficeExpense = (expense: Expense): OfficeExpense => ({
    id: expense.id,
    title: expense.description || expense.subcategory || expense.category,
    amount: expense.amount,
    category: expense.subcategory || expense.category,
    expenseDate: expense.date,
    spentBy: expense.addedBy || expense.vendor || expense.payee || 'Owner',
    paidVia: expense.paymentMethod === 'UPI' ? 'UPI / GPay' : expense.paymentMethod === 'Credit Card' ? 'Credit Card' : expense.paymentMethod === 'Bank Transfer' ? 'Bank Transfer' : 'Cash',
    notes: expense.notes,
    monthYear: expense.date.slice(0, 7),
  });

  const officeExpenseToExpense = (officeExpense: OfficeExpense): Expense => ({
    id: officeExpense.id,
    date: officeExpense.expenseDate,
    category: (officeExpense.category === 'Other' ? 'Other' : 'Office') as ExpenseCategory,
    subcategory: officeExpense.category,
    description: officeExpense.title,
    amount: officeExpense.amount,
    paidAmount: 0,
    payee: officeExpense.spentBy,
    vendor: officeExpense.spentBy,
    paymentMethod: (officeExpense.paidVia === 'UPI / GPay' ? 'UPI' : officeExpense.paidVia) as ExpensePaymentMethod,
    paymentStatus: 'Unpaid',
    approvalStatus: 'Submitted',
    addedBy: officeExpense.spentBy,
    createdAt: officeExpense.expenseDate,
    updatedAt: officeExpense.expenseDate,
    notes: officeExpense.notes,
    payments: [],
  });

  useEffect(() => {
    ['/projects/new', '/shoots', '/payments/new', '/expenses'].forEach((route) => router.prefetch(route));
  }, [router]);

  // Salary State Management
  const [salaryRecords, setSalaryRecords] = useState<MemberSalaryRecord[]>([]);
  const [salaryLedgerReady, setSalaryLedgerReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void settingsApi.list()
      .then((settings) => {
        if (cancelled) return;
        const stored = settings.find((setting) => setting.key === 'payroll.salary-ledger.v1')?.value;
        if (Array.isArray(stored)) setSalaryRecords(stored as MemberSalaryRecord[]);
      })
      .catch(() => showToast('Unable to load saved salary payments.', { variant: 'error' }))
      .finally(() => { if (!cancelled) setSalaryLedgerReady(true); });
    return () => { cancelled = true; };
  }, [showToast]);

  // The dashboard payroll panel is a view of the actual team roster—not a
  // sample ledger. Keep saved payment history only for members who still
  // exist, and add newly created members with a zero paid amount.
  useEffect(() => {
    setSalaryRecords((previous) => {
      const savedByMemberId = new Map(previous.map((record) => [record.memberId, record]));
      const next = team.map((member) => {
        const saved = savedByMemberId.get(member.id);
        const monthlySalary = member.monthlySalary ?? (member.dailyRate ? member.dailyRate * 26 : 0);
        return {
          memberId: member.id,
          memberName: member.name,
          role: member.role || 'Team Member',
          monthlySalary,
          paidAmount: saved?.paidAmount ?? 0,
          lastPaymentDate: saved?.lastPaymentDate,
          paymentMonth: saved?.paymentMonth,
          notes: saved?.notes,
          installments: saved?.installments,
        };
      });

      const unchanged = next.length === previous.length && next.every((record, index) => {
        const current = previous[index];
        return current && current.memberId === record.memberId && current.memberName === record.memberName
          && current.role === record.role && current.monthlySalary === record.monthlySalary
          && current.paidAmount === record.paidAmount;
      });
      return unchanged ? previous : next;
    });
  }, [team]);

  useEffect(() => {
    if (!salaryLedgerReady) return;
    void settingsApi.upsert(
      'payroll.salary-ledger.v1',
      salaryRecords,
      'Monthly staff salary payment ledger',
    ).catch(() => showToast('Salary payment could not be saved to the server.', { variant: 'error' }));
  }, [salaryLedgerReady, salaryRecords, showToast]);

  // Modal State for Updating Salary Payments
  const [editingSalaryMember, setEditingSalaryMember] = useState<MemberSalaryRecord | null>(null);
  const [editPaidAmount, setEditPaidAmount] = useState<number | ''>('');
  const [editPaymentMonth, setEditPaymentMonth] = useState<string>('');
  const [editSalaryNotes, setEditSalaryNotes] = useState<string>('');
  const [editInstallments, setEditInstallments] = useState<SalaryInstallment[]>([]);
  const [selectedSalaryMonth, setSelectedSalaryMonth] = useState<string>('2026-07');

  // Member's Attendance logs and calculations for live tracking inside the Update Salary Modal (1 Month filter)
  const memberAttendanceLogs = React.useMemo(() => {
    if (!editingSalaryMember) return [];
    
    const filterId = editingSalaryMember.memberId;
    const filterName = editingSalaryMember.memberName.toLowerCase();

    let logs = attendance && attendance.length > 0
      ? attendance.filter((a) => a.teamMemberId === filterId || a.teamMemberName.toLowerCase() === filterName)
      : [];

    // Filter to exactly 1 month (e.g. 2026-07 or 2026-08)
    if (selectedSalaryMonth) {
      logs = logs.filter((a) => a.date.startsWith(selectedSalaryMonth));
    }

    return logs;
  }, [editingSalaryMember, attendance, team, selectedSalaryMonth]);

  const presentDays = memberAttendanceLogs.filter((a) => a.status === 'present_shoot' || a.status === 'present_office').length;
  const halfDays = memberAttendanceLogs.filter((a) => a.status === 'half_day').length;
  const absentDays = memberAttendanceLogs.filter((a) => a.status === 'absent').length;

  const attendanceEarnedPay = memberAttendanceLogs.length > 0
    ? memberAttendanceLogs.reduce((acc, log) => acc + (log.payAmount || 0), 0)
    : (editingSalaryMember ? editingSalaryMember.monthlySalary : 0);

  const estimatedDailyRate = editingSalaryMember
    ? Math.round(editingSalaryMember.monthlySalary / 26)
    : 0;

  const currentEnteredPaid = Number(editPaidAmount) || 0;
  const pendingAttendanceBalance = Math.max(0, attendanceEarnedPay - currentEnteredPaid);
  const pendingBaseBalance = Math.max(0, (editingSalaryMember?.monthlySalary || 0) - currentEnteredPaid);

  const handleOpenEditModal = (m: MemberSalaryRecord) => {
    setEditingSalaryMember(m);
    setEditPaidAmount(m.paidAmount);
    setEditPaymentMonth(m.paymentMonth || new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }));
    setEditSalaryNotes(m.notes || '');
    setEditInstallments(m.installments ? m.installments.map((i) => ({ ...i })) : []);
  };

  const handleAddInstallment = () => {
    const nextNum = editInstallments.length + 1;
    const newInst: SalaryInstallment = {
      id: `inst_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      mode: 'GPay',
      notes: `Payment Part ${nextNum}`,
    };
    const updated = [...editInstallments, newInst];
    setEditInstallments(updated);
  };

  const handleRemoveInstallment = (id: string) => {
    const updated = editInstallments.filter((i) => i.id !== id);
    setEditInstallments(updated);
    if (updated.length > 0) {
      const sum = updated.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
      setEditPaidAmount(sum);
    }
  };

  const handleInstallmentChange = (id: string, field: keyof SalaryInstallment, value: any) => {
    const updated = editInstallments.map((inst) => {
      if (inst.id === id) {
        return { ...inst, [field]: value };
      }
      return inst;
    });
    setEditInstallments(updated);
    const sum = updated.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    setEditPaidAmount(sum);
  };

  const handleSaveMemberSalary = async () => {
    if (!editingSalaryMember) return;
    const activeInstallments = editInstallments.filter((i) => Number(i.amount) > 0 || i.notes);
    const installmentsSum = activeInstallments.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const updatedPaid = activeInstallments.length > 0 ? installmentsSum : (Number(editPaidAmount) || 0);

    const nextRecords = salaryRecords.map((r) =>
        r.memberId === editingSalaryMember.memberId
          ? {
              ...r,
              paidAmount: updatedPaid,
              lastPaymentDate: new Date().toISOString().split('T')[0],
              paymentMonth: editPaymentMonth.trim() || undefined,
              notes: editSalaryNotes.trim() || undefined,
              installments: activeInstallments,
            }
          : r
    );
    try {
      await settingsApi.upsert(
        'payroll.salary-ledger.v1',
        nextRecords,
        'Monthly staff salary payment ledger',
      );
      setSalaryRecords(nextRecords);
      showToast(`Salary payment saved for ${editingSalaryMember.memberName}.`);
      setEditingSalaryMember(null);
    } catch {
      showToast('Salary payment could not be saved. Please try again.', { variant: 'error' });
    }
  };

  const totalMonthlyPayroll = salaryRecords.reduce((acc, r) => acc + (r.monthlySalary || 0), 0);
  const totalPaidPayroll = salaryRecords.reduce((acc, r) => acc + (r.paidAmount || 0), 0);
  const totalPendingPayroll = Math.max(0, totalMonthlyPayroll - totalPaidPayroll);

  // Office Expenses State: backend-owned via /expenses.
  const [officeExpenses, setOfficeExpenses] = useState<OfficeExpense[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Array<{ id: string; name: string }>>([]);

  const refreshOfficeExpenses = React.useCallback(async () => {
    const [items, categories] = await Promise.all([expenseService.list(), expenseService.categories()]);
    setOfficeExpenses(items.map(expenseToOfficeExpense));
    setExpenseCategories(categories);
  }, []);

  useEffect(() => {
    void refreshOfficeExpenses().catch(() => {
      showToast('Unable to load office expenses from the server.', { variant: 'error' });
    });
  }, [refreshOfficeExpenses, showToast]);

  // Modal State for Log New Office Expense
  const [showAddExpenseModal, setShowAddExpenseModal] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<OfficeExpense | null>(null);
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');
  const [expenseSpentByFilter, setExpenseSpentByFilter] = useState<string>('all');
  const [newExpTitle, setNewExpTitle] = useState<string>('');
  const [newExpAmount, setNewExpAmount] = useState<number | ''>('');
  const [newExpCategory, setNewExpCategory] = useState<string>('Rent');
  const [customExpCategory, setCustomExpCategory] = useState<string>('');
  const [newExpDate, setNewExpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newExpSpentBy, setNewExpSpentBy] = useState<string>('Owner');
  const [customExpSpentBy, setCustomExpSpentBy] = useState<string>('');
  const [newExpPaidVia, setNewExpPaidVia] = useState<OfficeExpense['paidVia']>('UPI / GPay');
  const [newExpNotes, setNewExpNotes] = useState<string>('');

  const handleOpenEditExpense = (exp: OfficeExpense) => {
    setEditingExpense(exp);
    setNewExpTitle(exp.title);
    setNewExpAmount(exp.amount);
    setNewExpCategory(exp.category);
    setNewExpDate(exp.expenseDate);
    setNewExpSpentBy(exp.spentBy);
    setNewExpPaidVia(exp.paidVia);
    setNewExpNotes(exp.notes || '');
    setShowAddExpenseModal(true);
  };

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpTitle.trim() || !newExpAmount || Number(newExpAmount) <= 0) {
      showToast('Enter a valid expense title and amount.', { variant: 'error' });
      return;
    }
    const finalCategory = newExpCategory || 'Miscellaneous';
    const finalSpentBy = newExpSpentBy.trim() || 'Owner';
    const categoryId = expenseCategories.find((item) => item.name.toLowerCase() === finalCategory.toLowerCase())?.id
      || expenseCategories.find((item) => item.name.toLowerCase() === 'office')?.id
      || expenseCategories.find((item) => item.name.toLowerCase() === 'miscellaneous')?.id
      || expenseCategories[0]?.id;
    if (!categoryId) {
      showToast('No backend expense category is available. Create an expense category first.', { variant: 'error' });
      return;
    }
    const nextExpense: OfficeExpense = {
      id: editingExpense?.id || '',
      title: newExpTitle.trim(),
      amount: Number(newExpAmount),
      category: finalCategory,
      expenseDate: newExpDate || new Date().toISOString().split('T')[0],
      spentBy: finalSpentBy,
      paidVia: newExpPaidVia,
      notes: newExpNotes.trim() || undefined,
      monthYear: newExpDate ? newExpDate.substring(0, 7) : new Date().toISOString().slice(0, 7),
    };

    const request = editingExpense
      ? expenseService.update(editingExpense.id, officeExpenseToExpense(nextExpense), categoryId)
      : expenseService.create(officeExpenseToExpense(nextExpense), categoryId);

    void request
      .then(async () => {
        await refreshOfficeExpenses();
        showToast(editingExpense ? 'Expense updated successfully.' : 'Expense added successfully.');
        setShowAddExpenseModal(false);
        setEditingExpense(null);
        setNewExpTitle('');
        setNewExpAmount('');
        setNewExpNotes('');
        setCustomExpCategory('');
        setCustomExpSpentBy('');
        if (isAddExpensePage) router.push('/dashboard');
      })
      .catch(() => showToast('Expense could not be saved to the server.', { variant: 'error' }));
  };

  // State for Confirm Delete Modal
  const [expenseToDelete, setExpenseToDelete] = useState<OfficeExpense | null>(null);

  const confirmDeleteExpense = (deletedItem: OfficeExpense) => {
    void expenseService.remove(deletedItem.id)
      .then(async () => {
        await refreshOfficeExpenses();
        showToast(`Expense "${deletedItem.title}" (₹${deletedItem.amount.toLocaleString('en-IN')}) deleted.`);
      })
      .catch(() => showToast('Expense could not be deleted from the server.', { variant: 'error' }));
  };

  // Date Range Filter State for Financial Ledger (Defaulting to All Time)
  const [finFromDate, setFinFromDate] = useState<string>('');
  const [finToDate, setFinToDate] = useState<string>('');

  // Date Formatting Helper: YYYY-MM-DD -> DD-MM-YYYY
  const formatDateDots = (dateStr: string) => {
    if (!dateStr) return 'ALL';
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
      }
    }
    return dateStr;
  };

  // Helper to check if a date string falls inside [startDate, endDate]
  const isDateInRange = (dateStr: string, startDate: string, endDate: string) => {
    if (!startDate && !endDate) return true;
    if (!dateStr || dateStr === 'N/A') return false;

    let norm = dateStr.trim().replace(/\//g, '-');
    const parts = norm.split('-');
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        norm = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      } else if (parts[0].length === 4) {
        norm = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    }

    if (startDate && norm < startDate) return false;
    if (endDate && norm > endDate) return false;
    return true;
  };

  // Calculate Monthly Payments Received from Projects (Client Collections Ledger)
  const clientPaymentLogs = React.useMemo(() => {
    const list: {
      id: string;
      clientTitle: string;
      amount: number;
      date: string;
      mode: string;
      type: string;
      receiptNumber?: string;
    }[] = [];

    projects.forEach((p) => {
      if (p.payments && p.payments.length > 0) {
        p.payments.forEach((pay) => {
          list.push({
            id: pay.id,
            clientTitle: p.clientWeddingTitle,
            amount: pay.amount || 0,
            date: pay.date || 'N/A',
            mode: pay.paymentMode || 'UPI / GPay',
            type: pay.type === 'advance' ? 'Advance Payment' : pay.type === 'installment' ? 'Installment' : pay.type === 'settlement' ? 'Final Settlement' : 'Client Payment',
            receiptNumber: pay.receiptNumber,
          });
        });
      }
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [projects]);

  // Filtered Client Payments & Office Expenses by Date Range
  const filteredClientPaymentLogs = React.useMemo(() => {
    return clientPaymentLogs.filter((pay) => isDateInRange(pay.date, finFromDate, finToDate));
  }, [clientPaymentLogs, finFromDate, finToDate]);

  const filteredOfficeExpenses = React.useMemo(() => {
    return officeExpenses
      .filter((exp) => isDateInRange(exp.expenseDate, finFromDate, finToDate))
      .filter((exp) => expenseCategoryFilter === 'all' || exp.category === expenseCategoryFilter)
      .filter((exp) => expenseSpentByFilter === 'all' || exp.spentBy === expenseSpentByFilter);
  }, [officeExpenses, finFromDate, finToDate, expenseCategoryFilter, expenseSpentByFilter]);

  const totalMonthlyPaymentsReceived = React.useMemo(() => {
    return filteredClientPaymentLogs.reduce((acc, item) => acc + item.amount, 0);
  }, [filteredClientPaymentLogs]);

  const totalMonthlyExpenses = React.useMemo(() => {
    return filteredOfficeExpenses.reduce((acc, exp) => acc + exp.amount, 0);
  }, [filteredOfficeExpenses]);

  // KPI figures come from the aggregated summary, which arrives before the
  // project list and counts every project rather than the first page of 100.
  const byStatus = summary?.projectsByStatus;
  const statusCount = (...statuses: string[]) =>
    statuses.reduce((acc, status) => acc + (byStatus?.[status] ?? 0), 0);

  const totalRevenue = summary?.finance
    ? summary.finance.quoted
    : projects.reduce((acc, p) => acc + (p.totalBudget || 0), 0);
  const totalAdvanceReceived = summary?.finance
    ? summary.finance.received
    : projects.reduce((acc, p) => acc + (p.payments || []).reduce((sum, payment) => sum + (payment.amount || 0), 0), 0);
  const totalBalanceDue = summary?.finance
    ? summary.finance.outstanding
    : projects.reduce((acc, p) => acc + (p.balanceDue || 0), 0);

  const allProjectsCount = summary ? summary.stats.projects : projects.length;
  const readyToDeliverCount = byStatus
    ? statusCount('DELIVERY')
    : projects.filter(p => p.status === 'ready_to_deliver').length;
  const deliveredProjectsCount = byStatus
    ? statusCount('COMPLETED')
    : projects.filter(p => p.status === 'completed').length;
  const pendingProjectsCount = byStatus
    ? statusCount('CANCELLED')
    : projects.filter(p => p.status === 'pending').length;
  const runningProjectsCount = byStatus
    ? statusCount('CONFIRMED', 'PLANNING', 'SHOOTING', 'EDITING')
    : projects.filter(p => p.status === 'running').length;
  const urgentProjectsCount = projects.filter(p => p.status === 'urgent').length;

  const upcomingShoots = React.useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return projects.flatMap((project) => (project.shoots || []).map((shoot) => ({ ...shoot, projectId: project.id, clientTitle: project.clientWeddingTitle })))
      .filter((shoot) => shoot.date >= today && shoot.status !== 'cancelled')
      .sort((a, b) => `${a.date} ${a.startTime || a.time || ''}`.localeCompare(`${b.date} ${b.startTime || b.time || ''}`))
      .slice(0, 4);
  }, [projects]);

  const isEditor = currentUser?.role === 'Video Editor' || 
                   currentUser?.role === 'Photo Editor' || 
                   currentUser?.role === 'Cinematographer' || 
                   currentUser?.role === 'Lead Photographer' || 
                   (!!currentUser?.role && currentUser.role.toLowerCase().includes('editor'));

  if (isAddExpensePage) {
    return (
      <ExpenseModals open variant="page" setOpen={(open) => { if (!open) router.push('/dashboard'); }} editingExpense={editingExpense} setEditingExpense={setEditingExpense} onSubmit={handleAddExpenseSubmit} title={newExpTitle} setTitle={setNewExpTitle} amount={newExpAmount} setAmount={setNewExpAmount} category={newExpCategory} setCategory={setNewExpCategory} date={newExpDate} setDate={setNewExpDate} spentBy={newExpSpentBy} setSpentBy={setNewExpSpentBy} paidVia={newExpPaidVia} setPaidVia={setNewExpPaidVia} notes={newExpNotes} setNotes={setNewExpNotes} expenseToDelete={expenseToDelete} setExpenseToDelete={setExpenseToDelete} confirmDelete={confirmDeleteExpense} />
    );
  }

  return (
    <div className="space-y-7 pb-10">
      
      <DashboardHeader currentUserName={currentUser?.name} />
      <DashboardOnboarding state={{ emailVerified: (currentUser as { emailVerified?: boolean } | null | undefined)?.emailVerified !== false, hasProjects: allProjectsCount > 0, hasTeam: team.length > 1 }} />
      {can('dashboard.view_alerts') && <DashboardSecurityAlerts team={team} onTeam={() => setActiveTab('team')} />}
      <DashboardKpiGrid showRevenue={can('dashboard.view_financial')} showKpi={can('dashboard.view_kpi')} totalRevenue={totalRevenue} totalAdvanceReceived={totalAdvanceReceived} totalBalanceDue={totalBalanceDue} allProjectsCount={allProjectsCount} runningProjectsCount={runningProjectsCount} readyToDeliverCount={readyToDeliverCount} deliveredProjectsCount={deliveredProjectsCount} pendingProjectsCount={pendingProjectsCount} urgentProjectsCount={urgentProjectsCount} onPayments={onOpenAllPaymentsModal} onProjects={() => setActiveTab('projects')} onCompleted={() => onProjectStatusNavigate?.('completed')} onUrgent={() => onProjectStatusNavigate?.('urgent')} />
      {attendanceSlot}
      {can('dashboard.view_quick_actions') && <QuickActionsPanel />}
      {can('dashboard.view_kpi') && <DashboardCharts showFinancial={can('dashboard.view_financial')} />}
      {(can('dashboard.view_projects') || can('dashboard.view_upcoming')) && (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-3">
          {can('dashboard.view_projects') && (
            <div className={can('dashboard.view_upcoming') && can('shoots.view') ? 'xl:col-span-2' : 'xl:col-span-3'}>
              {projectsPending ? (
                <PanelSkeleton title="Project deadlines" rows={4} />
              ) : (
                <ClientProjectsDeadlines projects={projects} isEditor={isEditor} onSelect={onSelectProject} onViewAll={() => setActiveTab('projects')} />
              )}
            </div>
          )}
          {can('dashboard.view_upcoming') && can('shoots.view') && <UpcomingShoots shoots={upcomingShoots} onOpen={() => setActiveTab('shoots')} />}
        </div>
      )}


      {can('dashboard.view_financial') && (
        <>
          <FinancialFilterBar fromDate={finFromDate} toDate={finToDate} setFromDate={setFinFromDate} setToDate={setFinToDate} />
          <MonthlyProfitLoss fromDate={finFromDate} toDate={finToDate} totalPayments={totalMonthlyPaymentsReceived} paymentCount={filteredClientPaymentLogs.length} totalExpenses={totalMonthlyExpenses} totalPaidPayroll={totalPaidPayroll} formatDate={formatDateDots} onAddExpense={() => router.push('/expenses/new')} onRecordPayment={() => router.push('/payments/new')} />
          <div className="grid grid-cols-1 items-start gap-5 pt-1 xl:grid-cols-3">
            <div className="grid min-w-0 gap-5 xl:col-span-2 xl:grid-cols-2">
              <MonthlyPayments payments={filteredClientPaymentLogs} totalReceived={totalMonthlyPaymentsReceived} totalRevenue={totalRevenue} fromDate={finFromDate} toDate={finToDate} formatDate={formatDateDots} onRecordPayment={() => setActiveTab('expenses')} />
              <MonthlyOfficeExpenses expenses={filteredOfficeExpenses} allExpenses={officeExpenses} totalExpenses={totalMonthlyExpenses} totalPaidPayroll={totalPaidPayroll} categoryFilter={expenseCategoryFilter} setCategoryFilter={setExpenseCategoryFilter} spentByFilter={expenseSpentByFilter} setSpentByFilter={setExpenseSpentByFilter} fromDate={finFromDate} toDate={finToDate} formatDate={formatDateDots} onAdd={() => setActiveTab('expenses')} onEdit={handleOpenEditExpense} onDelete={setExpenseToDelete} />
            </div>
            <MonthlyStaffSalary records={salaryRecords} totalMonthlyPayroll={totalMonthlyPayroll} totalPaidPayroll={totalPaidPayroll} totalPendingPayroll={totalPendingPayroll} onTeam={() => setActiveTab('team')} onEdit={handleOpenEditModal} />
          </div>
        </>
      )}

      {can('dashboard.view_team') && (teamPending ? (
        <PanelSkeleton title="Team activity" rows={5} />
      ) : (
        <TeamActivity
          team={team}
          attendance={attendance}
          tasks={tasks}
          projects={projects}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onAddTask={onAddTask}
          onOpenMemberModal={onOpenMemberModal}
        />
      ))}

      <SalaryPaymentModal member={editingSalaryMember} close={() => setEditingSalaryMember(null)} editPaidAmount={editPaidAmount} setEditPaidAmount={setEditPaidAmount} selectedSalaryMonth={selectedSalaryMonth} setSelectedSalaryMonth={setSelectedSalaryMonth} attendanceLogs={memberAttendanceLogs} presentDays={presentDays} halfDays={halfDays} absentDays={absentDays} attendanceEarnedPay={attendanceEarnedPay} estimatedDailyRate={estimatedDailyRate} pendingAttendanceBalance={pendingAttendanceBalance} pendingBaseBalance={pendingBaseBalance} installments={editInstallments} setInstallments={setEditInstallments} addInstallment={handleAddInstallment} removeInstallment={handleRemoveInstallment} changeInstallment={handleInstallmentChange} save={handleSaveMemberSalary} />

      <ExpenseModals open={showAddExpenseModal} setOpen={setShowAddExpenseModal} editingExpense={editingExpense} setEditingExpense={setEditingExpense} onSubmit={handleAddExpenseSubmit} title={newExpTitle} setTitle={setNewExpTitle} amount={newExpAmount} setAmount={setNewExpAmount} category={newExpCategory} setCategory={setNewExpCategory} date={newExpDate} setDate={setNewExpDate} spentBy={newExpSpentBy} setSpentBy={setNewExpSpentBy} paidVia={newExpPaidVia} setPaidVia={setNewExpPaidVia} notes={newExpNotes} setNotes={setNewExpNotes} expenseToDelete={expenseToDelete} setExpenseToDelete={setExpenseToDelete} confirmDelete={confirmDeleteExpense} />
    </div>

  );
};
