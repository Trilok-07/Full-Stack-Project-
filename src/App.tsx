import { useEffect, useMemo, useState } from 'react';
import { FileCode2, Moon, RotateCcw, Sun, Undo2 } from 'lucide-react';
import {
  Category,
  DEFAULT_MONTHLY_BUDGET,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  PaymentMode,
  STORAGE_KEYS,
  Transaction,
  TransactionType,
  createSeedTransactions,
  getCurrentMonthKey,
} from './types/ledger';
import {
  calculateMetrics,
  computeCategoryBreakdown,
  exportTransactionsToCsv,
  formatMonthLabel,
} from './utils/calculations';
import { downloadStandaloneHtmlFile } from './utils/standaloneHtmlGenerator';
import { KpiStrip } from './components/KpiStrip';
import { BudgetProgressCard } from './components/BudgetProgressCard';
import { RecordForm } from './components/RecordForm';
import { DonutChart } from './components/DonutChart';
import { ExpenseLedgerTable } from './components/ExpenseLedgerTable';
import { VivaDocsModal } from './components/VivaDocsModal';

function loadInitialTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as Transaction[];
      }
    }
  } catch {
    // Fallback to seed transactions on malformed storage
  }
  return createSeedTransactions();
}

function loadInitialBudget(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BUDGET);
    if (raw) {
      const num = Number(raw);
      if (Number.isFinite(num) && num >= 100) return num;
    }
  } catch {
    // Ignore storage error
  }
  return DEFAULT_MONTHLY_BUDGET;
}

