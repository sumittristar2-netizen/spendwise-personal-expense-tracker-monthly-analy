import * as api from './api.js';
import * as charts from './charts.js';
import * as components from './components.js';

// Central Application State
const state = {
  expenses: [],
  categories: [],
  settings: {},
  currentRoute: '#/',
  filters: {
    search: '',
    month: new Date().toISOString().substring(0, 7), // YYYY-MM
    categoryId: 'all',
    paymentMethod: 'all'
  }
};

// Initialize Application
function init() {
  api.initStore();
  loadData();
  setupEventListeners();
  handleRouting();
}

function loadData() {
  state.expenses = api.getExpenses();
  state.categories = api.getCategories();
  state.settings = api.getSettings();

  // Set Theme
  document.documentElement.setAttribute('data-theme', state.settings.theme || 'dark');
}

function setupEventListeners() {
  // Hash Routing
  window.addEventListener('hashchange', () => {
    state.currentRoute = window.location.hash || '#/';
    handleRouting();
  });

  // Mobile Menu Toggle
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const menuBtn = document.getElementById('menu-toggle');
  const closeBtn = document.getElementById('mobile-close-btn');

  const toggleSidebar = (open) => {
    sidebar.classList.toggle('open', open);
    backdrop.classList.toggle('active', open);
  };

  menuBtn?.addEventListener('click', () => toggleSidebar(true));
  closeBtn?.addEventListener('click', () => toggleSidebar(false));
  backdrop?.addEventListener('click', () => toggleSidebar(false));

  // Quick Add Expense Buttons
  const handleQuickAdd = () => {
    components.openExpenseModal({
      categories: state.categories,
      currency: state.settings.currencySymbol,
      onSave: (expData) => {
        state.expenses = api.saveExpense(expData);
        components.showToast('Expense logged successfully!', 'success');
        renderCurrentView();
      }
    });
  };

  document.getElementById('sidebar-quick-add')?.addEventListener('click', handleQuickAdd);
  document.getElementById('header-add-btn')?.addEventListener('click', handleQuickAdd);
}

function handleRouting() {
  const route = window.location.hash || '#/';
  state.currentRoute = route;

  // Update Nav Active State
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-route') === route);
  });

  // Close mobile nav on transition
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-backdrop')?.classList.remove('active');

  // Update Header Month Display
  const currentMonthLabel = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const chip = document.getElementById('month-chip-label');
  if (chip) chip.textContent = currentMonthLabel;

  renderCurrentView();
}

function renderCurrentView() {
  const appContainer = document.getElementById('app');
  const pageTitle = document.getElementById('page-title');

  switch (state.currentRoute) {
    case '#/':
      if (pageTitle) pageTitle.textContent = 'Dashboard Overview';
      renderDashboard(appContainer);
      break;

    case '#/expenses':
      if (pageTitle) pageTitle.textContent = 'Expense History';
      renderExpenseHistory(appContainer);
      break;

    case '#/analytics':
      if (pageTitle) pageTitle.textContent = 'Analytics & Insights';
      renderAnalytics(appContainer);
      break;

    case '#/categories':
      if (pageTitle) pageTitle.textContent = 'Categories & Budgets';
      renderCategories(appContainer);
      break;

    case '#/settings':
      if (pageTitle) pageTitle.textContent = 'Settings & Backup';
      renderSettings(appContainer);
      break;

    default:
      if (pageTitle) pageTitle.textContent = 'Dashboard';
      renderDashboard(appContainer);
      break;
  }
}

