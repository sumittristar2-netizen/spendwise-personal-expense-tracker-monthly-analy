// UI Components and Modal Handlers for Spendwise

export function renderMetricCard({ title, value, subtitle, icon, color = 'var(--primary)' }) {
  return `
    <div class="metric-card">
      <div class="metric-header">
        <span class="metric-title">${title}</span>
        <div class="metric-icon" style="color: ${color}">
          ${icon}
        </div>
      </div>
      <div class="metric-value">${value}</div>
      <div class="metric-subtitle">${subtitle}</div>
    </div>
  `;
}

export function renderCategoryPill(category) {
  if (!category) {
    return `<span class="cat-pill" style="background-color: var(--bg-elevated); color: var(--text-muted)">Uncategorized</span>`;
  }
  const bg = category.color + '22'; // 13% opacity
  return `
    <span class="cat-pill" style="background-color: ${bg}; color: ${category.color}">
      <span>${category.icon}</span>
      <span>${category.name}</span>
    </span>
  `;
}

export function showToast(message, type = 'info') {
  const root = document.getElementById('toast-root');
  if (!root) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;

  root.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function openExpenseModal(options = {}) {
  const { expense, categories, currency, onSave } = options;
  const isEdit = !!expense;
  const modalRoot = document.getElementById('modal-root');

  const today = new Date().toISOString().split('T')[0];

  const html = `
    <div class="modal-overlay" id="expense-modal">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">${isEdit ? 'Edit Expense' : 'Log New Expense'}</h3>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <form id="expense-form">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Amount (${currency})</label>
              <input type="number" step="0.01" min="0.01" class="form-input" name="amount" value="${expense ? expense.amount : ''}" placeholder="0.00" required autofocus>
            </div>

            <div class="form-group">
              <label class="form-label">Description / Merchant</label>
              <input type="text" class="form-input" name="description" value="${expense ? (expense.description || '') : ''}" placeholder="e.g. Grocery store, Netflix" required>
            </div>

            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-select" name="categoryId" required>
                ${categories.map(c => `
                  <option value="${c.id}" ${expense && expense.categoryId === c.id ? 'selected' : ''}>
                    ${c.icon} ${c.name}
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Date</label>
              <input type="date" class="form-input" name="date" value="${expense ? expense.date : today}" required>
            </div>

            <div class="form-group">
              <label class="form-label">Payment Method</label>
              <select class="form-select" name="paymentMethod">
                <option value="Card" ${expense && expense.paymentMethod === 'Card' ? 'selected' : ''}>Credit/Debit Card</option>
                <option value="Cash" ${expense && expense.paymentMethod === 'Cash' ? 'selected' : ''}>Cash</option>
                <option value="Bank Transfer" ${expense && expense.paymentMethod === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
                <option value="Apple Pay" ${expense && expense.paymentMethod === 'Apple Pay' ? 'selected' : ''}>Mobile Pay (Apple/Google)</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Update Expense' : 'Add Expense'}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  modalRoot.innerHTML = html;

  const modalOverlay = document.getElementById('expense-modal');
  const close = () => { modalRoot.innerHTML = ''; };

  document.getElementById('modal-close-btn').onclick = close;
  document.getElementById('modal-cancel-btn').onclick = close;
  modalOverlay.onclick = (e) => { if (e.target === modalOverlay) close(); };

  document.getElementById('expense-form').onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      amount: formData.get('amount'),
      description: formData.get('description'),
      categoryId: formData.get('categoryId'),
      date: formData.get('date'),
      paymentMethod: formData.get('paymentMethod')
    };
    if (expense) data.id = expense.id;

    onSave(data);
    close();
  };
}

export function openCategoryModal(options = {}) {
  const { category, currency, onSave } = options;
  const isEdit = !!category;
  const modalRoot = document.getElementById('modal-root');

  const icons = ['🍕', '🏠', '🚗', '🛍️', '🎬', '💊', '💳', '✈️', '🎓', '🐾', '⚽', '💡'];
  const colors = ['#f97316', '#3b82f6', '#06b6d4', '#ec4899', '#8b5cf6', '#10b981', '#64748b', '#eab308', '#ef4444', '#14b8a6'];

  const html = `
    <div class="modal-overlay" id="category-modal">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="modal-title">${isEdit ? 'Edit Category' : 'Create Category'}</h3>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <form id="category-form">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Category Name</label>
              <input type="text" class="form-input" name="name" value="${category ? category.name : ''}" placeholder="e.g. Travel, Pet Care" required>
            </div>

            <div class="form-group">
              <label class="form-label">Monthly Budget Cap (${currency})</label>
              <input type="number" step="10" min="0" class="form-input" name="budgetLimit" value="${category ? category.budgetLimit : 300}" placeholder="300" required>
            </div>

            <div class="form-group">
              <label class="form-label">Icon</label>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${icons.map(icon => `
                  <label style="cursor: pointer;">
                    <input type="radio" name="icon" value="${icon}" ${category && category.icon === icon ? 'checked' : (icon === '🍕' && !category ? 'checked' : '')} style="display:none">
                    <span class="icon-option" style="padding: 0.4rem 0.6rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); display: inline-block;">${icon}</span>
                  </label>
                `).join('')}
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Accent Color</label>
              <input type="color" class="form-input" name="color" value="${category ? category.color : '#3b82f6'}" style="height: 40px; padding: 2px; cursor: pointer;">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Create Category'}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  modalRoot.innerHTML = html;

  const close = () => { modalRoot.innerHTML = ''; };

  document.getElementById('modal-close-btn').onclick = close;
  document.getElementById('modal-cancel-btn').onclick = close;

  document.getElementById('category-form').onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      budgetLimit: parseFloat(formData.get('budgetLimit')),
      icon: formData.get('icon') || '📦',
      color: formData.get('color')
    };
    if (category) data.id = category.id;

    onSave(data);
    close();
  };
}
