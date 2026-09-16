/**
 * EXPENSE & BUDGET VISUALIZER — app.js
 * Modern Financial Tracker · Vanilla ES6+ · localStorage · Chart.js
 *
 * Architecture: single centralised state object → saveState() → renderAll()
 *   - No frameworks, no build step, no external dependencies except Chart.js CDN
 *   - All state mutations must call saveState() then renderAll() (or a subset)
 */

'use strict';

// ─────────────────────────────────────────────
// 1. CONSTANTS & DEFAULT DATA
// ─────────────────────────────────────────────

const STORAGE_KEY = 'expenseApp_v1';

const DEFAULT_CATEGORIES = [
    { id: 'cat_food',      name: 'Food',      color: '#F97316', isCustom: false },
    { id: 'cat_transport', name: 'Transport', color: '#0EA5E9', isCustom: false },
    { id: 'cat_fun',       name: 'Fun',       color: '#8B5CF6', isCustom: false }
];

// ─────────────────────────────────────────────
// 2. APPLICATION STATE
// ─────────────────────────────────────────────

/**
 * Single source of truth. Every UI read comes from here;
 * every UI write mutates this then calls saveState().
 *
 * @type {{
 *   theme: 'light'|'dark'|'system',
 *   monthlyBudget: number,
 *   selectedMonth: string,   // 'YYYY-MM' or 'ALL'
 *   sortBy: string,
 *   filterCategory: string,  // 'ALL' or category id
 *   categories: Array<{id,name,color,isCustom}>,
 *   transactions: Array<{id,title,amount,categoryId,date}>
 * }}
 */
let state = {
    theme:          'light',
    monthlyBudget:  2500000,
    selectedMonth:  'ALL',
    sortBy:         'date-desc',
    filterCategory: 'ALL',
    categories:     [],
    transactions:   []
};

/** Currently rendered Chart.js instance (destroyed before re-render) */
let chartInstance = null;

/** Transaction id queued for deletion, set when the delete modal opens */
let pendingDeleteId = null;

// ─────────────────────────────────────────────
// 3. UTILITIES
// ─────────────────────────────────────────────

