import { CATEGORY_COLORS, EXPENSE_CATEGORIES, ExpenseCategory, Transaction } from '../types/ledger';

export type BudgetStatus = 'safe' | 'warning' | 'danger';

export interface MonthlyMetrics {
  totalIncome: number;
  totalSpent: number;
  walletBalance: number;
  budgetLimit: number;
  remainingBudget: number;
  budgetUsedPercent: number;
  budgetStatus: BudgetStatus;
  remainingDaysInMonth: number;
  totalDaysInMonth: number;
  dailySafeSpend: number;
  savingsRate: number;
}

export interface CategorySlice {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  count: number;
  color: string;
}

export function formatINR(amount: number): string {
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(abs);
  return `${isNegative ? '-' : ''}₹${formatted}`;
}

export function formatShortDate(isoDate: string): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return isoDate;
  const dt = new Date(parts[0], parts[1] - 1, parts[2]);
  return dt.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMonthLabel(monthKey: string): string {
  if (monthKey === 'all') return 'All Time';
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  const dt = new Date(y, m - 1, 1);
  return dt.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function getRemainingDaysForMonth(monthKey: string): {
  remainingDays: number;
  totalDays: number;
} {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const today = now.getDate();

  let targetYear = currentYear;
  let targetMonth = currentMonth;

  if (monthKey !== 'all') {
    const [y, m] = monthKey.split('-').map(Number);
    if (y && m) {
      targetYear = y;
      targetMonth = m;
    }
  }

  const totalDays = new Date(targetYear, targetMonth, 0).getDate();

  if (targetYear === currentYear && targetMonth === currentMonth) {
    // Include today as a spendable day remaining in the month
    const remainingDays = Math.max(1, totalDays - today + 1);
    return { remainingDays, totalDays };
  }

  // Past month: 1 day floor so division stays safe; Future month: full days
  if (
    targetYear < currentYear ||
    (targetYear === currentYear && targetMonth < currentMonth)
  ) {
    return { remainingDays: 1, totalDays };
  }

  return { remainingDays: totalDays, totalDays };
}

export function calculateMetrics(
  transactions: Transaction[],
  budgetLimit: number,
  monthKey: string
): MonthlyMetrics {
  let totalIncome = 0;
  let totalSpent = 0;

  for (const t of transactions) {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalSpent += t.amount;
    }
  }

  const walletBalance = totalIncome - totalSpent;
  const safeBudget = Math.max(0, budgetLimit);
  const remainingBudget = safeBudget - totalSpent;
  const budgetUsedPercent =
    safeBudget > 0 ? (totalSpent / safeBudget) * 100 : totalSpent > 0 ? 100 : 0;

  let budgetStatus: BudgetStatus = 'safe';
  if (budgetUsedPercent >= 90) {
    budgetStatus = 'danger';
  } else if (budgetUsedPercent >= 70) {
    budgetStatus = 'warning';
  }

  const { remainingDays, totalDays } = getRemainingDaysForMonth(monthKey);
  const dailySafeSpend =
    remainingBudget > 0 ? remainingBudget / remainingDays : 0;

  const savingsRate =
    totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0;

  return {
    totalIncome,
    totalSpent,
    walletBalance,
    budgetLimit: safeBudget,
    remainingBudget,
    budgetUsedPercent,
    budgetStatus,
    remainingDaysInMonth: remainingDays,
    totalDaysInMonth: totalDays,
    dailySafeSpend,
    savingsRate,
  };
}

export function computeCategoryBreakdown(transactions: Transaction[]): CategorySlice[] {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

  if (totalExpenses <= 0) return [];

  const map = new Map<ExpenseCategory, { amount: number; count: number }>();

  for (const txn of expenses) {
    const cat = txn.category as ExpenseCategory;
    if (!EXPENSE_CATEGORIES.includes(cat)) continue;
    const prev = map.get(cat) ?? { amount: 0, count: 0 };
    map.set(cat, { amount: prev.amount + txn.amount, count: prev.count + 1 });
  }

  const slices: CategorySlice[] = [];
  for (const [category, data] of map.entries()) {
    slices.push({
      category,
      amount: data.amount,
      count: data.count,
      percentage: (data.amount / totalExpenses) * 100,
      color: CATEGORY_COLORS[category],
    });
  }

  return slices.sort((a, b) => b.amount - a.amount);
}

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportTransactionsToCsv(
  transactions: Transaction[],
  filenamePrefix = 'CampusLedger_Expenses'
): void {
  const headers = [
    'ID',
    'Date',
    'Title',
    'Type',
    'Category',
    'Payment Mode',
    'Amount (INR)',
    'Note',
  ];

  const rows = transactions.map((t) => [
    escapeCsvCell(t.id),
    escapeCsvCell(t.date),
    escapeCsvCell(t.title),
    escapeCsvCell(t.type === 'income' ? 'Pocket Money / Income' : 'Student Expense'),
    escapeCsvCell(t.category),
    escapeCsvCell(t.paymentMode),
    escapeCsvCell(t.type === 'expense' ? -Math.abs(t.amount) : Math.abs(t.amount)),
    escapeCsvCell(t.note ?? ''),
  ]);

  const csvContent =
    '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `${filenamePrefix}_${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
