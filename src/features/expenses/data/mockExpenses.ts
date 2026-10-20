import { Expense, ExpenseBudget, RecurringExpense } from '../types';

export const INITIAL_EXPENSES: Expense[] = [
  { id: 'EXP-2026-0812', date: '2026-08-12', category: 'Freelancer', subcategory: 'Photographer payment', description: 'Lead photographer day fee', amount: 25000, paidAmount: 10000, projectId: '2', payee: 'Rahul Sharma', role: 'Photographer', paymentMethod: 'Bank Transfer', paymentStatus: 'Partially Paid', approvalStatus: 'Approved', addedBy: 'Alex Morgan', createdAt: '2026-08-12T09:30:00Z', updatedAt: '2026-08-12T09:30:00Z', notes: 'Balance after data handover', payments: [{ id: 'PAY-1', amount: 10000, date: '2026-08-10', method: 'Bank Transfer' }] },
  { id: 'EXP-2026-0811', date: '2026-08-11', category: 'Travel', subcategory: 'Hotel', description: 'Crew hotel — Jaipur wedding', amount: 18000, paidAmount: 18000, projectId: '1', vendor: 'Royal Heritage Hotel', payee: 'Royal Heritage Hotel', paymentMethod: 'Credit Card', paymentStatus: 'Paid', approvalStatus: 'Paid', addedBy: 'Studio Manager', createdAt: '2026-08-11T12:00:00Z', updatedAt: '2026-08-11T12:00:00Z', payments: [{ id: 'PAY-2', amount: 18000, date: '2026-08-11', method: 'Credit Card' }] },
  { id: 'EXP-2026-0808', date: '2026-08-08', category: 'Equipment', subcategory: 'Lens rental', description: 'Sony 70-200mm rental', amount: 12000, paidAmount: 0, projectId: '2', vendor: 'Delhi Camera Rentals', payee: 'Delhi Camera Rentals', paymentMethod: 'UPI', paymentStatus: 'Pending', approvalStatus: 'Submitted', addedBy: 'Yuvraj', createdAt: '2026-08-08T10:00:00Z', updatedAt: '2026-08-08T10:00:00Z', payments: [] },
  { id: 'EXP-2026-0805', date: '2026-08-05', category: 'Office', subcategory: 'Rent', description: 'Studio office rent', amount: 45000, paidAmount: 45000, vendor: 'Galaxy Properties', payee: 'Galaxy Properties', paymentMethod: 'Bank Transfer', paymentStatus: 'Paid', approvalStatus: 'Paid', addedBy: 'Alex Morgan', createdAt: '2026-08-05T08:00:00Z', updatedAt: '2026-08-05T08:00:00Z', payments: [{ id: 'PAY-3', amount: 45000, date: '2026-08-05', method: 'Bank Transfer' }] },
  { id: 'EXP-2026-0728', date: '2026-07-28', category: 'Cab', subcategory: 'Private Cab', description: 'Airport and venue transfers', amount: 8500, paidAmount: 8500, projectId: '1', payee: 'City Cabs', vendor: 'City Cabs', from: 'Jaipur Airport', to: 'Wedding venue', distance: 42, paymentMethod: 'Cash', paymentStatus: 'Paid', approvalStatus: 'Paid', addedBy: 'Studio Manager', createdAt: '2026-07-28T11:00:00Z', updatedAt: '2026-07-28T11:00:00Z', payments: [{ id: 'PAY-4', amount: 8500, date: '2026-07-28', method: 'Cash' }] },
  { id: 'EXP-2026-0715', date: '2026-07-15', category: 'Software', subcategory: 'Adobe', description: 'Creative Cloud subscription', amount: 4800, paidAmount: 4800, vendor: 'Adobe', payee: 'Adobe', paymentMethod: 'Credit Card', paymentStatus: 'Paid', approvalStatus: 'Paid', addedBy: 'Alex Morgan', createdAt: '2026-07-15T08:00:00Z', updatedAt: '2026-07-15T08:00:00Z', payments: [{ id: 'PAY-5', amount: 4800, date: '2026-07-15', method: 'Credit Card' }] },
];

export const INITIAL_RECURRING_EXPENSES: RecurringExpense[] = [
  { id: 'REC-1', name: 'Studio Office Rent', category: 'Office', vendor: 'Galaxy Properties', amount: 45000, frequency: 'Monthly', startDate: '2026-01-01', nextDueDate: '2026-09-05', autoGenerate: true, status: 'Active' },
  { id: 'REC-2', name: 'Adobe Creative Cloud', category: 'Software', vendor: 'Adobe', amount: 4800, frequency: 'Monthly', startDate: '2026-01-15', nextDueDate: '2026-09-15', autoGenerate: true, status: 'Active' },
  { id: 'REC-3', name: 'Cloud Backup', category: 'Software', vendor: 'Google Workspace', amount: 2200, frequency: 'Monthly', startDate: '2026-02-01', nextDueDate: '2026-09-01', autoGenerate: true, status: 'Active' },
];

export const INITIAL_EXPENSE_BUDGETS: ExpenseBudget[] = [
  { id: 'BUD-1', month: '2026-08', category: 'Overall', amount: 500000 },
  { id: 'BUD-2', month: '2026-08', category: 'Shoot', amount: 220000 },
  { id: 'BUD-3', month: '2026-08', category: 'Freelancer', amount: 150000 },
  { id: 'BUD-4', month: '2026-08', category: 'Travel', amount: 60000 },
];
