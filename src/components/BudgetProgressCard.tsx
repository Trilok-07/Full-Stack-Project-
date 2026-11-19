import React, { useState, useEffect } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { MonthlyMetrics, formatINR, formatMonthLabel } from '../utils/calculations';

interface BudgetProgressCardProps {
  metrics: MonthlyMetrics;
  monthKey: string;
  onUpdateBudget: (newLimit: number) => void;
}

export function BudgetProgressCard({
  metrics,
  monthKey,
  onUpdateBudget,
}: BudgetProgressCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(String(metrics.budgetLimit));
  const [error, setError] = useState('');

  useEffect(() => {
    setDraftValue(String(metrics.budgetLimit));
  }, [metrics.budgetLimit]);

  const clampedPercent = Math.min(100, Math.max(0, metrics.budgetUsedPercent));

  const statusMeta = {
    safe: {
      label: 'Within Budget',
      barClass: 'bg-emerald-600 dark:bg-emerald-500',
      textClass: 'text-emerald-700 dark:text-emerald-400',
    },
    warning: {
      label: 'Approaching Limit',
      barClass: 'bg-amber-500 dark:bg-amber-400',
      textClass: 'text-amber-700 dark:text-amber-400',
    },
    danger: {
      label: metrics.remainingBudget < 0 ? 'Over Budget' : 'Critical Limit',
      barClass: 'bg-red-600 dark:bg-red-500',
      textClass: 'text-red-700 dark:text-red-400',
    },
  }[metrics.budgetStatus];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(draftValue);
    if (!Number.isFinite(parsed) || parsed < 100) {
      setError('Enter a monthly limit of at least ₹100.');
      return;
    }
    if (parsed > 10000000) {
      setError('Enter a realistic student monthly budget limit.');
      return;
    }
    setError('');
    onUpdateBudget(Math.round(parsed));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraftValue(String(metrics.budgetLimit));
    setError('');
    setIsEditing(false);
  };

  return (
    <section
      id="budget"
      aria-label="Monthly Student Budget Limit"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
              Monthly Student Budget Limit
            </h2>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
              ·
            </span>
            <span className={`text-xs font-medium ${statusMeta.textClass}`}>
              {statusMeta.label}
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
              ·
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formatMonthLabel(monthKey)}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {metrics.remainingBudget >= 0 ? (
              <>
                You can safely spend{' '}
                <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                  {formatINR(Math.floor(metrics.dailySafeSpend))}
                </span>{' '}
                per day across the remaining{' '}
                <span className="font-mono tabular-nums font-medium text-slate-800 dark:text-slate-200">
                  {metrics.remainingDaysInMonth}
                </span>{' '}
                {metrics.remainingDaysInMonth === 1 ? 'day' : 'days'} of this month.
              </>
            ) : (
              <>
                You have exceeded your monthly cap by{' '}
                <span className="font-mono tabular-nums font-semibold text-red-600 dark:text-red-400">
                  {formatINR(Math.abs(metrics.remainingBudget))}
                </span>
                . Reduce discretionary outings or adjust your allowance limit.
              </>
            )}
          </p>
        </div>

        {/* Editable Monthly Limit Control */}
        <div className="shrink-0">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-2">
                <label htmlFor="monthly-budget-input" className="sr-only">
                  Monthly Budget Limit in INR
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-400">
                    ₹
                  </span>
                  <input
                    id="monthly-budget-input"
                    type="number"
                    min={100}
                    step={100}
                    value={draftValue}
                    onChange={(e) => setDraftValue(e.target.value)}
                    autoFocus
                    className="w-36 pl-7 pr-3 py-1.5 text-sm font-mono tabular-nums rounded-lg border border-blue-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Cancel budget edit"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {error && (
                <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
              )}
            </form>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Monthly Cap
                </div>
                <div className="font-mono tabular-nums text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {formatINR(metrics.budgetLimit)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Limit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-5">
        <div
          role="progressbar"
          aria-valuenow={Math.round(metrics.budgetUsedPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Monthly budget usage percentage"
          className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${statusMeta.barClass}`}
            style={{ width: `${clampedPercent}%` }}
          />
        </div>

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 font-mono tabular-nums">
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              {formatINR(metrics.totalSpent)} spent
            </span>
            <span aria-hidden="true">/</span>
            <span>{formatINR(metrics.budgetLimit)} limit</span>
            <span aria-hidden="true">·</span>
            <span className={statusMeta.textClass}>
              {metrics.budgetUsedPercent.toFixed(1)}% used
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono tabular-nums">
            <span>
              {metrics.remainingBudget >= 0
                ? `${formatINR(metrics.remainingBudget)} remaining`
                : `${formatINR(Math.abs(metrics.remainingBudget))} over cap`}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Day {metrics.totalDaysInMonth - metrics.remainingDaysInMonth + 1} of{' '}
              {metrics.totalDaysInMonth}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