/** Generate a collision-resistant unique id */
const uid = () => `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

/**
 * Format a number as Indonesian Rupiah.
 * Falls back gracefully when Intl is unavailable.
 */
const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'Rp 0';
    try {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR',
            minimumFractionDigits: 0, maximumFractionDigits: 0
        }).format(amount);
    } catch {
        return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
    }
};

/**
 * Format a 'YYYY-MM-DD' string as 'DD Mon YYYY'.
 * Parses the date parts directly to avoid UTC/local timezone shift.
 */
const formatDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
    });
};

/** Today as 'YYYY-MM-DD' in local time */
const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Current month as 'YYYY-MM' in local time */
const currentMonthStr = () => todayStr().slice(0, 7);

/** Return 'YYYY-MM' for N months offset from a base 'YYYY-MM' string */
const shiftMonth = (ym, delta) => {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// ─────────────────────────────────────────────
// 4. STATE PERSISTENCE (localStorage)
// ─────────────────────────────────────────────

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn('localStorage write failed:', e);
    }
}

/**
 * Load persisted state. Merges against defaults to handle
 * schema additions across versions (basic migration).
 */
function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            seedDefaultData();
            return;
        }

        const saved = JSON.parse(raw);

        state = {
            theme:          (saved.theme && saved.theme !== 'system') ? saved.theme : 'light',
            monthlyBudget:  saved.monthlyBudget  ?? 2500000,
            selectedMonth:  saved.selectedMonth  ?? 'ALL',
            sortBy:         saved.sortBy         ?? 'date-desc',
            filterCategory: saved.filterCategory ?? 'ALL',
            categories:     Array.isArray(saved.categories)    ? saved.categories    : [...DEFAULT_CATEGORIES],
            transactions:   Array.isArray(saved.transactions)  ? saved.transactions  : []
        };

        // Ensure every default category is still present (schema migration)
        DEFAULT_CATEGORIES.forEach(def => {
            if (!state.categories.find(c => c.id === def.id)) {
                state.categories.unshift(def);
            }
        });

    } catch (e) {
        console.error('State load failed, reverting to defaults:', e);
        seedDefaultData();
    }
}

/** Populate fresh state with sample data so the UI is never a blank void */
function seedDefaultData() {
    const today     = todayStr();
    const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
    const twoDaysAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 2); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();

    state.categories  = [...DEFAULT_CATEGORIES];
    state.transactions = [
        { id: uid(), title: 'Starbucks Americano',  amount: 45000,  categoryId: 'cat_food',      date: today },
        { id: uid(), title: 'Grab Transport',        amount: 25000,  categoryId: 'cat_transport', date: yesterday },
        { id: uid(), title: 'Movie Ticket',          amount: 65000,  categoryId: 'cat_fun',       date: twoDaysAgo }
    ];
    saveState();
}

// ─────────────────────────────────────────────
// 5. THEME
// ─────────────────────────────────────────────

function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme || 'light');
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    saveState();
    // Rebuild chart so tooltip/border colors update immediately
    renderChart();
}

// ─────────────────────────────────────────────
// 6. DERIVED DATA HELPERS
// ─────────────────────────────────────────────

function getCategoryById(id) {
    return state.categories.find(c => c.id === id) ?? state.categories[0] ?? DEFAULT_CATEGORIES[0];
}

/** Transactions matching the active month + category filters, then sorted */
function getFilteredTransactions() {
    let list = [...state.transactions];

    if (state.selectedMonth !== 'ALL') {
        list = list.filter(t => t.date.startsWith(state.selectedMonth));
    }
    if (state.filterCategory !== 'ALL') {
        list = list.filter(t => t.categoryId === state.filterCategory);
    }

    list.sort((a, b) => {
        switch (state.sortBy) {
            case 'date-desc':      return b.date.localeCompare(a.date);
            case 'date-asc':       return a.date.localeCompare(b.date);
            case 'amount-desc':    return b.amount - a.amount;
            case 'amount-asc':     return a.amount - b.amount;
            case 'category-asc': {
                const na = getCategoryById(a.categoryId).name;
                const nb = getCategoryById(b.categoryId).name;
                return na.localeCompare(nb);
            }
            case 'category-desc': {
                const na = getCategoryById(a.categoryId).name;
                const nb = getCategoryById(b.categoryId).name;
                return nb.localeCompare(na);
            }
            default:               return b.date.localeCompare(a.date);
        }
    });

    return list;
}

/** Spending grouped by categoryId for the current filter view */
function getSpendingByCategory() {
    const map = {};
    getFilteredTransactions().forEach(t => {
        map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount;
    });
    return map;
}

/** Total spent across filtered transactions */
function getTotalSpending() {
    return getFilteredTransactions().reduce((sum, t) => sum + t.amount, 0);
}

// ─────────────────────────────────────────────
// 7. TRANSACTION CRUD
// ─────────────────────────────────────────────

function addTransaction({ title, amount, categoryId, date }) {
    state.transactions.push({ id: uid(), title: title.trim(), amount, categoryId, date });
    saveState();
    renderAll();
}

function deleteTransaction(id) {
    state.transactions = state.transactions.filter(t => t.id !== id);
    saveState();
    renderAll();
}

// ─────────────────────────────────────────────
// 8. CATEGORY CRUD
// ─────────────────────────────────────────────

function addCategory({ name, color }) {
    state.categories.push({ id: uid(), name: name.trim(), color, isCustom: true });
    saveState();
    renderCategoryDropdown();
    renderCategoryFilters();
    renderCategoryModalList();
}

/**
 * Delete a custom category. Reassigns its transactions to the first
 * non-custom (default) category to preserve data integrity.
 */
function deleteCategory(id) {
    const fallback = state.categories.find(c => !c.isCustom) ?? state.categories[0];
    state.transactions.forEach(t => { if (t.categoryId === id) t.categoryId = fallback.id; });
    state.categories = state.categories.filter(c => c.id !== id);

    // Reset the active filter if we just removed the filtered category
    if (state.filterCategory === id) state.filterCategory = 'ALL';

    saveState();
    renderAll();
    renderCategoryModalList();
}

// ─────────────────────────────────────────────
// 9. RENDER FUNCTIONS
// ─────────────────────────────────────────────

/** Master render — call after any state mutation */
function renderAll() {
    renderBalanceCard();
    renderBudgetCard();
    renderTransactionsList();
    renderChart();
    renderTimeDisplay();
    renderCategoryFilters();
    renderCategoryDropdown();
}

// ── 9a. Balance card ────────────────────────

function renderBalanceCard() {
    const total    = getTotalSpending();
    const filtered = getFilteredTransactions();

    document.getElementById('balanceAmount').textContent    = formatCurrency(total);
    document.getElementById('transactionsCount').textContent = String(filtered.length);

    // Active filter label
    let label = 'All Time';
    if (state.selectedMonth !== 'ALL') {
        const [y, m] = state.selectedMonth.split('-').map(Number);
        label = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (state.filterCategory !== 'ALL') {
        label += ` · ${getCategoryById(state.filterCategory).name}`;
    }
    document.getElementById('activeFilter').textContent = label;
}

// ── 9b. Budget card ─────────────────────────

function renderBudgetCard() {
    // Use the active month filter; fall back to current calendar month for "All Time"
    const targetMonth = state.selectedMonth === 'ALL' ? currentMonthStr() : state.selectedMonth;
    const spent = state.transactions
        .filter(t => t.date.startsWith(targetMonth))
        .reduce((sum, t) => sum + t.amount, 0);

    const limit      = state.monthlyBudget;
    const pct        = limit > 0 ? (spent / limit) * 100 : 0;
    const clampedPct = Math.min(pct, 100);

    // Update the card title to show which month we're tracking
    const [y, m] = targetMonth.split('-').map(Number);
    const monthLabel = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    document.querySelector('.budget-card .card-title').textContent = `Budget — ${monthLabel}`;

    document.getElementById('budgetLimit').textContent = formatCurrency(limit);
    document.getElementById('budgetSpent').textContent = formatCurrency(spent);

    const fill = document.getElementById('progressFill');
    const text = document.getElementById('progressText');
    fill.style.width   = clampedPct + '%';
    text.textContent   = `${Math.round(pct)}% used`;

    const badge = document.getElementById('budgetStatus');
    const alert = document.getElementById('budgetAlert');

    // Reset
    alert.className = 'budget-alert';
    alert.textContent = '';

    let badgeClass = 'status-safe';
    let badgeText  = 'Normal';

    if (pct >= 100) {
        badgeClass            = 'status-danger';
        badgeText             = 'Over Budget';
        fill.style.background = 'var(--color-danger)';
        alert.className       = 'budget-alert show danger';
        alert.textContent     = `🚨 Budget Exceeded by ${formatCurrency(spent - limit)}`;
    } else if (pct >= 80) {
        badgeClass            = 'status-warning';
        badgeText             = 'Approaching Limit';
        fill.style.background = 'var(--color-warning)';
        alert.className       = 'budget-alert show warning';
        alert.textContent     = `⚠️ You have used ${Math.round(pct)}% of your monthly budget`;
    } else {
        fill.style.background = 'var(--color-surplus)';
    }

    badge.innerHTML = `<span class="status-badge ${badgeClass}">${badgeText}</span>`;
}

// ── 9c. Transactions list ───────────────────

function renderTransactionsList() {
    const list = document.getElementById('transactionsList');
    const items = getFilteredTransactions();

    document.getElementById('filteredCount').textContent =
        `${items.length} item${items.length !== 1 ? 's' : ''}`;

    if (items.length === 0) {
        list.innerHTML = `
            <div class="empty-transactions">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                </svg>
                <h3>No expenses found</h3>
                <p>${state.filterCategory !== 'ALL' ? 'Try changing your filters' : 'Add your first expense using the form'}</p>
            </div>`;
        return;
    }

    list.innerHTML = items.map(t => {
        const cat = getCategoryById(t.categoryId);
        // Escape title to prevent XSS from stored user input
        const safeTitle = t.title.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        return `
            <div class="transaction-item">
                <div class="transaction-category" style="background-color:${cat.color}"></div>
                <div class="transaction-content">
                    <div class="transaction-title">${safeTitle}</div>
                    <div class="transaction-meta">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8"  y1="2" x2="8"  y2="6"/>
                            <line x1="3"  y1="10" x2="21" y2="10"/>
                        </svg>
                        <span>${formatDate(t.date)}</span>
                        <span>·</span>
                        <span>${cat.name}</span>
                    </div>
                </div>
                <div class="transaction-amount tabular-nums">${formatCurrency(t.amount)}</div>
                <div class="transaction-actions">
                    <button class="delete-btn" data-id="${t.id}" aria-label="Delete ${safeTitle}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>`;
    }).join('');
}

