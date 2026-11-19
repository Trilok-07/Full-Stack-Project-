import { MonthlyMetrics, formatINR } from '../utils/calculations';

interface KpiStripProps {
  metrics: MonthlyMetrics;
  transactionCount: number;
  expenseCount: number;
  incomeCount: number;
}

export function KpiStrip({
  metrics,
  expenseCount,
  incomeCount,
}: KpiStripProps) {
  const isNegativeBalance = metrics.walletBalance < 0;

  const dailyStatusColor =
    metrics.budgetStatus === 'danger'
      ? 'text-red-600 dark:text-red-400'
      : metrics.budgetStatus === 'warning'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-emerald-600 dark:text-emerald-400';

  const dailyStatusLabel =
    metrics.remainingBudget <= 0
      ? 'Budget exhausted'
      : `${metrics.remainingDaysInMonth} ${metrics.remainingDaysInMonth === 1 ? 'day' : 'days'} remaining`;

  return (
    <section
      aria-label="Key Financial Metrics"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {/* 1. Wallet Balance */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-3">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Wallet Balance
        </span>
        <div
          className={`font-mono tabular-nums text-2xl font-semibold tracking-tight ${
            isNegativeBalance
              ? 'text-red-600 dark:text-red-400'
              : 'text-slate-900 dark:text-slate-50'
          }`}
        >
          {formatINR(metrics.walletBalance)}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span>
            {metrics.totalIncome > 0
              ? `${Math.max(0, metrics.savingsRate).toFixed(1)}% of inflow unspent`
              : 'Add pocket money to track balance'}
          </span>
        </div>
      </div>

      {/* 2. Pocket Money / Allowance Income */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-3">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Pocket Money &amp; Allowance
        </span>
        <div className="font-mono tabular-nums text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
          +{formatINR(metrics.totalIncome)}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <span>
            {incomeCount} {incomeCount === 1 ? 'credit' : 'credits'} logged
          </span>
        </div>
      </div>

      {/* 3. Total Spent */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-3">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Total Spent
        </span>
        <div className="font-mono tabular-nums text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {formatINR(metrics.totalSpent)}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span className="font-mono tabular-nums">
            {metrics.budgetUsedPercent.toFixed(1)}%
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {expenseCount} {expenseCount === 1 ? 'expense' : 'expenses'}
          </span>
        </div>
      </div>

      {/* 4. Daily Safe Spend */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-3">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Daily Safe Spend
        </span>
        <div
          className={`font-mono tabular-nums text-2xl font-semibold tracking-tight ${dailyStatusColor}`}
        >
          {formatINR(Math.floor(metrics.dailySafeSpend))}
          <span className="text-xs font-sans font-normal text-slate-500 dark:text-slate-400 ml-1">
            /day
          </span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span>{dailyStatusLabel}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">
            {formatINR(Math.max(0, metrics.remainingBudget))} left
          </span>
        </div>
      </div>
    </section>
  );
}