function loadInitialTheme(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
  } catch {
    // Ignore storage error
  }
  return document.documentElement.classList.contains('dark');
}

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(
    loadInitialTransactions
  );
  const [monthlyBudget, setMonthlyBudget] = useState<number>(loadInitialBudget);
  const [isDark, setIsDark] = useState<boolean>(loadInitialTheme);

  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentMode>('all');

  const [editingRecord, setEditingRecord] = useState<Transaction | null>(null);
  const [isVivaOpen, setIsVivaOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    undoRecord?: Transaction;
  } | null>(null);

  // Sync transactions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.TRANSACTIONS,
        JSON.stringify(transactions)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [transactions]);

  // Sync budget to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGET, String(monthlyBudget));
    } catch {
      // Ignore storage quota errors
    }
  }, [monthlyBudget]);

  // Sync dark mode class on <html> and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage error
    }
  }, [isDark]);

  // Auto-dismiss feedback toast
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>([getCurrentMonthKey()]);
    for (const t of transactions) {
      if (t.date && t.date.length >= 7) {
        set.add(t.date.slice(0, 7));
      }
    }
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const periodTransactions = useMemo(() => {
    if (selectedMonth === 'all') return transactions;
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const metrics = useMemo(
    () => calculateMetrics(periodTransactions, monthlyBudget, selectedMonth),
    [periodTransactions, monthlyBudget, selectedMonth]
  );

  const categorySlices = useMemo(
    () => computeCategoryBreakdown(periodTransactions),
    [periodTransactions]
  );

  const expenseCount = useMemo(
    () => periodTransactions.filter((t) => t.type === 'expense').length,
    [periodTransactions]
  );

  const incomeCount = periodTransactions.length - expenseCount;

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return periodTransactions
      .filter((t) => {
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
        if (paymentFilter !== 'all' && t.paymentMode !== paymentFilter) return false;
        if (q) {
          const match =
            t.title.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q) ||
            t.paymentMode.toLowerCase().includes(q) ||
            (t.note && t.note.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateCmp = b.date.localeCompare(a.date);
        if (dateCmp !== 0) return dateCmp;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [periodTransactions, searchQuery, typeFilter, categoryFilter, paymentFilter]);

  const selectedDonutCategory: ExpenseCategory | null =
    categoryFilter !== 'all' &&
    EXPENSE_CATEGORIES.includes(categoryFilter as ExpenseCategory)
      ? (categoryFilter as ExpenseCategory)
      : null;

  const handleSaveRecord = (
    payload: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setTransactions((prev) =>
        prev.map((item) =>
          item.id === existingId ? { ...item, ...payload } : item
        )
      );
      setEditingRecord(null);
      setToast({ message: `Updated "${payload.title}".` });
    } else {
      const newRecord: Transaction = {
        ...payload,
        id: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [newRecord, ...prev]);
      const recordMonth = payload.date.slice(0, 7);
      if (selectedMonth !== 'all' && recordMonth !== selectedMonth) {
        setSelectedMonth(recordMonth);
      }
      setToast({
        message:
          payload.type === 'income'
            ? `Added pocket money credit "${payload.title}".`
            : `Recorded student expense "${payload.title}".`,
      });
    }
  };

  const handleEditRecord = (txn: Transaction) => {
    setEditingRecord(txn);
    const formEl = document.getElementById('add-record');
    formEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleDeleteRecord = (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (!target) return;
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (editingRecord?.id === id) {
      setEditingRecord(null);
    }
    setToast({
      message: `Deleted "${target.title}".`,
      undoRecord: target,
    });
  };

  const handleUndoDelete = () => {
    if (!toast?.undoRecord) return;
    const restored = toast.undoRecord;
    setTransactions((prev) => [restored, ...prev]);
    setToast({ message: `Restored "${restored.title}".` });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setPaymentFilter('all');
  };

  const handleResetDemoData = () => {
    const freshSeed = createSeedTransactions();
    setTransactions(freshSeed);
    setMonthlyBudget(DEFAULT_MONTHLY_BUDGET);
    setSelectedMonth(getCurrentMonthKey());
    setEditingRecord(null);
    handleClearFilters();
    setConfirmReset(false);
    setToast({ message: 'Sample student ledger restored.' });
  };

  const handleFocusAddForm = () => {
    const input = document.getElementById('record-title');
    input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input?.focus();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Bar Contract: 3 strict zones */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#overview"
            className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap shrink-0"
          >
            CampusLedger
          </a>

          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400"
          >
            <a
              href="#overview"
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              Overview
            </a>
            <a
              href="#budget"
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              Budget
            </a>
            <a
              href="#analytics"
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              Breakdown
            </a>
            <a
              href="#ledger"
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0"
            >
              Ledger
            </a>
          </nav>

          <button
            type="button"
            onClick={() => setIsVivaOpen(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Viva &amp; API Docs
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main
        id="overview"
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6"
      >
        {/* Workspace Toolbar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 text-balance">
              Student Expense &amp; Allowance Tracker
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Monitor pocket money, campus expenses, category share, and daily safe spend across the semester.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <label htmlFor="period-select" className="sr-only">
              Select Month
            </label>
            <select
              id="period-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
              <option value="all">All Time</option>
            </select>

            <button
              type="button"
              onClick={downloadStandaloneHtmlFile}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Download self-contained single-file HTML5 + Tailwind CDN + Vanilla JS submission"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              Single-File HTML
            </button>

            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5" />
                  Dark Mode
                </>
              )}
            </button>
          </div>
        </div>

        {/* 1. Four KPI Cards */}
        <KpiStrip
          metrics={metrics}
          transactionCount={periodTransactions.length}
          expenseCount={expenseCount}
          incomeCount={incomeCount}
        />

        {/* 2. Editable Monthly Student Budget Limit & Daily Safe Spend */}
        <BudgetProgressCard
          metrics={metrics}
          monthKey={selectedMonth}
          onUpdateBudget={(newLimit) => {
            setMonthlyBudget(newLimit);
            setToast({ message: `Monthly budget updated to ₹${newLimit.toLocaleString('en-IN')}.` });
          }}
        />

        {/* 3 & 4. Add/Edit Student Record Form + Interactive HTML5 Canvas Donut Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5">
            <RecordForm
              editingRecord={editingRecord}
              onSave={handleSaveRecord}
              onCancelEdit={() => setEditingRecord(null)}
            />
          </div>
          <div className="lg:col-span-7">
            <DonutChart
              slices={categorySlices}
              totalSpent={metrics.totalSpent}
              selectedCategory={selectedDonutCategory}
              onSelectCategory={(cat) => {
                setCategoryFilter(cat ?? 'all');
                if (cat) setTypeFilter('expense');
              }}
              isDark={isDark}
            />
          </div>
        </div>

        {/* 5. Searchable & Filterable Student Expense Ledger */}
        <ExpenseLedgerTable
          transactions={filteredTransactions}
          totalInPeriod={periodTransactions.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          paymentFilter={paymentFilter}
          onPaymentFilterChange={setPaymentFilter}
          onClearFilters={handleClearFilters}
          onEdit={handleEditRecord}
          onDelete={handleDeleteRecord}
          onExportCsv={() => {
            exportTransactionsToCsv(filteredTransactions);
            setToast({
              message: `Exported ${filteredTransactions.length} records to CSV.`,
            });
          }}
          onFocusAddForm={handleFocusAddForm}
          editingId={editingRecord?.id ?? null}
        />
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-display font-semibold text-slate-700 dark:text-slate-300">
              CampusLedger
            </span>
            <span aria-hidden="true">·</span>
            <span>Stored locally in browser localStorage</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsVivaOpen(true)}
              className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              API &amp; Schema Docs
            </button>

            {confirmReset ? (
              <span className="inline-flex items-center gap-2">
                <span className="text-slate-600 dark:text-slate-300">Restore sample data?</span>
                <button
                  type="button"
                  onClick={handleResetDemoData}
                  className="font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="hover:underline cursor-pointer"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Sample Data
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Viva & API Docs Modal */}
      <VivaDocsModal
        isOpen={isVivaOpen}
        onClose={() => setIsVivaOpen(false)}
        transactions={transactions}
        monthlyBudget={monthlyBudget}
      />

      {/* Non-intrusive Action Feedback / Undo Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium shadow-lg"
        >
          <span>{toast.message}</span>
          {toast.undoRecord && (
            <button
              type="button"
              onClick={handleUndoDelete}
              className="inline-flex items-center gap-1 font-semibold text-blue-300 dark:text-blue-700 hover:underline cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