// ── 9d. Chart.js donut ──────────────────────

function renderChart() {
    const canvas    = document.getElementById('spendingChart');
    const container = canvas.closest('.chart-container');
    const empty     = document.getElementById('chartEmpty');
    const spending  = getSpendingByCategory();
    const hasData   = Object.keys(spending).length > 0;

    if (!hasData) {
        container.style.display = 'none';
        empty.style.display     = 'flex';
        // Destroy stale chart if present
        if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
        document.getElementById('chartLegend').innerHTML = '';
        return;
    }

    container.style.display = 'block';
    empty.style.display     = 'none';

    // Always destroy before recreating — prevents canvas ghosting / memory leaks
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

    const labels = [], data = [], colors = [];
    Object.entries(spending).forEach(([catId, amt]) => {
        const cat = getCategoryById(catId);
        labels.push(cat.name);
        data.push(amt);
        colors.push(cat.color);
    });

    const isDark    = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#F8FAFC' : '#0F172A';
    const bgColor   = isDark ? '#1E293B' : '#FFFFFF';
    const border    = isDark ? '#243047' : '#E2E8F0';
    const cardBg    = isDark ? '#131B2A' : '#FFFFFF';

    chartInstance = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: cardBg,
                hoverBorderWidth: 3,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: bgColor,
                    titleColor: textColor,
                    bodyColor: textColor,
                    borderColor: border,
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 10,
                    callbacks: {
                        label(ctx) {
                            const total   = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct     = Math.round((ctx.parsed / total) * 100);
                            return `  ${ctx.label}: ${formatCurrency(ctx.parsed)} (${pct}%)`;
                        }
                    }
                }
            },
            animation: { animateRotate: true, duration: 700, easing: 'easeOutQuart' }
        }
    });

    // Custom legend
    const total = data.reduce((a, b) => a + b, 0);
    document.getElementById('chartLegend').innerHTML = labels.map((lbl, i) => `
        <div class="legend-item">
            <div class="legend-color" style="background:${colors[i]}"></div>
            <span>${lbl} — ${Math.round((data[i] / total) * 100)}%</span>
        </div>`).join('');
}

