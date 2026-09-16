---
inclusion: always
---

# Expense & Budget Visualizer — Project Steering

## Project Overview
A client-side, mobile-first financial tracker built with vanilla HTML5, CSS3, and JavaScript (ES6+).
No frameworks, no build tools, no backend. Deployable directly to GitHub Pages.

## Tech Stack
- **HTML5** — semantic markup, `<dialog>` modals
- **CSS3** — CSS Custom Properties, Flexbox, Grid, responsive breakpoints
- **Vanilla JS** — ES6+, `localStorage`, Chart.js (CDN only)
- **Chart.js** — donut chart with lifecycle-safe destroy/recreate

## File Structure
```
index.html          # Single entry point
css/style.css       # All styling and theme tokens
js/app.js           # All logic and state management
README.md           # Project documentation
.kiro/              # Kiro IDE metadata (must remain committed)
```

## Key Constraints
- **NO** additional CSS or JS files beyond the ones listed above
- **NO** npm, webpack, or any build step
- **NO** backend or network requests
- All state stored in `localStorage` under key `expenseApp_v1`

## Design Tokens
- Light bg: `#F8FAFC` / Dark bg: `#0B0F17`
- Primary: `#0284C7` | Success: `#10B981` | Warning: `#F59E0B` | Danger: `#EF4444`
- Font: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", system-ui, sans-serif`

## Features Implemented
1. Transaction CRUD with inline validation
2. Monthly budget tracking with 3-tier visual alerts (safe/warning/exceeded)
3. Chart.js donut chart — spending by category
4. Custom category management (name + colour picker)
5. Month navigation + All Time toggle
6. Sort (date/amount asc/desc) + category filter pills
7. Dark / Light / System theme toggle with chart colour sync
8. Seed data on first launch so UI is never a blank void
