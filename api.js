// LocalStorage Data Engine for Spendwise
const STORAGE_KEYS = {
  EXPENSES: 'spendwise_expenses',
  CATEGORIES: 'spendwise_categories',
  SETTINGS: 'spendwise_settings'
};

const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Food & Dining', icon: '🍕', color: '#f97316', budgetLimit: 500 },
  { id: 'cat-2', name: 'Housing & Utilities', icon: '🏠', color: '#3b82f6', budgetLimit: 1400 },
  { id: 'cat-3', name: 'Transport', icon: '🚗', color: '#06b6d4', budgetLimit: 250 },
  { id: 'cat-4', name: 'Shopping', icon: '🛍️', color: '#ec4899', budgetLimit: 350 },
  { id: 'cat-5', name: 'Entertainment', icon: '🎬', color: '#8b5cf6', budgetLimit: 180 },
  { id: 'cat-6', name: 'Health & Fitness', icon: '💊', color: '#10b981', budgetLimit: 200 },
  { id: 'cat-7', name: 'Bills & Tech', icon: '💳', color: '#64748b', budgetLimit: 150 }
];

const DEFAULT_SETTINGS = {
  currencySymbol: '$',
  monthlyBudget: 3000,
  theme: 'dark'
};

function generateSeedExpenses() {
  const categories = DEFAULT_CATEGORIES;
  const paymentMethods = ['Card', 'Cash', 'Bank Transfer', 'Apple Pay'];
  const expenses = [];
  const now = new Date();

  // Create sample expenses spanning current month and past 2 months
  const descriptions = {
    'cat-1': ['Grocery Supermarket', 'Coffee Shop', 'Italian Bistro', 'Sushi Dinner', 'Bakery Snacks'],
    'cat-2': ['Monthly Rent', 'Electricity Bill', 'Highspeed Internet', 'Water Utility'],
    'cat-3': ['Gas Station Refill', 'Uber Ride', 'Metro Pass', 'Car Wash'],
    'cat-4': ['Summer Clothing', 'Electronics Store', 'Online Books', 'Home Decor'],
    'cat-5': ['Movie Cinema', 'Streaming Service', 'Concert Ticket', 'Board Game'],
    'cat-6': ['Gym Membership', 'Pharmacy Supplies', 'Dental Checkup'],
    'cat-7': ['Cloud Storage Sub', 'Software License', 'Mobile Phone Plan']
  };

  let idCounter = 1000;

  for (let m = 0; m < 3; m++) {
    const year = now.getFullYear();
    const month = now.getMonth() - m;
    const targetDate = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Generate 12-18 expenses per month
    const count = 14 + (m === 0 ? 4 : 0);
    for (let i = 0; i < count; i++) {
      const day = Math.min(daysInMonth, Math.floor(Math.random() * daysInMonth) + 1);
      // Skip future days in current month
      if (m === 0 && day > now.getDate()) continue;

      const cat = categories[Math.floor(Math.random() * categories.length)];
      const descs = descriptions[cat.id] || ['General Expense'];
      const desc = descs[Math.floor(Math.random() * descs.length)];
      const pMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      let baseAmount = Math.floor(Math.random() * 45) + 10;
      if (cat.id === 'cat-2' && desc.includes('Rent')) baseAmount = 1100;
      else if (cat.id === 'cat-2') baseAmount = 85;

      const dateStr = new Date(year, month, day).toISOString().split('T')[0];

      expenses.push({
        id: `exp-${idCounter++}`,
        amount: baseAmount,
        categoryId: cat.id,
        date: dateStr,
        description: desc,
        paymentMethod: pMethod,
        createdAt: new Date(year, month, day, 12, 0).toISOString()
      });
    }
  }

  return expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Initial storage boot check
export function initStore() {
  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
    const seed = generateSeedExpenses();
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(seed));
  }
}

// Settings Methods
export function getSettings() {
  initStore();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || DEFAULT_SETTINGS;
}

export function saveSettings(settings) {
  const current = getSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  return updated;
}

// Category Methods
export function getCategories() {
  initStore();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES)) || DEFAULT_CATEGORIES;
}

export function saveCategory(category) {
  const categories = getCategories();
  let updated;
  if (category.id) {
    updated = categories.map(c => c.id === category.id ? { ...c, ...category } : c);
  } else {
    const newCat = {
      ...category,
      id: `cat-${Date.now()}`
    };
    updated = [...categories, newCat];
  }
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
  return updated;
}

export function deleteCategory(id) {
  const categories = getCategories().filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  return categories;
}

// Expense Methods
export function getExpenses() {
  initStore();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES)) || [];
}

export function saveExpense(expense) {
  const expenses = getExpenses();
  let updated;
  if (expense.id) {
    updated = expenses.map(e => e.id === expense.id ? { ...e, ...expense, amount: parseFloat(expense.amount) } : e);
  } else {
    const newExp = {
      ...expense,
      amount: parseFloat(expense.amount),
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    updated = [newExp, ...expenses];
  }
  updated.sort((a, b) => new Date(b.date) - new Date(a.date));
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updated));
  return updated;
}

export function deleteExpense(id) {
  const expenses = getExpenses().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  return expenses;
}

export function resetDemoData() {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  const seed = generateSeedExpenses();
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(seed));
  return { categories: DEFAULT_CATEGORIES, settings: DEFAULT_SETTINGS, expenses: seed };
}

// Data Export & Import
export function exportToCSV(expenses, categories) {
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
  const headers = ['ID', 'Date', 'Description', 'Category', 'Amount', 'Payment Method'];
  
  const rows = expenses.map(exp => [
    exp.id,
    exp.date,
    `"${(exp.description || '').replace(/"/g, '""')}"`,
    `"${catMap[exp.categoryId] || 'Uncategorized'}"`,
    exp.amount,
    `"${exp.paymentMethod || 'Other'}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `spendwise_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportBackupJSON() {
  const data = {
    expenses: getExpenses(),
    categories: getCategories(),
    settings: getSettings(),
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spendwise_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackupJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.expenses && data.categories && data.settings) {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(data.expenses));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      return true;
    }
  } catch (err) {
    console.error('Import error:', err);
  }
  return false;
}