// ── 9e. Time display ────────────────────────

function renderTimeDisplay() {
    const el     = document.getElementById('currentMonth');
    const toggle = document.getElementById('toggleTimeRange');

    if (state.selectedMonth === 'ALL') {
        el.textContent     = 'All Time';
        toggle.textContent = 'This Month';
    } else {
        const [y, m] = state.selectedMonth.split('-').map(Number);
        el.textContent     = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        toggle.textContent = 'All Time';
    }

    // Disable next-button when on current month OR viewing All Time (no future to go to)
    const nextBtn = document.getElementById('nextMonthBtn');
    const isAllTime      = state.selectedMonth === 'ALL';
    const isCurrentMonth = !isAllTime && state.selectedMonth >= currentMonthStr();
    nextBtn.disabled      = isAllTime || isCurrentMonth;
    nextBtn.style.opacity = nextBtn.disabled ? '0.35' : '1';
    nextBtn.title         = isAllTime ? 'Switch to a specific month first' : '';
}

// ── 9f. Category dropdown (form) ────────────

function renderCategoryDropdown() {
    const sel = document.getElementById('itemCategory');
    const cur = sel.value; // preserve selection if still valid
    sel.innerHTML =
        '<option value="">Select a category</option>' +
        state.categories.map(c =>
            `<option value="${c.id}"${c.id === cur ? ' selected' : ''}>${c.name}</option>`
        ).join('');
}

// ── 9g. Category filter pills ───────────────

function renderCategoryFilters() {
    document.getElementById('categoryFilters').innerHTML =
        [{ id: 'ALL', name: 'All', color: null }, ...state.categories].map(c => {
            const isActive = state.filterCategory === c.id;
            const dot      = c.color ? `<div class="category-dot" style="background:${c.color}"></div>` : '';
            return `<button class="category-filter${isActive ? ' active' : ''}" data-cat="${c.id}">${dot}${c.name}</button>`;
        }).join('');
}

// ── 9h. Category modal list ─────────────────

function renderCategoryModalList() {
    const container = document.getElementById('categoriesList');
    const customs   = state.categories.filter(c => c.isCustom);

    if (customs.length === 0) {
        container.innerHTML = `
            <p style="color:var(--text-muted);font-size:.875rem;text-align:center;padding:1.5rem 0">
                No custom categories yet — add one above.
            </p>`;
        return;
    }

    container.innerHTML = customs.map(c => {
        const count    = state.transactions.filter(t => t.categoryId === c.id).length;
        const safeName = c.name.replace(/</g,'&lt;').replace(/>/g,'&gt;');
        return `
            <div class="category-item">
                <div class="category-color" style="background:${c.color}"></div>
                <div class="category-name">${safeName}</div>
                <div class="category-count">${count} txn${count !== 1 ? 's' : ''}</div>
                <button class="category-delete" data-cat-del="${c.id}" aria-label="Delete ${safeName}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>`;
    }).join('');
}

