export function buildStandaloneHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CampusLedger — Student Expense &amp; Allowance Tracker</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            display: ['Plus Jakarta Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
          },
        },
      },
    };
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet" />
  <style>
    .tabular-nums { font-variant-numeric: tabular-nums; }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans antialiased min-h-screen">
  <header class="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
      <a href="#top" class="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">CampusLedger</a>
      <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
        <a href="#budget" class="hover:text-slate-900 dark:hover:text-white whitespace-nowrap">Budget</a>
        <a href="#record-form" class="hover:text-slate-900 dark:hover:text-white whitespace-nowrap">Add Record</a>
        <a href="#analytics" class="hover:text-slate-900 dark:hover:text-white whitespace-nowrap">Breakdown</a>
        <a href="#ledger" class="hover:text-slate-900 dark:hover:text-white whitespace-nowrap">Ledger</a>
      </nav>
      <button id="open-viva-btn" type="button" class="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap shrink-0">
        Viva &amp; API Docs
      </button>
    </div>
  </header>

  <main id="top" class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Student Expense &amp; Allowance Tracker</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track monthly pocket money, hostel dues, canteen expenses, and daily safe spend.</p>
      </div>
      <div class="flex items-center gap-2.5">
        <select id="month-filter" class="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"></select>
        <button id="theme-toggle" type="button" class="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap">Toggle Theme</button>
      </div>
    </div>

    <!-- KPI Cards -->
    <section id="kpi-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"></section>

    <!-- Monthly Budget Limit & Daily Safe Spend -->
    <section id="budget" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="font-display text-base font-semibold">Monthly Student Budget Limit</h2>
            <span class="text-slate-300 dark:text-slate-700">&middot;</span>
            <span id="budget-status-text" class="text-xs font-semibold"></span>
          </div>
          <p id="budget-summary-copy" class="text-sm text-slate-600 dark:text-slate-400 mt-1"></p>
        </div>
        <form id="budget-form" class="flex items-center gap-2">
          <label for="budget-input" class="text-xs text-slate-500 dark:text-slate-400">Limit (&#8377;)</label>
          <input id="budget-input" type="number" min="100" step="100" class="w-32 px-3 py-1.5 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
          <button type="submit" class="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white">Update</button>
        </form>
      </div>
      <div class="mt-4 h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div id="budget-bar" class="h-full rounded-full transition-all duration-300" style="width: 0%"></div>
      </div>
      <div id="budget-foot" class="mt-2 flex flex-wrap justify-between gap-2 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400"></div>
    </section>

    <!-- Record Form + HTML5 Canvas Donut Chart -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <section id="record-form" class="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 id="form-heading" class="font-display text-base font-semibold">Add Student Record</h2>
          <button id="cancel-edit-btn" type="button" class="hidden text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white">Cancel Edit</button>
        </div>
        <form id="txn-form" class="space-y-3.5">
          <input type="hidden" id="txn-id" />
          <div class="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <button type="button" id="type-expense" class="py-2 text-xs font-semibold rounded-md bg-white dark:bg-slate-950 text-slate-900 dark:text-white">Student Expense</button>
            <button type="button" id="type-income" class="py-2 text-xs font-semibold rounded-md text-slate-600 dark:text-slate-400">Pocket Money</button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div class="sm:col-span-7">
              <label for="txn-title" class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Description</label>
              <input id="txn-title" type="text" required placeholder="e.g., Canteen lunch" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            </div>
            <div class="sm:col-span-5">
              <label for="txn-amount" class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Amount (&#8377;)</label>
              <input id="txn-amount" type="number" min="1" step="any" required placeholder="0" class="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div class="sm:col-span-7">
              <label for="txn-category" class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Category</label>
              <select id="txn-category" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"></select>
            </div>
            <div class="sm:col-span-5">
              <label for="txn-date" class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Date</label>
              <input id="txn-date" type="date" required class="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
            </div>
          </div>
          <div>
            <label for="txn-mode" class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Payment Mode</label>
            <select id="txn-mode" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
              <option value="UPI / GPay">UPI / GPay</option>
              <option value="Cash">Cash</option>
              <option value="Debit Card">Debit Card</option>
            </select>
          </div>
          <div>
            <label for="txn-note" class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Note (optional)</label>
            <input id="txn-note" type="text" placeholder="Receipt or split details" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
          </div>
          <button id="submit-btn" type="submit" class="w-full py-2.5 px-4 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white">Save Student Expense</button>
        </form>
      </section>

      <section id="analytics" class="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="font-display text-base font-semibold">Expense Category Breakdown</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">Hover a slice to inspect or click to filter the ledger.</p>
          </div>
          <button id="clear-chart-filter" type="button" class="hidden text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">Clear filter</button>
        </div>
        <div class="flex flex-col md:flex-row items-center gap-6 my-auto">
          <div class="relative shrink-0">
            <canvas id="donut-canvas" width="236" height="236"></canvas>
            <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <span id="donut-center-label" class="text-[11px] font-medium text-slate-500 dark:text-slate-400 max-w-[110px] truncate">Total Spent</span>
              <span id="donut-center-val" class="font-mono tabular-nums text-base font-bold mt-0.5">&#8377;0</span>
              <span id="donut-center-sub" class="font-mono tabular-nums text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">0 categories</span>
            </div>
          </div>
          <ul id="donut-legend" class="w-full flex-1 divide-y divide-slate-100 dark:divide-slate-800 text-xs"></ul>
        </div>
      </section>
    </div>

    <!-- Searchable & Filterable Ledger -->
    <section id="ledger" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <div class="p-6 border-b border-slate-200 dark:border-slate-800 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="font-display text-base font-semibold">Student Expense Ledger</h2>
            <p id="ledger-count" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5"></p>
          </div>
          <button id="export-csv-btn" type="button" class="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap">Export CSV</button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input id="search-input" type="search" placeholder="Search description or note..." class="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950" />
          <select id="filter-type" class="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
            <option value="all">All Types</option>
            <option value="expense">Student Expenses</option>
            <option value="income">Pocket Money / Income</option>
          </select>
          <select id="filter-category" class="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"></select>
          <select id="filter-mode" class="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
            <option value="all">All Payment Modes</option>
            <option value="UPI / GPay">UPI / GPay</option>
            <option value="Cash">Cash</option>
            <option value="Debit Card">Debit Card</option>
          </select>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-500 dark:text-slate-400">
              <th class="py-3 pl-6 pr-3">Date</th>
              <th class="py-3 px-3">Description</th>
              <th class="py-3 px-3">Category</th>
              <th class="py-3 px-3">Payment Mode</th>
              <th class="py-3 px-3 text-right">Amount</th>
              <th class="py-3 pl-3 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody id="ledger-tbody" class="divide-y divide-slate-100 dark:divide-slate-800 text-sm"></tbody>
        </table>
      </div>
    </section>
  </main>

  <!-- Viva & API Docs Modal -->
  <div id="viva-modal" class="hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h3 class="font-display text-base font-semibold">Full-Stack Viva &amp; API Reference</h3>
        <button id="close-viva-btn" type="button" class="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white">Close</button>
      </div>
      <div class="p-6 overflow-y-auto space-y-6 text-xs">
        <div>
          <h4 class="font-display text-sm font-semibold mb-2">1. JSON Record Schema</h4>
          <pre class="p-4 rounded-lg bg-slate-950 text-slate-100 font-mono overflow-x-auto">{
  "id": "txn_1731981002",
  "title": "Canteen Lunch &amp; Filter Coffee",
  "amount": 180.00,
  "type": "expense",
  "category": "Food &amp; Canteen",
  "paymentMode": "UPI / GPay",
  "date": "2026-11-18",
  "note": "Campus mess lunch",
  "createdAt": "2026-11-18T12:30:00.000Z"
}</pre>
        </div>
        <div>
          <h4 class="font-display text-sm font-semibold mb-2">2. MySQL Table Structure</h4>
          <pre class="p-4 rounded-lg bg-slate-950 text-slate-100 font-mono overflow-x-auto">CREATE TABLE monthly_budgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  budget_month CHAR(7) NOT NULL,
  limit_amount DECIMAL(10, 2) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_student_month (student_id, budget_month)
);

CREATE TABLE transactions (
  id VARCHAR(36) PRIMARY KEY,
  student_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount &gt; 0),
  type ENUM('expense', 'income') NOT NULL,
  category ENUM(
    'Food &amp; Canteen','Hostel &amp; Rent','Books &amp; Stationery',
    'Travel &amp; Metro','College Fees','Recharge &amp; Wi-Fi',
    'Outing &amp; Hangout','Monthly Allowance',
    'Stipend &amp; Freelance','Scholarship'
  ) NOT NULL,
  payment_mode ENUM('UPI / GPay','Cash','Debit Card') NOT NULL,
  txn_date DATE NOT NULL,
  note VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_student_date (student_id, txn_date)
);</pre>
        </div>
        <div>
          <h4 class="font-display text-sm font-semibold mb-2">3. RESTful API Endpoints</h4>
          <pre class="p-4 rounded-lg bg-slate-950 text-slate-100 font-mono overflow-x-auto">GET    /api/v1/transactions?month=YYYY-MM&amp;category=&amp;mode=&amp;q=
