---
inclusion: always
---

# Feature Implementation Guide

## Core MVP Features

### 1. Balance & Overview Card
**Status:** ✅ Complete

Display total spending with transaction count and active filter status.

**Elements:**
- Large balance amount (tabular nums)
- Budget status badge (Normal/Approaching/Over Budget)
- Transaction count metric
- Active filter label

**Logic:**
```javascript
const totalSpending = getFilteredTransactions().reduce((sum, t) => sum + t.amount, 0);
```

---

### 2. Transaction Form
**Status:** ✅ Complete

Add new expenses with inline validation.

**Fields:**
- Item Name (text, max 50 chars, required)
- Amount (number, > 0, required)
- Category (select, required)
- Date (date picker, defaults to today, required)

**Validation Rules:**
- No empty fields
- Amount must be positive number
- Show inline errors below each field (not alerts)
- Clear form after successful submission
- Re-focus on item name after submit

**Error Display:**
```javascript
document.getElementById('itemNameError').textContent = 'Item name is required';
```

---

### 3. Transaction History List
**Status:** ✅ Complete

Scrollable feed of all transactions matching filters.

**Each Item Shows:**
- Category color dot
- Transaction title (escaped for XSS)
- Formatted date (DD Mon YYYY)
- Right-aligned amount (tabular nums)
- Delete button

**Features:**
- Event delegation for delete buttons
- Empty state with helpful message
- Max height with scroll overflow
- Responsive full-width cards on mobile

---

### 4. Chart.js Visualization
**Status:** ✅ Complete

Interactive donut chart showing spending by category.

**Requirements:**
- Destroy previous instance before creating new one
- Update colors when theme changes
- Custom legend with percentages
- Tooltips with formatted currency
- Empty state when no transactions

**Critical:**
```javascript
if (chartInstance) {
  chartInstance.destroy();
  chartInstance = null;
}
```

---

## Challenge 1: Custom Categories
**Status:** ✅ Complete

Allow users to create and manage custom spending categories.

**Features:**
- "Manage Categories" modal
- Category name input (max 30 chars)
- Color picker with preset swatches
- List of custom categories with usage count
- Delete with reassignment warning

**Storage:**
```javascript
{
  id: uid(),
  name: string,
  color: '#HEX',
  isCustom: true
}
```

**Delete Logic:**
- Reassign transactions to first default category
- Remove category from state
- Update all UI elements

---

## Challenge 2: Monthly Summary & Time Filtering
**Status:** ✅ Complete

Navigate between months and view all-time data.

**UI Elements:**
- Previous month button
- Current month/year display
- Next month button (disabled on current month)
- "All Time" / "This Month" toggle

**Filter Logic:**
```javascript
if (state.selectedMonth !== 'ALL') {
  transactions = transactions.filter(t => t.date.startsWith(state.selectedMonth));
}
```

**Budget Card Sync:**
- Budget card must track the selected month's spending
- Dynamic title showing which month is tracked
- Falls back to current month when viewing "All Time"

---

## Challenge 3: Multi-Criteria Sort & Filter
**Status:** ✅ Complete

Sort and filter transactions by multiple criteria.

**Sort Options:**
- Date: Newest First (default)
- Date: Oldest First
- Amount: High to Low
- Amount: Low to High
- Category: A → Z
- Category: Z → A

**Category Filters:**
- Horizontal scrollable pill buttons
- "All" + each category
- Active state highlighting
- Instant filtering on click

**Implementation:**
```javascript
list.sort((a, b) => {
  switch (state.sortBy) {
    case 'category-asc':
      return getCategoryById(a.categoryId).name.localeCompare(
        getCategoryById(b.categoryId).name
      );
    // ...
  }
});
```

---

## Challenge 4: Dynamic Budget & Alerts
**Status:** ✅ Complete

Visual progress bar with three alert tiers.

**Progress Bar:**
- Width: `(spent / limit) * 100%`
- Animated transitions
- Color changes based on tier

