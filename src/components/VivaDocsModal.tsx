import { useEffect, useState } from 'react';
import { Check, Copy, Download, X } from 'lucide-react';
import { Transaction } from '../types/ledger';
import { downloadStandaloneHtmlFile } from '../utils/standaloneHtmlGenerator';

interface VivaDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  monthlyBudget: number;
}

type DocTab = 'json' | 'mysql' | 'rest' | 'submission';

const JSON_SCHEMA_SPEC = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CampusLedgerTransaction",
  "type": "object",
  "required": ["id", "title", "amount", "type", "category", "paymentMode", "date"],
  "properties": {
    "id":          { "type": "string", "example": "txn_1763510420" },
    "title":       { "type": "string", "minLength": 1, "maxLength": 80 },
    "amount":      { "type": "number", "exclusiveMinimum": 0 },
    "type":        { "type": "string", "enum": ["expense", "income"] },
    "category":    {
      "type": "string",
      "enum": [
        "Food & Canteen", "Hostel & Rent", "Books & Stationery",
        "Travel & Metro", "College Fees", "Recharge & Wi-Fi",
        "Outing & Hangout", "Monthly Allowance",
        "Stipend & Freelance", "Scholarship"
      ]
    },
    "paymentMode": { "type": "string", "enum": ["UPI / GPay", "Cash", "Debit Card"] },
    "date":        { "type": "string", "format": "date", "example": "2026-11-18" },
    "note":        { "type": "string", "maxLength": 120 },
    "createdAt":   { "type": "string", "format": "date-time" }
  }
}`;

const MYSQL_SCHEMA_SQL = `-- CampusLedger Full-Stack Practical Database Schema (MySQL 8.0+)
CREATE DATABASE IF NOT EXISTS campus_ledger
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE campus_ledger;