// -------------------------------------------------------------
// 1. DASHBOARD VIEW (#/)
// -------------------------------------------------------------
function renderDashboard(container) {
  const curMonthStr = new Date().toISOString().substring(0, 7);
  const monthExpenses = state.expenses.filter(e => e.date.startsWith(curMonthStr));
  const totalSpentMonth = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const daysPassed = Math.max(new Date().getDate(), 1);
  const dailyAverage = totalSpentMonth / daysPassed;

  const totalMonthlyCap = state.settings.monthlyBudget || 3000;
  const budgetRemaining = totalMonthlyCap - totalSpentMonth;

  const currency = state.settings.currencySymbol;

  // Category Aggregates for Pie Chart
  const catSpending = {};
  monthExpenses.forEach(e => {
    catSpending[e.categoryId] = (catSpending[e.categoryId] || 0) + e.amount;
  });

  const donutData = Object.entries(catSpending).map(([catId, val]) => {
    const cat = state.categories.find(c => c.id === catId) || { name: 'Other', color: '#94a3b8' };
    return {
      label: cat.name,
      value: val,
      color: cat.color
    };
  }).sort((a, b) => b.value - a.value);

  // Budget Meters Data
  const budgetMeters = state.categories.map(cat => {
    const spent = monthExpenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0);
    const limit = cat.budgetLimit || 1;
    const percentage = Math.round((spent / limit) * 100);
    let status = 'safe';
    if (percentage > 100) status = 'danger';
    else if (percentage >= 85) status = 'warning';

    return { ...cat, spent, percentage, status };
  });

  const recentExpenses = state.expenses.slice(0, 5);

  container.innerHTML = `
    <!-- Top Metric Cards -->
    <div class="metrics-grid">
      ${components.renderMetricCard({
        title: 'Spent This Month',
        value: `${currency}${totalSpentMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        subtitle: `Target Cap: ${currency}${totalMonthlyCap.toLocaleString()}`,
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
        color: '#6366f1'
      })}
      ${components.renderMetricCard({
        title: 'Daily Average',
        value: `${currency}${dailyAverage.toFixed(2)}`,
        subtitle: `Across ${daysPassed} active days`,
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
        color: '#06b6d4'
      })}
      ${components.renderMetricCard({
        title: 'Remaining Budget',
        value: `${currency}${budgetRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        subtitle: budgetRemaining < 0 ? 'Over budget target!' : 'Available for remainder of month',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>',
        color: budgetRemaining < 0 ? '#ef4444' : '#10b981'
      })}
      ${components.renderMetricCard({
        title: 'Logged Expenses',
        value: monthExpenses.length,
        subtitle: 'Transactions this month',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>',
        color: '#8b5cf6'
      })}
    </div>

    <div class="dashboard-grid">
      <div class="left-col">
        <!-- Monthly Breakdown Donut -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Category Spending Breakdown</h2>
          </div>
          ${charts.renderDonutChart(donutData, { currency, width: 260, height: 260 })}
        </div>

        <!-- Recent Transactions -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Recent Transactions</h2>
            <a href="#/expenses" class="btn btn-secondary btn-sm">View All</a>
          </div>
          ${renderTransactionTable(recentExpenses, false)}
        </div>
      </div>

      <div class="right-col">
        <!-- Category Budget Thresholds -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Category Budget Caps</h2>
          </div>
          <div class="budget-meter-list">
            ${budgetMeters.map(b => `
              <div class="budget-item">
                <div class="budget-item-header">
                  <span>
                    ${b.icon} ${b.name}
                    ${b.percentage >= 85 ? `<span class="warning-pill">${b.percentage >= 100 ? 'EXCEEDED' : 'WARNING (>85%)'}</span>` : ''}
                  </span>
                  <span style="color: var(--text-muted)">${currency}${b.spent.toFixed(0)} / ${currency}${b.budgetLimit}</span>
                </div>
                ${charts.renderProgressBar(b.percentage, b.status)}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  bindTableActions(container);
}

// -------------------------------------------------------------
// 2. EXPENSE HISTORY VIEW (#/expenses)
// -------------------------------------------------------------
function renderExpenseHistory(container) {
  const currency = state.settings.currencySymbol;

  // Filter Logic
  let filtered = state.expenses;

  if (state.filters.month !== 'all') {
    filtered = filtered.filter(e => e.date.startsWith(state.filters.month));
  }
  if (state.filters.categoryId !== 'all') {
    filtered = filtered.filter(e => e.categoryId === state.filters.categoryId);
  }
  if (state.filters.paymentMethod !== 'all') {
    filtered = filtered.filter(e => e.paymentMethod === state.filters.paymentMethod);
  }
  if (state.filters.search.trim()) {
    const q = state.filters.search.toLowerCase();
    filtered = filtered.filter(e => e.description.toLowerCase().includes(q));
  }

  const filteredTotal = filtered.reduce((sum, e) => sum + e.amount, 0);

  container.innerHTML = `
    <!-- Filter Controls -->
    <div class="filter-bar">
      <input type="text" id="search-input" class="form-input" placeholder="🔍 Search description..." value="${state.filters.search}">
      
      <input type="month" id="month-input" class="form-input" value="${state.filters.month}">

      <select id="category-filter" class="form-select">
        <option value="all">All Categories</option>
        ${state.categories.map(c => `
          <option value="${c.id}" ${state.filters.categoryId === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>
        `).join('')}
      </select>

      <select id="payment-filter" class="form-select">
        <option value="all">All Payment Methods</option>
        <option value="Card" ${state.filters.paymentMethod === 'Card' ? 'selected' : ''}>Card</option>
        <option value="Cash" ${state.filters.paymentMethod === 'Cash' ? 'selected' : ''}>Cash</option>
        <option value="Bank Transfer" ${state.filters.paymentMethod === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
        <option value="Apple Pay" ${state.filters.paymentMethod === 'Apple Pay' ? 'selected' : ''}>Mobile Pay</option>
      </select>

      <button id="export-csv-btn" class="btn btn-secondary">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        <span>Export CSV</span>
      </button>
    </div>

    <!-- History Summary -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <span style="font-size: 0.9rem; color: var(--text-muted)">Showing <strong>${filtered.length}</strong> matching transaction(s)</span>
      <span style="font-size: 1rem; font-weight: 700;">Filtered Total: <span style="color: var(--primary);">${currency}${filteredTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
    </div>

    <!-- Expense Table -->
    <div class="card" style="padding: 0; overflow: hidden;">
      ${renderTransactionTable(filtered, true)}
    </div>
  `;

  // Attach Filter Listeners
  document.getElementById('search-input')?.addEventListener('input', (e) => {
    state.filters.search = e.target.value;
    renderExpenseHistory(container);
  });
  document.getElementById('month-input')?.addEventListener('change', (e) => {
    state.filters.month = e.target.value;
    renderExpenseHistory(container);
  });
  document.getElementById('category-filter')?.addEventListener('change', (e) => {
    state.filters.categoryId = e.target.value;
    renderExpenseHistory(container);
  });
  document.getElementById('payment-filter')?.addEventListener('change', (e) => {
    state.filters.paymentMethod = e.target.value;
    renderExpenseHistory(container);
  });
  document.getElementById('export-csv-btn')?.addEventListener('click', () => {
    api.exportToCSV(filtered, state.categories);
    components.showToast('CSV Export generated!', 'info');
  });

  bindTableActions(container);
}

// Helper: Render Table
function renderTransactionTable(expenses, showActions = true) {
  if (!expenses || expenses.length === 0) {
    return `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        <p>No expenses found matching the filter criteria.</p>
      </div>
    `;
  }

  const currency = state.settings.currencySymbol;
  const catMap = Object.fromEntries(state.categories.map(c => [c.id, c]));

  return `
    <div class="table-responsive">
      <table class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Payment</th>
            <th style="text-align: right;">Amount</th>
            ${showActions ? '<th style="text-align: center;">Actions</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${expenses.map(exp => {
            const cat = catMap[exp.categoryId];
            return `
              <tr>
                <td>${exp.date}</td>
                <td style="font-weight: 600;">${exp.description}</td>
                <td>${components.renderCategoryPill(cat)}</td>
                <td><span style="font-size: 0.8rem; color: var(--text-muted);">${exp.paymentMethod || 'Card'}</span></td>
                <td style="text-align: right;" class="amount-text">${currency}${exp.amount.toFixed(2)}</td>
                ${showActions ? `
                  <td style="text-align: center;">
                    <button class="btn btn-secondary btn-sm edit-exp-btn" data-id="${exp.id}" title="Edit">✏️</button>
                    <button class="btn btn-danger btn-sm del-exp-btn" data-id="${exp.id}" title="Delete">🗑️</button>
                  </td>
                ` : ''}
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function bindTableActions(container) {
  container.querySelectorAll('.edit-exp-btn').forEach(btn => {
    btn.onclick = () => {
      const exp = state.expenses.find(e => e.id === btn.dataset.id);
      if (exp) {
        components.openExpenseModal({
          expense: exp,
          categories: state.categories,
          currency: state.settings.currencySymbol,
          onSave: (updated) => {
            state.expenses = api.saveExpense(updated);
            components.showToast('Expense updated', 'success');
            renderCurrentView();
          }
        });
      }
    };
  });

  container.querySelectorAll('.del-exp-btn').forEach(btn => {
    btn.onclick = () => {
      if (confirm('Are you sure you want to delete this expense?')) {
        state.expenses = api.deleteExpense(btn.dataset.id);
        components.showToast('Expense removed', 'info');
        renderCurrentView();
      }
    };
  });
}

// -------------------------------------------------------------
// 3. ANALYTICS VIEW (#/analytics)
// -------------------------------------------------------------
function renderAnalytics(container) {
  const currency = state.settings.currencySymbol;

  // Compute 4-Month Trend Data
  const now = new Date();
  const monthItems = [];

  for (let i = 3; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = d.toISOString().substring(0, 7);
    const label = d.toLocaleDateString('en-US', { month: 'short' });

    const total = state.expenses
      .filter(e => e.date.startsWith(monthKey))
      .reduce((sum, e) => sum + e.amount, 0);

    monthItems.push({
      label: label,
      value: total,
      isCurrent: i === 0
    });
  }

  // Payment Method Breakdown
  const paymentTotals = {};
  state.expenses.forEach(e => {
    const p = e.paymentMethod || 'Card';
    paymentTotals[p] = (paymentTotals[p] || 0) + e.amount;
  });

  const paymentColors = { 'Card': '#6366f1', 'Cash': '#10b981', 'Bank Transfer': '#3b82f6', 'Apple Pay': '#ec4899' };
  const paymentDonutData = Object.entries(paymentTotals).map(([method, val]) => ({
    label: method,
    value: val,
    color: paymentColors[method] || '#94a3b8'
  }));

  container.innerHTML = `
    <div class="card" style="margin-bottom: 2rem;">
      <div class="card-header">
        <h2 class="card-title">Monthly Spending Trend</h2>
      </div>
      ${charts.renderBarChart(monthItems, { currency, height: 260 })}
    </div>

    <div class="dashboard-grid">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Payment Method Share</h2>
        </div>
        ${charts.renderDonutChart(paymentDonutData, { currency, width: 240, height: 240 })}
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Category Insights</h2>
        </div>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${state.categories.map(cat => {
            const catExps = state.expenses.filter(e => e.categoryId === cat.id);
            const total = catExps.reduce((s, e) => s + e.amount, 0);
            const count = catExps.length;
            const avg = count > 0 ? (total / count) : 0;

            return `
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 0.6rem;">
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                  <span>${cat.icon}</span>
                  <div>
                    <div style="font-weight: 600; font-size: 0.9rem;">${cat.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${count} transactions • avg ${currency}${avg.toFixed(1)}</div>
                  </div>
                </div>
                <div style="font-weight: 700; font-size: 0.95rem;">${currency}${total.toFixed(2)}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------
// 4. CATEGORIES & BUDGETS VIEW (#/categories)
// -------------------------------------------------------------
function renderCategories(container) {
  const currency = state.settings.currencySymbol;
  const curMonthStr = new Date().toISOString().substring(0, 7);

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <p style="color: var(--text-muted); font-size: 0.9rem;">Manage spending caps per category and receive alerts when threshold exceeds 85%.</p>
      <button id="add-cat-btn" class="btn btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        <span>New Category</span>
      </button>
    </div>

    <div class="category-grid">
      ${state.categories.map(cat => {
        const spent = state.expenses
          .filter(e => e.categoryId === cat.id && e.date.startsWith(curMonthStr))
          .reduce((sum, e) => sum + e.amount, 0);

        const limit = cat.budgetLimit || 1;
        const percent = Math.round((spent / limit) * 100);
        let status = 'safe';
        if (percent > 100) status = 'danger';
        else if (percent >= 85) status = 'warning';

        return `
          <div class="category-card">
            <div class="category-card-top">
              <div class="category-info">
                <div class="category-icon-box" style="background-color: ${cat.color}22; color: ${cat.color};">
                  ${cat.icon}
                </div>
                <div>
                  <h3 style="font-size: 1rem; font-weight: 700;">${cat.name}</h3>
                  <span style="font-size: 0.78rem; color: var(--text-muted)">Limit: ${currency}${cat.budgetLimit}/mo</span>
                </div>
              </div>
              <div style="display: flex; gap: 0.3rem;">
                <button class="btn btn-secondary btn-sm edit-cat-btn" data-id="${cat.id}">✏️</button>
                <button class="btn btn-danger btn-sm del-cat-btn" data-id="${cat.id}">🗑️</button>
              </div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.3rem; font-weight: 600;">
                <span>Spent: ${currency}${spent.toFixed(2)}</span>
                <span style="color: ${status === 'danger' ? 'var(--accent-danger)' : status === 'warning' ? 'var(--accent-warning)' : 'var(--text-muted)'}">${percent}%</span>
              </div>
              ${charts.renderProgressBar(percent, status)}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  document.getElementById('add-cat-btn')?.addEventListener('click', () => {
    components.openCategoryModal({
      currency,
      onSave: (catData) => {
        state.categories = api.saveCategory(catData);
        components.showToast('Category created!', 'success');
        renderCategories(container);
      }
    });
  });

  container.querySelectorAll('.edit-cat-btn').forEach(btn => {
    btn.onclick = () => {
      const cat = state.categories.find(c => c.id === btn.dataset.id);
      if (cat) {
        components.openCategoryModal({
          category: cat,
          currency,
          onSave: (updated) => {
            state.categories = api.saveCategory(updated);
            components.showToast('Category updated!', 'success');
            renderCategories(container);
          }
        });
      }
    };
  });

  container.querySelectorAll('.del-cat-btn').forEach(btn => {
    btn.onclick = () => {
      if (confirm('Delete this category? Associated expenses will remain as uncategorized.')) {
        state.categories = api.deleteCategory(btn.dataset.id);
        components.showToast('Category deleted', 'info');
        renderCategories(container);
      }
    };
  });
}

// -------------------------------------------------------------
// 5. SETTINGS VIEW (#/settings)
// -------------------------------------------------------------
function renderSettings(container) {
  container.innerHTML = `
    <div style="max-width: 600px; display: flex; flex-direction: column; gap: 1.5rem;">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Preferences</h2>
        </div>
        
        <form id="settings-form">
          <div class="form-group">
            <label class="form-label">Currency Symbol</label>
            <select class="form-select" name="currencySymbol">
              <option value="$" ${state.settings.currencySymbol === '$' ? 'selected' : ''}>$ (USD / AUD / CAD)</option>
              <option value="€" ${state.settings.currencySymbol === '€' ? 'selected' : ''}>€ (EUR)</option>
              <option value="£" ${state.settings.currencySymbol === '£' ? 'selected' : ''}>£ (GBP)</option>
              <option value="¥" ${state.settings.currencySymbol === '¥' ? 'selected' : ''}>¥ (JPY / CNY)</option>
              <option value="₹" ${state.settings.currencySymbol === '₹' ? 'selected' : ''}>₹ (INR)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Overall Monthly Target Budget Cap</label>
            <input type="number" class="form-input" name="monthlyBudget" value="${state.settings.monthlyBudget || 3000}">
          </div>

          <div class="form-group">
            <label class="form-label">Color Theme</label>
            <select class="form-select" name="theme">
              <option value="dark" ${state.settings.theme === 'dark' ? 'selected' : ''}>Dark Theme (Default)</option>
              <option value="light" ${state.settings.theme === 'light' ? 'selected' : ''}>Light Theme</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem;">Save Settings</button>
        </form>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Data Management & Backup</h2>
        </div>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1rem;">Export or restore your full financial dataset in JSON format, or reset back to pre-seeded demo values.</p>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button id="backup-json-btn" class="btn btn-secondary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <span>Download JSON Backup</span>
          </button>

          <label class="btn btn-secondary" style="cursor: pointer;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            <span>Restore JSON</span>
            <input type="file" id="restore-json-input" accept=".json" style="display: none;">
          </label>

          <button id="reset-demo-btn" class="btn btn-danger">Reset to Seed Demo Data</button>
        </div>
      </div>
    </div>
  `;

  // Settings Submit
  document.getElementById('settings-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updated = {
      currencySymbol: formData.get('currencySymbol'),
      monthlyBudget: parseFloat(formData.get('monthlyBudget')),
      theme: formData.get('theme')
    };

    state.settings = api.saveSettings(updated);
    document.documentElement.setAttribute('data-theme', state.settings.theme);
    components.showToast('Settings saved!', 'success');
  });

  // Backup & Restore Handlers
  document.getElementById('backup-json-btn')?.addEventListener('click', () => {
    api.exportBackupJSON();
    components.showToast('JSON Backup downloaded', 'info');
  });

  document.getElementById('restore-json-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const success = api.importBackupJSON(event.target.result);
      if (success) {
        loadData();
        components.showToast('Data restored successfully!', 'success');
        renderCurrentView();
      } else {
        components.showToast('Invalid backup file format.', 'danger');
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('reset-demo-btn')?.addEventListener('click', () => {
    if (confirm('This will wipe all existing entries and reset demo expenses. Continue?')) {
      const res = api.resetDemoData();
      state.expenses = res.expenses;
      state.categories = res.categories;
      state.settings = res.settings;
      components.showToast('Demo data restored!', 'info');
      renderCurrentView();
    }
  });
}

// Start Application on Load
document.addEventListener('DOMContentLoaded', init);