// ─────────────────────────────────────────────
// 10. FORM VALIDATION & SUBMISSION
// ─────────────────────────────────────────────

function handleTransactionSubmit(e) {
    e.preventDefault();

    // Read directly from DOM elements (no FormData needed — inputs have no name attr)
    const title      = document.getElementById('itemName').value;
    const amount     = document.getElementById('itemAmount').value;
    const categoryId = document.getElementById('itemCategory').value;
    const date       = document.getElementById('itemDate').value;

    // Clear previous inline errors
    document.getElementById('itemNameError').textContent     = '';
    document.getElementById('itemAmountError').textContent   = '';
    document.getElementById('itemCategoryError').textContent = '';

    let valid = true;

    if (!title.trim()) {
        document.getElementById('itemNameError').textContent = 'Item name is required';
        valid = false;
    } else if (title.trim().length > 50) {
        document.getElementById('itemNameError').textContent = 'Maximum 50 characters';
        valid = false;
    }

    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
        document.getElementById('itemAmountError').textContent = 'Enter a valid amount greater than 0';
        valid = false;
    }

    if (!categoryId) {
        document.getElementById('itemCategoryError').textContent = 'Please select a category';
        valid = false;
    }

    if (!date) {
        valid = false; // date input with required attribute handles its own browser hint
    }

    if (!valid) return;

    addTransaction({ title, amount: amt, categoryId, date });

    // Reset form but keep today as date default
    e.target.reset();
    document.getElementById('itemDate').value = todayStr();
    document.getElementById('itemName').focus();

    // Momentary success feedback on the button
    const btn = e.target.querySelector('.submit-btn');
    const orig = btn.innerHTML;
    btn.innerHTML = '✓ Added!';
    btn.style.background = 'var(--color-surplus)';
    setTimeout(() => {
        btn.innerHTML = orig;
        btn.style.background = '';
    }, 1500);
}

function handleBudgetSubmit(e) {
    e.preventDefault();
    const val = parseFloat(document.getElementById('newBudget').value);
    if (isNaN(val) || val <= 0) return;
    state.monthlyBudget = val;
    saveState();
    renderBudgetCard();
    document.getElementById('budgetModal').close();
}

function handleNewCategorySubmit(e) {
    e.preventDefault();
    const name  = document.getElementById('newCategoryName').value.trim();
    const color = document.getElementById('newCategoryColor').value;
    if (!name) return;
    if (state.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        document.getElementById('newCategoryName').setCustomValidity('Category already exists');
        document.getElementById('newCategoryName').reportValidity();
        return;
    }
    document.getElementById('newCategoryName').setCustomValidity('');
    addCategory({ name, color });
    e.target.reset();
    document.getElementById('newCategoryColor').value = '#64748B';
}

// ─────────────────────────────────────────────
// 11. MODAL HELPERS
// ─────────────────────────────────────────────

function openDeleteModal(id) {
    const t = state.transactions.find(tx => tx.id === id);
    if (!t) return;
    pendingDeleteId = id;
    const safe = t.title.replace(/</g,'&lt;').replace(/>/g,'&gt;');
    document.getElementById('deleteMessage').innerHTML =
        `Delete <strong>${safe}</strong> (${formatCurrency(t.amount)})?`;
    document.getElementById('deleteModal').showModal();
}

function openCategoryDeleteModal(id) {
    const cat   = state.categories.find(c => c.id === id);
    if (!cat) return;
    const count = state.transactions.filter(t => t.categoryId === id).length;
    const safe  = cat.name.replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const msg   = count > 0
        ? `Delete category <strong>${safe}</strong>? Its ${count} transaction${count > 1 ? 's' : ''} will be reassigned to the default category.`
        : `Delete category <strong>${safe}</strong>?`;
    document.getElementById('deleteMessage').innerHTML = msg;
    pendingDeleteId = '__cat__' + id;
    document.getElementById('deleteModal').showModal();
}

// ─────────────────────────────────────────────
// 12. EVENT DELEGATION & WIRING
// ─────────────────────────────────────────────