POST   /api/v1/transactions          Create student expense or pocket money entry
PUT    /api/v1/transactions/:id      Update an existing transaction record
DELETE /api/v1/transactions/:id      Delete a transaction record
GET    /api/v1/budget/:month         Fetch monthly limit &amp; daily safe spend metrics
PUT    /api/v1/budget/:month         Update monthly student budget limit
GET    /api/v1/analytics/categories  Category breakdown totals for Donut chart
GET    /api/v1/export/csv            Stream filtered student ledger as CSV</pre>
        </div>
      </div>
    </div>
  </div>

  <script>
    (() => {
      const EXPENSE_CATS = ['Food & Canteen','Hostel & Rent','Books & Stationery','Travel & Metro','College Fees','Recharge & Wi-Fi','Outing & Hangout'];
      const INCOME_CATS = ['Monthly Allowance','Stipend & Freelance','Scholarship'];
      const COLORS = {
        'Food & Canteen': '#2563EB', 'Hostel & Rent': '#0D9488', 'Books & Stationery': '#D97706',
        'Travel & Metro': '#7C3AED', 'College Fees': '#DC2626', 'Recharge & Wi-Fi': '#0284C7',
        'Outing & Hangout': '#DB2777'
      };
      const KEY_TXN = 'campusledger_single_txns_v1';
      const KEY_BUDGET = 'campusledger_single_budget_v1';
      const KEY_THEME = 'campusledger_single_theme_v1';

      const today = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const currentMonth = today.getFullYear() + '-' + pad(today.getMonth() + 1);
      const todayIso = currentMonth + '-' + pad(today.getDate());

      let state = {
        txns: JSON.parse(localStorage.getItem(KEY_TXN) || 'null') || [
          { id: 't1', title: 'Monthly Pocket Money', amount: 14000, type: 'income', category: 'Monthly Allowance', paymentMode: 'UPI / GPay', date: currentMonth + '-01', note: 'Home transfer' },
          { id: 't2', title: 'Hostel Mess & Room Share', amount: 4500, type: 'expense', category: 'Hostel & Rent', paymentMode: 'UPI / GPay', date: currentMonth + '-02', note: 'Block B dues' },
          { id: 't3', title: 'Canteen Lunch & Coffee', amount: 680, type: 'expense', category: 'Food & Canteen', paymentMode: 'UPI / GPay', date: currentMonth + '-05', note: 'Week 1 meals' },
          { id: 't4', title: 'Metro Smart Card Recharge', amount: 500, type: 'expense', category: 'Travel & Metro', paymentMode: 'UPI / GPay', date: currentMonth + '-07', note: 'Commute pass' },
          { id: 't5', title: 'DBMS Lab Record & Books', amount: 840, type: 'expense', category: 'Books & Stationery', paymentMode: 'Debit Card', date: currentMonth + '-09', note: 'Bookstore receipt' },
        ],
        budget: Number(localStorage.getItem(KEY_BUDGET)) || 12000,
        formType: 'expense',
        month: currentMonth,
        hoveredCat: null,
        selectedCat: null,
        geos: [],
      };

      const fmt = (n) => (n < 0 ? '-' : '') + '\\u20B9' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Math.abs(n));
      const persist = () => {
        localStorage.setItem(KEY_TXN, JSON.stringify(state.txns));
        localStorage.setItem(KEY_BUDGET, String(state.budget));
      };

      const applyTheme = (dark) => {
        document.documentElement.classList.toggle('dark', dark);
        localStorage.setItem(KEY_THEME, dark ? 'dark' : 'light');
        render();
      };
      if (localStorage.getItem(KEY_THEME) === 'dark') document.documentElement.classList.add('dark');

      document.getElementById('theme-toggle').onclick = () => applyTheme(!document.documentElement.classList.contains('dark'));
      document.getElementById('open-viva-btn').onclick = () => document.getElementById('viva-modal').classList.remove('hidden');
      document.getElementById('close-viva-btn').onclick = () => document.getElementById('viva-modal').classList.add('hidden');
      document.getElementById('txn-date').value = todayIso;

      function populateFormCategories() {
        const list = state.formType === 'expense' ? EXPENSE_CATS : INCOME_CATS;
        const sel = document.getElementById('txn-category');
        sel.innerHTML = list.map((c) => '<option value="' + c + '">' + c + '</option>').join('');
        document.getElementById('type-expense').className = state.formType === 'expense'
          ? 'py-2 text-xs font-semibold rounded-md bg-white dark:bg-slate-950 text-slate-900 dark:text-white'
          : 'py-2 text-xs font-semibold rounded-md text-slate-600 dark:text-slate-400';
        document.getElementById('type-income').className = state.formType === 'income'
          ? 'py-2 text-xs font-semibold rounded-md bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400'
          : 'py-2 text-xs font-semibold rounded-md text-slate-600 dark:text-slate-400';
        if (!document.getElementById('txn-id').value) {
          document.getElementById('submit-btn').textContent = state.formType === 'expense' ? 'Save Student Expense' : 'Add Pocket Money';
        }
      }

      document.getElementById('type-expense').onclick = () => { state.formType = 'expense'; populateFormCategories(); };
      document.getElementById('type-income').onclick = () => { state.formType = 'income'; populateFormCategories(); };

      document.getElementById('filter-category').innerHTML =
        '<option value="all">All Categories</option>' + [...EXPENSE_CATS, ...INCOME_CATS].map((c) => '<option value="' + c + '">' + c + '</option>').join('');

      document.getElementById('budget-form').onsubmit = (e) => {
        e.preventDefault();
        const val = Number(document.getElementById('budget-input').value);
        if (val >= 100) { state.budget = Math.round(val); persist(); render(); }
      };

      document.getElementById('txn-form').onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('txn-id').value;
        const payload = {
          id: id || 'txn_' + Date.now(),
          title: document.getElementById('txn-title').value.trim(),
          amount: Number(document.getElementById('txn-amount').value),
          type: state.formType,
          category: document.getElementById('txn-category').value,
          paymentMode: document.getElementById('txn-mode').value,
          date: document.getElementById('txn-date').value,
          note: document.getElementById('txn-note').value.trim(),
        };
        if (!payload.title || !(payload.amount > 0)) return;
        if (id) {
          state.txns = state.txns.map((t) => (t.id === id ? payload : t));
        } else {
          state.txns.unshift(payload);
        }
        resetForm();
        persist();
        render();
      };

      function resetForm() {
        document.getElementById('txn-id').value = '';
        document.getElementById('txn-title').value = '';
        document.getElementById('txn-amount').value = '';
        document.getElementById('txn-note').value = '';
        document.getElementById('txn-date').value = todayIso;
        document.getElementById('form-heading').textContent = 'Add Student Record';
        document.getElementById('cancel-edit-btn').classList.add('hidden');
        populateFormCategories();
      }
      document.getElementById('cancel-edit-btn').onclick = resetForm;

      ['search-input','filter-type','filter-category','filter-mode','month-filter'].forEach((id) => {
        document.getElementById(id).oninput = (e) => {
          if (id === 'month-filter') state.month = e.target.value;
          if (id === 'filter-category') state.selectedCat = e.target.value === 'all' ? null : e.target.value;
          render();
        };
      });

      document.getElementById('clear-chart-filter').onclick = () => {
        state.selectedCat = null;
        document.getElementById('filter-category').value = 'all';
        render();
      };

      document.getElementById('export-csv-btn').onclick = () => {
        const rows = getFilteredTxns();
        const header = ['ID','Date','Title','Type','Category','Payment Mode','Amount','Note'];
        const csv = [header.join(','), ...rows.map((r) => [r.id, r.date, '"' + r.title.replace(/"/g,'""') + '"', r.type, r.category, r.paymentMode, r.type === 'expense' ? -r.amount : r.amount, '"' + (r.note||'').replace(/"/g,'""') + '"'].join(','))].join('\\r\\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        a.download = 'CampusLedger_' + todayIso + '.csv';
        a.click();
      };

      function getPeriodTxns() {
        return state.month === 'all' ? state.txns : state.txns.filter((t) => t.date.startsWith(state.month));
      }

      function getFilteredTxns() {
        const q = document.getElementById('search-input').value.trim().toLowerCase();
        const ft = document.getElementById('filter-type').value;
        const fc = document.getElementById('filter-category').value;
        const fm = document.getElementById('filter-mode').value;
        return getPeriodTxns().filter((t) => {
          if (ft !== 'all' && t.type !== ft) return false;
          if (fc !== 'all' && t.category !== fc) return false;
          if (fm !== 'all' && t.paymentMode !== fm) return false;
          if (q && !(t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || (t.note||'').toLowerCase().includes(q))) return false;
          return true;
        }).sort((a,b) => b.date.localeCompare(a.date));
      }

      function drawDonut(slices, totalSpent) {
        const canvas = document.getElementById('donut-canvas');
        const ctx = canvas.getContext('2d');
        const size = 236, dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr; canvas.height = size * dpr;
        canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, size, size);
        const cx = size / 2, cy = size / 2, rOut = 96, rIn = 62;
        const isDark = document.documentElement.classList.contains('dark');
        state.geos = [];
        if (!slices.length || totalSpent <= 0) {
          ctx.beginPath(); ctx.arc(cx, cy, rOut, 0, Math.PI * 2); ctx.arc(cx, cy, rIn, 0, Math.PI * 2, true);
          ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0'; ctx.fill();
        } else {
          let angle = -Math.PI / 2;
          slices.forEach((s) => {
            const sweep = (s.amount / totalSpent) * Math.PI * 2;
            const hi = state.hoveredCat === s.category || state.selectedCat === s.category;
            state.geos.push({ slice: s, start: angle, end: angle + sweep });
            ctx.beginPath();
            ctx.arc(cx, cy, hi ? rOut + 6 : rOut, angle, angle + sweep);
            ctx.arc(cx, cy, rIn, angle + sweep, angle, true);
            ctx.closePath();
            ctx.fillStyle = COLORS[s.category] || '#2563EB';
            ctx.fill();
            angle += sweep;
          });
        }
        const active = slices.find((s) => s.category === (state.hoveredCat || state.selectedCat));
        document.getElementById('donut-center-label').textContent = active ? active.category : 'Total Spent';
        document.getElementById('donut-center-val').textContent = fmt(active ? active.amount : totalSpent);
        document.getElementById('donut-center-sub').textContent = active ? ((active.amount / totalSpent) * 100).toFixed(1) + '% share' : slices.length + ' categories';
      }

      const canvasEl = document.getElementById('donut-canvas');
      function hit(e) {
        const rect = canvasEl.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2, y = e.clientY - rect.top - rect.height / 2;
        const d = Math.hypot(x, y);
        if (d < 58 || d > 106) return null;
        let a = Math.atan2(y, x);
        if (a < -Math.PI / 2) a += Math.PI * 2;
        const g = state.geos.find((item) => a >= item.start && a <= item.end);
        return g ? g.slice.category : null;
      }
      canvasEl.onmousemove = (e) => { const h = hit(e); if (h !== state.hoveredCat) { state.hoveredCat = h; render(); } };
      canvasEl.onmouseleave = () => { state.hoveredCat = null; render(); };
      canvasEl.onclick = (e) => {
        const h = hit(e);
        state.selectedCat = h && state.selectedCat !== h ? h : null;
        document.getElementById('filter-category').value = state.selectedCat || 'all';
        render();
      };

      function render() {
        const months = Array.from(new Set([currentMonth, ...state.txns.map((t) => t.date.slice(0, 7))])).sort().reverse();
        const mSel = document.getElementById('month-filter');
        mSel.innerHTML = months.map((m) => '<option value="' + m + '"' + (m === state.month ? ' selected' : '') + '>' + m + '</option>').join('') + '<option value="all"' + (state.month === 'all' ? ' selected' : '') + '>All Time</option>';

        const periodTxns = getPeriodTxns();
        const income = periodTxns.filter((t) => t.type === 'income').reduce((a, b) => a + b.amount, 0);
        const spent = periodTxns.filter((t) => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
        const balance = income - spent;
        const totalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const remDays = Math.max(1, totalDays - today.getDate() + 1);
        const remBudget = state.budget - spent;
        const dailySafe = remBudget > 0 ? Math.floor(remBudget / remDays) : 0;
        const pct = state.budget > 0 ? (spent / state.budget) * 100 : 0;

        document.getElementById('kpi-grid').innerHTML = [
          { label: 'Wallet Balance', val: fmt(balance), cls: balance < 0 ? 'text-red-600' : '' },
          { label: 'Pocket Money & Allowance', val: '+' + fmt(income), cls: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Total Spent', val: fmt(spent), cls: '' },
          { label: 'Daily Safe Spend', val: fmt(dailySafe) + '/day', cls: pct >= 90 ? 'text-red-600' : pct >= 70 ? 'text-amber-600' : 'text-emerald-600' },
        ].map((k) => '<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5"><div class="text-xs text-slate-500 dark:text-slate-400">' + k.label + '</div><div class="font-mono tabular-nums text-2xl font-semibold mt-2 ' + k.cls + '">' + k.val + '</div></div>').join('');

        document.getElementById('budget-input').value = state.budget;
        const bar = document.getElementById('budget-bar');
        bar.style.width = Math.min(100, pct) + '%';
        bar.className = 'h-full rounded-full transition-all duration-300 ' + (pct >= 90 ? 'bg-red-600' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-600');
        document.getElementById('budget-status-text').textContent = pct >= 90 ? 'Over / Critical Limit' : pct >= 70 ? 'Approaching Limit' : 'Within Budget';
        document.getElementById('budget-summary-copy').textContent = remBudget >= 0
          ? 'Safe spend: ' + fmt(dailySafe) + '/day across ' + remDays + ' remaining days.'
          : 'Budget exceeded by ' + fmt(Math.abs(remBudget)) + '.';
        document.getElementById('budget-foot').innerHTML = '<span>' + fmt(spent) + ' / ' + fmt(state.budget) + ' (' + pct.toFixed(1) + '%)</span><span>' + remDays + ' days left in month</span>';

        const map = {};
        periodTxns.filter((t) => t.type === 'expense').forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
        const slices = Object.entries(map).map(([category, amount]) => ({ category, amount })).sort((a,b) => b.amount - a.amount);
        drawDonut(slices, spent);
        document.getElementById('clear-chart-filter').classList.toggle('hidden', !state.selectedCat);
        document.getElementById('donut-legend').innerHTML = slices.length ? slices.map((s) =>
          '<li class="py-2 flex items-center justify-between gap-2"><span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-xs inline-block" style="background:' + (COLORS[s.category]||'#2563EB') + '"></span>' + s.category + '</span><span class="font-mono tabular-nums font-semibold">' + fmt(s.amount) + ' (' + Math.round((s.amount / spent) * 100) + '%)</span></li>'
        ).join('') : '<li class="py-4 text-slate-500">No expenses logged for this period.</li>';

        const filtered = getFilteredTxns();
        document.getElementById('ledger-count').textContent = filtered.length + ' of ' + periodTxns.length + ' records shown';
        document.getElementById('ledger-tbody').innerHTML = filtered.length ? filtered.map((t) =>
          '<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">' +
          '<td class="py-3 pl-6 pr-3 font-mono tabular-nums text-xs text-slate-500">' + t.date + '</td>' +
          '<td class="py-3 px-3"><div class="font-medium">' + t.title + '</div>' + (t.note ? '<div class="text-xs text-slate-500">' + t.note + '</div>' : '') + '</td>' +
          '<td class="py-3 px-3 text-xs">' + t.category + '</td>' +
          '<td class="py-3 px-3 text-xs text-slate-500">' + t.paymentMode + '</td>' +
          '<td class="py-3 px-3 text-right font-mono tabular-nums font-semibold ' + (t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : '') + '">' + (t.type === 'income' ? '+' : '-') + fmt(t.amount) + '</td>' +
          '<td class="py-3 pl-3 pr-6 text-right text-xs space-x-2">' +
            '<button data-edit="' + t.id + '" class="text-blue-600 dark:text-blue-400 hover:underline">Edit</button>' +
            '<button data-del="' + t.id + '" class="text-red-600 dark:text-red-400 hover:underline">Delete</button>' +
          '</td></tr>'
        ).join('') : '<tr><td colspan="6" class="py-10 text-center text-xs text-slate-500">No matching records found.</td></tr>';

        document.querySelectorAll('[data-edit]').forEach((btn) => {
          btn.onclick = () => {
            const t = state.txns.find((x) => x.id === btn.dataset.edit);
            if (!t) return;
            state.formType = t.type;
            populateFormCategories();
            document.getElementById('txn-id').value = t.id;
            document.getElementById('txn-title').value = t.title;
            document.getElementById('txn-amount').value = t.amount;
            document.getElementById('txn-category').value = t.category;
            document.getElementById('txn-mode').value = t.paymentMode;
            document.getElementById('txn-date').value = t.date;
            document.getElementById('txn-note').value = t.note || '';
            document.getElementById('form-heading').textContent = 'Edit Student Record';
            document.getElementById('submit-btn').textContent = 'Update Record';
            document.getElementById('cancel-edit-btn').classList.remove('hidden');
            document.getElementById('record-form').scrollIntoView({ behavior: 'smooth' });
          };
        });
        document.querySelectorAll('[data-del]').forEach((btn) => {
          btn.onclick = () => {
            state.txns = state.txns.filter((x) => x.id !== btn.dataset.del);
            persist();
            render();
          };
        });
      }

      populateFormCategories();
      render();
    })();
  </script>
</body>
</html>`;
}

export function downloadStandaloneHtmlFile(): void {
  const html = buildStandaloneHtml();
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'CampusLedger_Student_Expense_Tracker.html';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