**Alert Tiers:**
1. **Safe (< 80%)** — Green/Emerald fill, no alert
2. **Caution (80-99%)** — Amber fill + warning banner
3. **Exceeded (≥100%)** — Red fill + danger banner with excess amount

**Alert Messages:**
```javascript
// Warning
`⚠️ You have used ${Math.round(pct)}% of your monthly budget`

// Danger
`🚨 Budget Exceeded by ${formatCurrency(spent - limit)}`
```

---

## Challenge 5: Dark/Light Theme Toggle
**Status:** ✅ Complete

Seamless theme switching with system preference detection.

**Theme Modes:**
- Light
- Dark
- System (auto-detect from OS)

**Toggle Cycle:**
```javascript
const cycle = ['light', 'dark', 'system'];
state.theme = cycle[(cycle.indexOf(state.theme) + 1) % 3];
```

**Initial Load:**
```javascript
if (state.theme === 'system') {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
}
```

**Chart Sync:**
- Rebuild chart after theme change
- Update tooltip colors
- Update legend text color
- Update border colors

---

## Data Flow Architecture

### State Management
```
User Action → Mutate State → saveState() → renderAll()
                                              ↓
                              ┌───────────────┴────────────────┐
                              ↓                                ↓
                    renderBalanceCard()              renderTransactionsList()
                    renderBudgetCard()               renderChart()
                    renderCategoryFilters()          renderTimeDisplay()
```

### Event Delegation Pattern
```javascript
document.getElementById('categoryFilters').addEventListener('click', e => {
  const btn = e.target.closest('[data-cat]');
  if (!btn) return;
  state.filterCategory = btn.dataset.cat;
  saveState();
  renderAll();
});
```

---

## Seed Data Strategy

**Default Categories:**
- Food (`#F97316`)
- Transport (`#0EA5E9`)
- Fun (`#8B5CF6`)

**Sample Transactions:**
- "Starbucks Americano" — 45,000 — Food — Today
- "Grab Transport" — 25,000 — Transport — Yesterday
- "Movie Ticket" — 65,000 — Fun — 2 days ago

**Default Budget:**
- 2,500,000 IDR (adjust based on target audience)

**Purpose:**
Ensures UI never starts as a blank void — users see a working demo immediately.

---

## Error Handling Patterns

### localStorage Failures
```javascript
try {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
} catch (e) {
  console.warn('localStorage write failed:', e);
  // Continue without persistence
}
```

### Corrupted State Recovery
```javascript
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  state = { ...defaultState, ...saved };
} catch (e) {
  console.error('State load failed:', e);
  seedDefaultData(); // Fresh start
}
```

### Form Validation
```javascript
let valid = true;
if (!title.trim()) {
  document.getElementById('itemNameError').textContent = 'Required';
  valid = false;
}
if (!valid) return; // Prevent submission
```

---

## Performance Optimizations

### Chart Lifecycle
Always destroy before recreating:
```javascript
if (chartInstance) {
  chartInstance.destroy();
  chartInstance = null;
}
chartInstance = new Chart(ctx, config);
```

### Event Delegation
One listener per container, not per item:
```javascript
// ✅ Good — one listener
container.addEventListener('click', e => {
  const btn = e.target.closest('.delete-btn');
  if (btn) handleDelete(btn.dataset.id);
});

// ❌ Bad — N listeners
items.forEach(item => {
  item.addEventListener('click', handleDelete);
});
```

### Batch DOM Updates
```javascript
// Build HTML string, then update once
container.innerHTML = items.map(renderItem).join('');
// Not: items.forEach(item => container.appendChild(renderItem(item)));
```

---

## Known Limitations

### No Backend
- Data only on device (no sync across devices)
- Lost on browser data clear
- No cloud backup

### No Export
- Can't export to CSV/PDF
- Can't share with others
- No print optimization beyond basic media query

### Single Currency
- Hardcoded to Indonesian Rupiah (IDR)
- No currency conversion
- Format defined in `formatCurrency()`

### Basic Accessibility
- Keyboard navigation works
- Screen reader basics only
- No comprehensive ARIA landmarks
- Not tested with assistive tech beyond basics
