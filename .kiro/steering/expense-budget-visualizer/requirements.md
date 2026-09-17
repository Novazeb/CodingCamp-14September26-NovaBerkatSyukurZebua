---
inclusion: always
---

# Technical Requirements & Constraints

## Technology Stack (TC-1)

### Allowed
- **HTML5** — semantic tags (`<header>`, `<main>`, `<section>`, `<form>`, `<dialog>`)
- **CSS3** — CSS Custom Properties, Flexbox, Grid
- **Vanilla JavaScript** — ES6+ features only
- **Chart.js** — CDN import only (via `<script src="https://cdn.jsdelivr.net/npm/chart.js">`)

### Strictly Forbidden
- ❌ No React, Vue, Angular, Svelte, or any frontend framework
- ❌ No jQuery, Lodash, or utility libraries
- ❌ No Tailwind CSS, Bootstrap, or CSS frameworks
- ❌ No npm, webpack, Vite, or any build tools
- ❌ No TypeScript compilation
- ❌ No backend server or API calls
- ❌ No additional CSS or JS files beyond `style.css` and `app.js`

## Data Storage (TC-2)

### localStorage API
- Key: `expenseApp_v1`
- All state stored client-side as JSON
- Robust error handling with try/catch
- Schema migration support for version upgrades
- Fallback to default state on corruption

### State Schema
```javascript
{
  theme: 'light' | 'dark' | 'system',
  monthlyBudget: number,
  selectedMonth: 'YYYY-MM' | 'ALL',
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'category-asc' | 'category-desc',
  filterCategory: 'ALL' | string,
  categories: Array<{id, name, color, isCustom}>,
  transactions: Array<{id, title, amount, categoryId, date}>
}
```

## Browser Compatibility (TC-3)

### Target Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features
- `<dialog>` element support
- CSS Custom Properties
- ES6+ JavaScript (arrow functions, destructuring, template literals)
- localStorage API
- Chart.js canvas rendering

### No Polyfills
Must work natively without polyfills or fallbacks.

## Performance Requirements (NFR-2)

### Load Time
- Initial load: < 100ms
- No visible lag on user interactions
- Smooth 60fps UI transitions

### Memory Management
- Chart.js instance must be destroyed before recreating
- No memory leaks from event listeners
- Efficient DOM manipulation (batch updates when possible)

### Event Delegation
Use event delegation for dynamically generated elements:
- Transaction list delete buttons
- Category filter pills
- Category modal delete buttons

## Code Quality (NFR-1)

### JavaScript
- `'use strict'` mode
- No `var` — use `const` and `let` only
- Pure functions for data transformations
- Clear function names describing intent
- Comments only when necessary (code should be self-documenting)

### Error Handling
```javascript
try {
  localStorage.setItem(key, value);
} catch (e) {
  console.warn('Storage failed:', e);
}
```

### Validation
- Inline validation errors (no `alert()` or `confirm()`)
- Clear error messages in red below form fields
- Prevent submission with invalid data

## File Structure (Strict)

```
expense-budget-visualizer/
├── index.html          # ONLY ONE HTML file
├── css/
│   └── style.css      # ONLY ONE CSS file
├── js/
│   └── app.js         # ONLY ONE JS file
├── .kiro/             # Kiro metadata (must be committed)
└── README.md          # Project documentation
```

### Zero Additional Files
No splitting into multiple CSS/JS files, even for organization.

## Deployment

### GitHub Pages
- Zero build step required
- Direct deployment from `main` branch root
- All assets must load without 404 errors
- Works immediately after `git push`

## Accessibility (NFR-3)

### WCAG 2.1 Level AA
- All interactive elements min 44×44px
- Sufficient color contrast ratios
- Keyboard navigation support
- `aria-label` on icon-only buttons
- `:focus-visible` styles on all focusable elements
- `<noscript>` fallback message

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Security

### XSS Prevention
- Escape all user-supplied strings before rendering to DOM
- Use `.textContent` instead of `.innerHTML` for user data
- Never use `eval()` or `new Function()` with user input

### No Secrets
- No API keys, tokens, or credentials
- No analytics tracking
- No external requests (except Chart.js CDN)

## Testing Requirements

### Manual Testing Checklist
- [ ] Works in Chrome, Firefox, Safari, Edge
- [ ] Mobile viewport (375px width)
- [ ] Tablet viewport (768px width)
- [ ] Desktop viewport (1200px width)
- [ ] Dark mode toggle works correctly
- [ ] Chart renders without console errors
- [ ] localStorage persists across page reloads
- [ ] All 5 optional challenges functional
- [ ] No console errors or warnings
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility (basic)

### Edge Cases
- Zero transactions (empty state)
- Very long transaction titles (50 chars)
- Very large amounts (billions)
- Delete category in use (reassign transactions)
- Corrupted localStorage (recover gracefully)

## Non-Requirements

### NOT Needed
- Unit tests or test framework setup
- Backend server or database
- User authentication
- Multi-user support
- Export/import functionality
- Print styles (beyond basic media query)
- Service worker or offline support
- Internationalization (i18n)
