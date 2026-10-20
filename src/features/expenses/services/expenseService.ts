import { apiRequest } from '@/lib/api/client';
import { Expense, ExpenseBudget, RecurringExpense } from '../types';
import { INITIAL_EXPENSE_BUDGETS, INITIAL_RECURRING_EXPENSES } from '../data/mockExpenses';
import { BRAND } from '@/config/brand';

const RECURRING_KEY = `${BRAND.cookiePrefix}_crm_recurring_expenses_v1`;
const BUDGETS_KEY = `${BRAND.cookiePrefix}_crm_expense_budgets_v1`;

interface BackendExpensePayment {
  id: string;
  amount: string | number;
  paidAt: string;
  method?: string | null;
  note?: string | null;
}

interface BackendExpense {
  id: string;
  expenseDate: string;
  category?: { id: string; name: string } | null;
  subcategory?: string | null;
  description?: string | null;
  amount: string | number;
  paidAmount?: string | number | null;
  projectId?: string | null;
  shootId?: string | null;
  vendor?: string | null;
  freelancerId?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: 'Paid' | 'Partial' | 'Unpaid' | string | null;
  approvalStatus?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | string | null;
  createdBy?: { fullName: string } | null;
  createdAt: string;
  updatedAt: string;
  notes?: string | null;
  payments?: BackendExpensePayment[];
}

export interface ExpenseSummary {
  month?: { total?: string | number };
  year?: { total?: string | number };
  total?: string | number;
  approved?: string | number;
  pending?: string | number;
  categories?: Array<{ category: string; _sum?: { amount?: string | number | null } }>;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; }
}

export const expenseService = {
  list: async (): Promise<Expense[]> => (await apiRequest<BackendExpense[]>('/expenses?limit=100')).data.map(toFrontendExpense),
  categories: async () => (await apiRequest<Array<{id:string;name:string}>>('/expenses/categories')).data,
  create: async (expense: Expense, categoryId: string) => toFrontendExpense((await apiRequest<BackendExpense>('/expenses', { method:'POST', body:JSON.stringify(toBackend(expense,categoryId)) })).data),
  update: async (id: string, expense: Expense, categoryId: string) => toFrontendExpense((await apiRequest<BackendExpense>(`/expenses/${id}`, { method:'PATCH', body:JSON.stringify(toBackend(expense,categoryId)) })).data),
  remove: async (id:string) => { await apiRequest<void>(`/expenses/${id}`, {method:'DELETE'}); },
  addPayment: async (id:string, amount:number, paymentMethod:string) => toFrontendExpense((await apiRequest<BackendExpense>(`/expenses/${id}/payments`, {method:'POST',body:JSON.stringify({amount,paidAt:new Date().toISOString().slice(0,10),method:paymentMethod.replace(' ','_').toUpperCase()})})).data),
  summary: async () => (await apiRequest<ExpenseSummary>('/expenses/summary')).data,
  recurring: () => read<RecurringExpense[]>(RECURRING_KEY, INITIAL_RECURRING_EXPENSES),
  saveRecurring: (items: RecurringExpense[]) => localStorage.setItem(RECURRING_KEY, JSON.stringify(items)),
  budgets: () => read<ExpenseBudget[]>(BUDGETS_KEY, INITIAL_EXPENSE_BUDGETS),
  saveBudgets: (items: ExpenseBudget[]) => localStorage.setItem(BUDGETS_KEY, JSON.stringify(items)),
};

const method=(v?:string):Expense['paymentMethod']=>({BANK_TRANSFER:'Bank Transfer',CREDIT_CARD:'Credit Card',DEBIT_CARD:'Debit Card'}[v||'']||v||'Cash') as Expense['paymentMethod'];
export const toFrontendExpense=(e:BackendExpense):Expense=>({id:e.id,date:String(e.expenseDate).slice(0,10),category:(e.category?.name||'Other') as Expense['category'],subcategory:e.subcategory||'Other',description:e.description||'',amount:Number(e.amount),paidAmount:Number(e.paidAmount||0),projectId:e.projectId||undefined,shootId:e.shootId||undefined,payee:e.vendor||undefined,vendor:e.vendor||undefined,freelancerId:e.freelancerId||undefined,paymentMethod:method(e.paymentMethod ?? undefined),paymentStatus:e.paymentStatus==='Partial'?'Partially Paid':e.paymentStatus==='Paid'?'Paid':'Unpaid',approvalStatus:({DRAFT:'Draft',SUBMITTED:'Submitted',APPROVED:'Approved',REJECTED:'Rejected'}[e.approvalStatus || '']||'Draft') as Expense['approvalStatus'],addedBy:e.createdBy?.fullName||'',createdAt:e.createdAt,updatedAt:e.updatedAt,notes:e.notes||undefined,payments:(e.payments||[]).map((p)=>({id:p.id,amount:Number(p.amount),date:String(p.paidAt).slice(0,10),method:method(p.method ?? undefined),note:p.note ?? undefined}))});
export const toBackendExpensePayload=toBackend;
function toBackend(e:Expense,categoryId:string){return {categoryId,amount:e.amount,expenseDate:e.date,subcategory:e.subcategory||undefined,vendor:e.payee||e.vendor||undefined,projectId:e.projectId||undefined,shootId:e.shootId||undefined,freelancerId:e.freelancerId||undefined,paymentMethod:e.paymentMethod.replace(' ','_').toUpperCase(),description:e.description||undefined,submit:true};}