-- 1. Students table
CREATE TABLE students (
  student_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  roll_number   VARCHAR(32)  NOT NULL UNIQUE,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  hostel_block  VARCHAR(40)  NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Monthly Student Budget Limits table
CREATE TABLE monthly_budgets (
  budget_id     INT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
  student_id    INT UNSIGNED   NOT NULL,
  budget_month  CHAR(7)        NOT NULL COMMENT 'Format: YYYY-MM',
  limit_amount  DECIMAL(10, 2) NOT NULL CHECK (limit_amount > 0),
  updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_student_month (student_id, budget_month),
  CONSTRAINT fk_budget_student
    FOREIGN KEY (student_id) REFERENCES students(student_id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Student Expense & Pocket Money Ledger table
CREATE TABLE transactions (
  transaction_id VARCHAR(36)    PRIMARY KEY,
  student_id     INT UNSIGNED   NOT NULL,
  title          VARCHAR(80)    NOT NULL,
  amount         DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  type           ENUM('expense', 'income') NOT NULL,
  category       ENUM(
                   'Food & Canteen',
                   'Hostel & Rent',
                   'Books & Stationery',
                   'Travel & Metro',
                   'College Fees',
                   'Recharge & Wi-Fi',
                   'Outing & Hangout',
                   'Monthly Allowance',
                   'Stipend & Freelance',
                   'Scholarship'
                 ) NOT NULL,
  payment_mode   ENUM('UPI / GPay', 'Cash', 'Debit Card') NOT NULL,
  txn_date       DATE           NOT NULL,
  note           VARCHAR(120)   NULL,
  created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_student_date (student_id, txn_date DESC),
  INDEX idx_student_category (student_id, category),
  CONSTRAINT fk_txn_student
    FOREIGN KEY (student_id) REFERENCES students(student_id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- Viva Query: Category breakdown & Daily Safe Spend for active month
SELECT
  category,
  COUNT(*) AS entry_count,
  SUM(amount) AS total_spent
FROM transactions
WHERE student_id = 1
  AND type = 'expense'
  AND DATE_FORMAT(txn_date, '%Y-%m') = '2026-11'
GROUP BY category
ORDER BY total_spent DESC;`;

const REST_ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/v1/transactions',
    purpose: 'List student records with ?month, ?type, ?category, ?mode, and ?q search filters',
    response: '200 OK · { data: Transaction[], total: number }',
  },
  {
    method: 'POST',
    path: '/api/v1/transactions',
    purpose: 'Create a new Student Expense or Pocket Money income entry',
    response: '201 Created · { data: Transaction }',
  },
  {
    method: 'PUT',
    path: '/api/v1/transactions/:id',
    purpose: 'Update an existing ledger record by transaction ID',
    response: '200 OK · { data: Transaction }',
  },
  {
    method: 'DELETE',
    path: '/api/v1/transactions/:id',
    purpose: 'Permanently delete a transaction record from the ledger',
    response: '204 No Content',
  },
  {
    method: 'GET',
    path: '/api/v1/budget/:month',
    purpose: 'Return monthly budget limit, total spent, status, and Daily Safe Spend',
    response: '200 OK · { limit, spent, remainingDays, dailySafeSpend, status }',
  },
  {
    method: 'PUT',
    path: '/api/v1/budget/:month',
    purpose: 'Upsert the student monthly budget cap for YYYY-MM',
    response: '200 OK · { budgetMonth, limitAmount }',
  },
  {
    method: 'GET',
    path: '/api/v1/analytics/categories',
    purpose: 'Aggregate category totals and percentage shares for HTML5 Canvas Donut Chart',
    response: '200 OK · { totalSpent, slices: CategorySlice[] }',
  },
  {
    method: 'GET',
    path: '/api/v1/export/csv',
    purpose: 'Stream filtered student expense records as RFC-4180 CSV download',
    response: '200 OK · Content-Type: text/csv',
  },
];

const SAMPLE_POST_PAYLOAD = `POST /api/v1/transactions HTTP/1.1
Content-Type: application/json
Authorization: Bearer <student_jwt_token>

{
  "title": "DBMS Practical Manual & Spiral Binding",
  "amount": 240,
  "type": "expense",
  "category": "Books & Stationery",
  "paymentMode": "UPI / GPay",
  "date": "2026-11-18",
  "note": "Campus photocopy center"
}`;

export function VivaDocsModal({
  isOpen,
  onClose,
  transactions,
  monthlyBudget,
}: VivaDocsModalProps) {
  const [activeTab, setActiveTab] = useState<DocTab>('json');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const liveSnapshot = JSON.stringify(
    {
      monthlyBudgetLimit: monthlyBudget,
      recordCount: transactions.length,
      sampleRecord: transactions[0] ?? null,
    },
    null,
    2
  );

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // Clipboard fallback ignored silently
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="viva-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden shadow-xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h2
              id="viva-modal-title"
              className="font-display text-base font-semibold text-slate-900 dark:text-slate-50"
            >
              Viva Voce &amp; Full-Stack API Documentation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              JSON contract, MySQL 8 DDL, RESTful endpoints, and single-file practical export.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close documentation modal"
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 pb-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'json', label: 'JSON Schema' },
              { id: 'mysql', label: 'MySQL Tables' },
              { id: 'rest', label: 'REST API Endpoints' },
              { id: 'submission', label: 'Single-File HTML' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {activeTab === 'json' && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Transaction JSON Schema (Draft 2020-12)
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCopy('json-schema', JSON_SCHEMA_SPEC)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {copiedKey === 'json-schema' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Schema
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800">
                  {JSON_SCHEMA_SPEC}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Live localStorage Payload Snapshot
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCopy('live-json', liveSnapshot)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {copiedKey === 'live-json' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Snapshot
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-lg bg-slate-950 text-emerald-300 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800">
                  {liveSnapshot}
                </pre>
              </div>
            </>
          )}

          {activeTab === 'mysql' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Normalized Relational Schema (3NF) &amp; Analytics Query
                </h3>
                <button
                  type="button"
                  onClick={() => handleCopy('mysql-ddl', MYSQL_SCHEMA_SQL)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {copiedKey === 'mysql-ddl' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy SQL
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800">
                {MYSQL_SCHEMA_SQL}
              </pre>
            </div>
          )}

          {activeTab === 'rest' && (
            <div className="space-y-5">
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                      <th className="py-2.5 px-3 font-medium">Method</th>
                      <th className="py-2.5 px-3 font-medium">Endpoint</th>
                      <th className="py-2.5 px-3 font-medium">Description</th>
                      <th className="py-2.5 px-3 font-medium">Response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {REST_ENDPOINTS.map((ep) => (
                      <tr key={`${ep.method}-${ep.path}`}>
                        <td className="py-2.5 px-3 font-mono font-semibold whitespace-nowrap text-blue-600 dark:text-blue-400">
                          {ep.method}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {ep.path}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          {ep.purpose}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {ep.response}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Sample Request Payload
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCopy('rest-sample', SAMPLE_POST_PAYLOAD)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {copiedKey === 'rest-sample' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Request
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800">
                  {SAMPLE_POST_PAYLOAD}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'submission' && (
            <div className="space-y-4">
              <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Self-Contained Single-File Practical Submission (.html)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                    Exports a clean, zero-build single HTML5 file using Tailwind CSS via CDN and vanilla ES6+ JavaScript with all 5 features (budget progress bar, Daily Safe Spend, 4 KPI cards, HTML5 Canvas Donut Chart, searchable CSV ledger, dark mode, localStorage, and Viva Docs modal).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadStandaloneHtmlFile}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download .HTML File
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                    01. Daily Safe Spend Formula
                  </h4>
                  <p className="font-mono text-[11px] text-slate-800 dark:text-slate-200">
                    dailySafeSpend = max(0, (monthlyLimit - monthSpent) / remainingDays)
                  </p>
                  <p className="text-slate-500 dark:text-slate-400">
                    Uses <code className="font-mono">new Date(year, month, 0).getDate()</code> to compute exact days in any month (28/29/30/31) including today.
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                    02. HTML5 Canvas HiDPI &amp; Hit-Testing
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400">
                    Scales backing resolution by <code className="font-mono">window.devicePixelRatio</code> and converts cursor coordinates via <code className="font-mono">Math.atan2(y, x)</code> and radial distance to detect hovered slices without any third-party charting library.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
