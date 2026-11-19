import React, { useState, useEffect } from 'react';
import { Plus, Save, X } from 'lucide-react';
import {
  Category,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_MODES,
  PaymentMode,
  Transaction,
  TransactionType,
  getTodayIso,
} from '../types/ledger';

interface RecordFormProps {
  editingRecord: Transaction | null;
  onSave: (record: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
  onCancelEdit: () => void;
}

export function RecordForm({
  editingRecord,
  onSave,
  onCancelEdit,
}: RecordFormProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>(EXPENSE_CATEGORIES[0]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI / GPay');
  const [date, setDate] = useState(getTodayIso());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingRecord) {
      setType(editingRecord.type);
      setTitle(editingRecord.title);
      setAmount(String(editingRecord.amount));
      setCategory(editingRecord.category);
      setPaymentMode(editingRecord.paymentMode);
      setDate(editingRecord.date);
      setNote(editingRecord.note ?? '');
      setError('');
    }
  }, [editingRecord]);

  const activeCategories: Category[] =
    type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    const nextList = nextType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (!nextList.includes(category as never)) {
      setCategory(nextList[0]);
    }
    setError('');
  };

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setNote('');
    setDate(getTodayIso());
    setPaymentMode('UPI / GPay');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const numericAmount = Number(amount);

    if (!trimmedTitle) {
      setError('Enter a short title or description for this record.');
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Enter a valid amount greater than ₹0.');
      return;
    }
    if (!date) {
      setError('Select a valid transaction date.');
      return;
    }

    onSave(
      {
        title: trimmedTitle,
        amount: Math.round(numericAmount * 100) / 100,
        type,
        category,
        paymentMode,
        date,
        note: note.trim() || undefined,
      },
      editingRecord?.id
    );

    if (!editingRecord) {
      resetForm();
    }
  };

  return (
    <section
      id="add-record"
      aria-label={editingRecord ? 'Edit Student Record' : 'Add Student Record'}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between h-full"
    >
      <div>
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
              {editingRecord ? 'Edit Student Record' : 'Add Student Record'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {editingRecord
                ? 'Update amount, category, or payment mode and save.'
                : 'Log daily campus spending or pocket money credits.'}
            </p>
          </div>
          {editingRecord && (
            <button
              type="button"
              onClick={() => {
                onCancelEdit();
                resetForm();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Expense vs Pocket Money Segmented Toggle */}
          <div>
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Record Type
            </span>
            <div
              role="group"
              aria-label="Record Type"
              className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80"
            >
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                aria-pressed={type === 'expense'}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  type === 'expense'
                    ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Student Expense
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                aria-pressed={type === 'income'}
                className={`py-2 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  type === 'income'
                    ? 'bg-white dark:bg-slate-950 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Pocket Money
              </button>
            </div>
          </div>

          {/* Title & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            <div className="sm:col-span-7">
              <label
                htmlFor="record-title"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
              >
                Description
              </label>
              <input
                id="record-title"
                type="text"
                maxLength={80}
                placeholder={
                  type === 'expense'
                    ? 'e.g., Canteen lunch & coffee'
                    : 'e.g., Monthly allowance from home'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="sm:col-span-5">
              <label
                htmlFor="record-amount"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
              >
                Amount (INR)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-400">
                  ₹
                </span>
                <input
                  id="record-amount"
                  type="number"
                  min={1}
                  step="any"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            <div className="sm:col-span-7">
              <label
                htmlFor="record-category"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
              >
                Student Category
              </label>
              <select
                id="record-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                {activeCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-5">
              <label
                htmlFor="record-date"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
              >
                Date
              </label>
              <input
                id="record-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              Payment Mode
            </span>
            <div
              role="group"
              aria-label="Payment Mode"
              className="grid grid-cols-3 gap-2"
            >
              {PAYMENT_MODES.map((mode) => {
                const isSelected = paymentMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    aria-pressed={isSelected}
                    className={`py-2 px-2.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label
              htmlFor="record-note"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              Note <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="record-note"
              type="text"
              maxLength={120}
              placeholder="Receipt number, roommate split, or semester detail"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="text-xs font-medium text-red-600 dark:text-red-400"
            >
              {error}
            </p>
          )}

          <div className="pt-1">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-colors cursor-pointer"
            >
              {editingRecord ? (
                <>
                  <Save className="w-4 h-4" />
                  Update Record
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {type === 'expense' ? 'Save Student Expense' : 'Add Pocket Money'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
