export type TransactionType = 'expense' | 'income';

export type ExpenseCategory =
  | 'Food & Canteen'
  | 'Hostel & Rent'
  | 'Books & Stationery'
  | 'Travel & Metro'
  | 'College Fees'
  | 'Recharge & Wi-Fi'
  | 'Outing & Hangout';

export type IncomeCategory =
  | 'Monthly Allowance'
  | 'Stipend & Freelance'
  | 'Scholarship';

export type Category = ExpenseCategory | IncomeCategory;

export type PaymentMode = 'UPI / GPay' | 'Cash' | 'Debit Card';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: Category;
  paymentMode: PaymentMode;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food & Canteen',
  'Hostel & Rent',
  'Books & Stationery',
  'Travel & Metro',
  'College Fees',
  'Recharge & Wi-Fi',
  'Outing & Hangout',
];

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'Monthly Allowance',
  'Stipend & Freelance',
  'Scholarship',
];

export const ALL_CATEGORIES: Category[] = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
];

export const PAYMENT_MODES: PaymentMode[] = [
  'UPI / GPay',
  'Cash',
  'Debit Card',
];

export const CATEGORY_COLORS: Record<Category, string> = {
  'Food & Canteen': '#2563EB',     // Cobalt Blue
  'Hostel & Rent': '#0D9488',      // Deep Teal
  'Books & Stationery': '#D97706', // Warm Amber
  'Travel & Metro': '#7C3AED',     // Royal Indigo
  'College Fees': '#DC2626',       // Crimson
  'Recharge & Wi-Fi': '#0284C7',   // Cerulean
  'Outing & Hangout': '#DB2777',   // Berry Rose
  'Monthly Allowance': '#16A34A',  // Emerald
  'Stipend & Freelance': '#059669',// Jade
  'Scholarship': '#15803D',        // Forest Green
};

export const STORAGE_KEYS = {
  TRANSACTIONS: 'campusledger_transactions_v1',
  BUDGET: 'campusledger_monthly_budget_v1',
  THEME: 'campusledger_theme_v1',
} as const;

export const DEFAULT_MONTHLY_BUDGET = 12000;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
}

export function getTodayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export function createSeedTransactions(): Transaction[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const maxDay = Math.max(1, Math.min(now.getDate(), 28));

  const dayStr = (offsetFromStart: number) => {
    const d = Math.min(maxDay, Math.max(1, offsetFromStart));
    return `${year}-${pad2(month)}-${pad2(d)}`;
  };

  const created = now.toISOString();

  return [
    {
      id: 'txn_seed_01',
      title: 'Monthly Pocket Money from Home',
      amount: 14000,
      type: 'income',
      category: 'Monthly Allowance',
      paymentMode: 'UPI / GPay',
      date: dayStr(1),
      note: 'Bank transfer for monthly hostel & personal expenses',
      createdAt: created,
    },
    {
      id: 'txn_seed_02',
      title: 'Hostel Mess & Room Share',
      amount: 4500,
      type: 'expense',
      category: 'Hostel & Rent',
      paymentMode: 'UPI / GPay',
      date: dayStr(2),
      note: 'Block B twin-sharing monthly mess dues',
      createdAt: created,
    },
    {
      id: 'txn_seed_03',
      title: 'Web Dev Freelance Mini-Project',
      amount: 3500,
      type: 'income',
      category: 'Stipend & Freelance',
      paymentMode: 'UPI / GPay',
      date: dayStr(4),
      note: 'Landing page build for campus alumni startup',
      createdAt: created,
    },
    {
      id: 'txn_seed_04',
      title: 'DBMS Textbook & Practical Lab Record',
      amount: 840,
      type: 'expense',
      category: 'Books & Stationery',
      paymentMode: 'Debit Card',
      date: dayStr(5),
      note: 'Bookstore near Main Gate + spiral binding',
      createdAt: created,
    },
    {
      id: 'txn_seed_05',
      title: 'Metro Smart Card Recharge',
      amount: 500,
      type: 'expense',
      category: 'Travel & Metro',
      paymentMode: 'UPI / GPay',
      date: dayStr(6),
      note: 'Commute pass for weekday classes',
      createdAt: created,
    },
    {
      id: 'txn_seed_06',
      title: 'Canteen Lunch & Filter Coffee',
      amount: 680,
      type: 'expense',
      category: 'Food & Canteen',
      paymentMode: 'UPI / GPay',
      date: dayStr(8),
      note: 'Week 1–2 campus canteen snacks and meals',
      createdAt: created,
    },
    {
      id: 'txn_seed_07',
      title: 'Prepaid 5G Pack & Hostel Wi-Fi Split',
      amount: 599,
      type: 'expense',
      category: 'Recharge & Wi-Fi',
      paymentMode: 'UPI / GPay',
      date: dayStr(10),
      note: '28-day data plan + router bill share',
      createdAt: created,
    },
    {
      id: 'txn_seed_08',
      title: 'Semester Practical Exam Fee',
      amount: 750,
      type: 'expense',
      category: 'College Fees',
      paymentMode: 'Debit Card',
      date: dayStr(12),
      note: 'University exam portal receipt #EX-4419',
      createdAt: created,
    },
    {
      id: 'txn_seed_09',
      title: 'Weekend Movie & Pizza with Roommates',
      amount: 620,
      type: 'expense',
      category: 'Outing & Hangout',
      paymentMode: 'Cash',
      date: dayStr(14),
      note: 'Split 4 ways after internal assessment',
      createdAt: created,
    },
    {
      id: 'txn_seed_10',
      title: 'Late-Night Canteen Maggi & Tea',
      amount: 260,
      type: 'expense',
      category: 'Food & Canteen',
      paymentMode: 'Cash',
      date: dayStr(Math.min(maxDay, 16)),
      note: 'Study session before lab viva',
      createdAt: created,
    },
  ];
}