function setupEvents() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Transaction form
    document.getElementById('transactionForm').addEventListener('submit', handleTransactionSubmit);

    // Sort
    document.getElementById('sortBy').addEventListener('change', e => {
        state.sortBy = e.target.value;
        saveState();
        renderTransactionsList();
        document.getElementById('filteredCount').textContent =
            `${getFilteredTransactions().length} items`;
    });

    // ── Time navigation ──────────────────────
    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        state.selectedMonth = state.selectedMonth === 'ALL'
            ? currentMonthStr()
            : shiftMonth(state.selectedMonth, -1);
        saveState(); renderAll();
    });

    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        if (state.selectedMonth === 'ALL') return;
        const next = shiftMonth(state.selectedMonth, +1);
        if (next <= currentMonthStr()) {
            state.selectedMonth = next;
            saveState(); renderAll();
        }
    });

    document.getElementById('toggleTimeRange').addEventListener('click', () => {
        state.selectedMonth = state.selectedMonth === 'ALL' ? currentMonthStr() : 'ALL';
        saveState(); renderAll();
    });

    // ── Category filter pills (event delegation) ──
    document.getElementById('categoryFilters').addEventListener('click', e => {
        const btn = e.target.closest('[data-cat]');
        if (!btn) return;
        state.filterCategory = btn.dataset.cat;
        saveState(); renderAll();
    });

    // ── Transaction list delete buttons (event delegation) ──
    document.getElementById('transactionsList').addEventListener('click', e => {
        const btn = e.target.closest('[data-id]');
        if (!btn) return;
        openDeleteModal(btn.dataset.id);
    });

    // ── Category modal delete buttons (event delegation) ──
    document.getElementById('categoriesList').addEventListener('click', e => {
        const btn = e.target.closest('[data-cat-del]');
        if (!btn) return;
        openCategoryDeleteModal(btn.dataset.catDel);
    });

    // ── Budget modal ─────────────────────────
    document.getElementById('editBudgetBtn').addEventListener('click', () => {
        document.getElementById('newBudget').value = state.monthlyBudget;
        document.getElementById('budgetModal').showModal();
    });
    document.getElementById('cancelBudgetBtn').addEventListener('click', () =>
        document.getElementById('budgetModal').close());
    document.getElementById('budgetForm').addEventListener('submit', handleBudgetSubmit);

    // ── Categories modal ─────────────────────
    document.getElementById('manageCategoriesBtn').addEventListener('click', () => {
        renderCategoryModalList();
        document.getElementById('categoriesModal').showModal();
    });
    document.getElementById('closeCategoriesBtn').addEventListener('click', () =>
        document.getElementById('categoriesModal').close());
    document.getElementById('newCategoryForm').addEventListener('submit', handleNewCategorySubmit);

    // Colour preset swatches
    document.querySelectorAll('.color-preset').forEach(btn => {
        const col = btn.dataset.color;
        btn.style.backgroundColor = col;
        btn.addEventListener('click', () => {
            document.getElementById('newCategoryColor').value = col;
            document.querySelectorAll('.color-preset').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // ── Delete confirmation modal ────────────
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        pendingDeleteId = null;
        document.getElementById('deleteModal').close();
    });
    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
        if (!pendingDeleteId) { document.getElementById('deleteModal').close(); return; }
        if (pendingDeleteId.startsWith('__cat__')) {
            deleteCategory(pendingDeleteId.replace('__cat__', ''));
        } else {
            deleteTransaction(pendingDeleteId);
        }
        pendingDeleteId = null;
        document.getElementById('deleteModal').close();
    });

    // Click-outside to close any modal
    document.querySelectorAll('.modal').forEach(m => {
        m.addEventListener('click', e => { if (e.target === m) m.close(); });
    });

    // System colour-scheme change
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (state.theme === 'system') { applyTheme(); renderChart(); }
    });

    // Keyboard: Escape already handled by <dialog>; add Ctrl+Enter shortcut
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const form = document.getElementById('transactionForm');
            if (form.contains(document.activeElement)) {
                form.requestSubmit();
            }
        }
    });
}

// ─────────────────────────────────────────────
// 13. BOOT
// ─────────────────────────────────────────────

function init() {
    loadState();
    applyTheme();

    // Set today's date as default for the form
    document.getElementById('itemDate').value = todayStr();

    // Restore sort dropdown to saved value
    document.getElementById('sortBy').value = state.sortBy;

    setupEvents();
    renderAll();
}

// Run as soon as the DOM is ready
document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
