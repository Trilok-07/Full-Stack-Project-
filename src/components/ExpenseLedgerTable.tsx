import { useState } from 'react';
import { Download, Pencil, Search, Trash2, X } from 'lucide-react';
import {
  ALL_CATEGORIES,
  Category,
  PAYMENT_MODES,
  PaymentMode,
  Transaction,
  TransactionType,
} from '../types/ledger';
import { formatINR, formatShortDate } from '../utils/calculations';

interface ExpenseLedgerTableProps {
  transactions: Transaction[];
  totalInPeriod: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  typeFilter: 'all' | TransactionType;
  onTypeFilterChange: (value: 'all' | TransactionType) => void;
  categoryFilter: 'all' | Category;
  onCategoryFilterChange: (value: 'all' | Category) => void;
  paymentFilter: 'all' | PaymentMode;
  onPaymentFilterChange: (value: 'all' | PaymentMode) => void;
  onClearFilters: () => void;
  onEdit: (txn: Transaction) => void;
  onDelete: (id: string) => void;
  onExportCsv: () => void;
  onFocusAddForm: () => void;
  editingId: string | null;
}

export function ExpenseLedgerTable({
  transactions,
  totalInPeriod,
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  onClearFilters,
  onEdit,
  onDelete,
  onExportCsv,
  onFocusAddForm,
  editingId,
}: ExpenseLedgerTableProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    paymentFilter !== 'all';

  const filteredNet = transactions.reduce(
    (acc, t) => (t.type === 'income' ? acc + t.amount : acc - t.amount),
    0
  );

  return (
    <section
      id="ledger"
      aria-label="Student Expense Ledger"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
    >
      {/* Header & Actions */}
      <div className="p-6 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                Student Expense Ledger
              </h2>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                ·
              </span>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {transactions.length} of {totalInPeriod}{' '}
                {totalInPeriod === 1 ? 'record' : 'records'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Search descriptions, filter by category or payment mode, and export to CSV.
            </p>
          </div>

          <button
            type="button"
            onClick={onExportCsv}
            disabled={transactions.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search
              className="pointer-events-none w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <label htmlFor="ledger-search" className="sr-only">
              Search ledger records
            </label>
            <input
              id="ledger-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search canteen, hostel, note..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Type Segmented Control */}
          <div
            role="group"
            aria-label="Filter by transaction type"
            className="md:col-span-3 grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80"
          >
            {(
              [
                { value: 'all', label: 'All' },
                { value: 'expense', label: 'Expenses' },
                { value: 'income', label: 'Income' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onTypeFilterChange(opt.value)}
                aria-pressed={typeFilter === opt.value}
                className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  typeFilter === opt.value
                    ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <label htmlFor="ledger-category-filter" className="sr-only">
              Filter by category
            </label>
            <select
              id="ledger-category-filter"
              value={categoryFilter}
              onChange={(e) =>
                onCategoryFilterChange(e.target.value as 'all' | Category)
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Categories</option>
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Mode Dropdown */}
          <div className="md:col-span-2">
            <label htmlFor="ledger-payment-filter" className="sr-only">
              Filter by payment mode
            </label>
            <select
              id="ledger-payment-filter"
              value={paymentFilter}
              onChange={(e) =>
                onPaymentFilterChange(e.target.value as 'all' | PaymentMode)
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Modes</option>
              {PAYMENT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing filtered view · Net total:{' '}
              <strong className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {filteredNet >= 0 ? `+${formatINR(filteredNet)}` : formatINR(filteredNet)}
              </strong>
            </span>
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Table or Empty State */}
      {transactions.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {totalInPeriod === 0
              ? 'No student records for this period yet'
              : 'No records match your active search or filters'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {totalInPeriod === 0
              ? 'Add pocket money credits or daily canteen, travel, and hostel expenses to populate your ledger.'
              : 'Try broadening your search keyword or resetting the category and payment mode filters.'}
          </p>
          <div className="mt-4">
            {totalInPeriod === 0 ? (
              <button
                type="button"
                onClick={onFocusAddForm}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
              >
                Log First Record
              </button>
            ) : (
              <button
                type="button"
                onClick={onClearFilters}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Clear Active Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-xs font-medium text-slate-500 dark:text-slate-400">
                <th className="py-3 pl-6 pr-3 whitespace-nowrap">Date</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 whitespace-nowrap">Category</th>
                <th className="py-3 px-3 whitespace-nowrap">Payment Mode</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Amount</th>
                <th className="py-3 pl-3 pr-6 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
              {transactions.map((txn) => {
                const isIncome = txn.type === 'income';
                const isEditingRow = editingId === txn.id;
                const isConfirmingDelete = confirmDeleteId === txn.id;

                return (
                  <tr
                    key={txn.id}
                    className={`transition-colors ${
                      isEditingRow
                        ? 'bg-blue-50/50 dark:bg-blue-950/30'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 pl-6 pr-3 font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatShortDate(txn.date)}
                    </td>
                    <td className="py-3 px-3 min-w-[210px]">
                      <div className="font-medium text-slate-900 dark:text-slate-100 leading-snug">
                        {txn.title}
                      </div>
                      {txn.note && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {txn.note}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <span>{txn.category}</span>
                      <span
                        aria-hidden="true"
                        className="mx-1.5 text-slate-300 dark:text-slate-700"
                      >
                        ·
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {isIncome ? 'Credit' : 'Expense'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {txn.paymentMode}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono tabular-nums text-sm font-semibold whitespace-nowrap ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatINR(txn.amount)}
                    </td>
                    <td className="py-3 pl-3 pr-6 text-right whitespace-nowrap">
                      {isConfirmingDelete ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onDelete(txn.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(txn)}
                            aria-label={`Edit ${txn.title}`}
                            className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(txn.id)}
                            aria-label={`Delete ${txn.title}`}
                            className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
