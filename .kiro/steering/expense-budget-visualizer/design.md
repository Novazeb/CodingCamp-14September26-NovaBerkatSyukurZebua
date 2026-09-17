---
inclusion: always
---

# Design System & Visual Guidelines

## Design Philosophy
Modern Editorial Fintech aesthetic inspired by Linear, Stripe, and Wise — clean, purposeful, and professional without AI design clichés.

## Anti-Patterns (Strictly Avoid)
- ❌ Purple/pink gradient backgrounds (`#6366f1` to `#ec4899`)
- ❌ Heavy glassmorphism with illegible washed-out text
- ❌ Excessive emoji clutter on labels
- ❌ Unstyled table dumps or card overflows on mobile

## Color Tokens

### Light Theme (Default)
```css
--bg-app: #F8FAFC;           /* App background */
--bg-surface: #FFFFFF;       /* Card/panel background */
--bg-subtle: #F1F5F9;        /* Subtle backgrounds */
--border-subtle: #E2E8F0;    /* Border colors */
--border-focus: #0EA5E9;     /* Focus states */
--text-main: #0F172A;        /* Primary text */
--text-muted: #64748B;       /* Secondary text */
--text-subtle: #94A3B8;      /* Tertiary text */
```

### Dark Theme
```css
--bg-app: #0B0F17;
--bg-surface: #131B2A;
--bg-subtle: #1E293B;
--border-subtle: #243047;
--border-focus: #38BDF8;
--text-main: #F8FAFC;
--text-muted: #94A3B8;
--text-subtle: #64748B;
```

### Semantic Colors
```css
--color-surplus: #10B981;    /* Emerald - safe state */
--color-warning: #F59E0B;    /* Amber - caution */
--color-danger: #EF4444;     /* Crimson - exceeded */
--color-primary: #0284C7;    /* Deep Sky - actions */
```

### Category Colors
```css
--cat-food: #F97316;         /* Orange */
--cat-transport: #0EA5E9;    /* Sky Blue */
--cat-fun: #8B5CF6;          /* Purple */
--cat-utilities: #10B981;    /* Emerald */
--cat-other: #64748B;        /* Slate */
```

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", system-ui, sans-serif;
```

### Tabular Numbers (Financial Data)
All currency values and numeric data must use:
```css
font-variant-numeric: tabular-nums;
font-feature-settings: "tnum";
```

### Font Sizes
- `--font-size-xs`: 0.75rem (12px)
- `--font-size-sm`: 0.875rem (14px)
- `--font-size-base`: 1rem (16px)
- `--font-size-lg`: 1.125rem (18px)
- `--font-size-xl`: 1.25rem (20px)
- `--font-size-2xl`: 1.5rem (24px)
- `--font-size-3xl`: 2rem (32px)
- `--font-size-4xl`: 2.5rem (40px)

## Spacing System
- `--space-xs`: 0.25rem (4px)
- `--space-sm`: 0.5rem (8px)
- `--space-md`: 1rem (16px)
- `--space-lg`: 1.5rem (24px)
- `--space-xl`: 2rem (32px)
- `--space-2xl`: 3rem (48px)

## Border Radius
- `--radius-sm`: 0.375rem (6px)
- `--radius-md`: 0.5rem (8px)
- `--radius-lg`: 0.75rem (12px)
- `--radius-xl`: 1rem (16px)
- `--radius-full`: 9999px (pill shape)

## Shadows
```css
--shadow-sm: 0 1px 3px rgba(0,0,0,0.04);
--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.05);
--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.05);
--shadow-focus: 0 0 0 3px rgba(14,165,233,0.1);
```

## Transitions
```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
```

## Micro-Interactions

### Buttons
- Hover: subtle elevation with `box-shadow: var(--shadow-md)`
- Active: compression `transform: scale(0.98)`
- Transition: `150ms cubic-bezier(0.4, 0, 0.2, 1)`

### Cards
- Border: `1px solid var(--border-subtle)`
- Shadow: `var(--shadow-sm)` at rest, `var(--shadow-md)` on hover
- Transition: smooth elevation change

### Empty States
- Centered icon + heading + descriptive text
- Subtle icon color: `var(--text-subtle)`
- Clear call-to-action explaining next steps

## Accessibility

### Touch Targets
- Minimum 44×44px for all interactive elements (buttons, inputs, links)
- Adequate spacing between adjacent interactive elements

### Focus States
```css
:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}
```

### Motion
Respect user preference:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Contrast
Support high-contrast mode:
```css
@media (prefers-contrast: high) {
  :root {
    --border-subtle: #000000;
    --text-main: #000000;
  }
}
```

## Responsive Breakpoints
- Mobile: `max-width: 640px`
- Tablet: `max-width: 768px`
- Desktop: `max-width: 1024px`

## Layout Grid
- Content max-width: `1200px`
- Two-column grid on desktop → single column on mobile
- Minimum gap between elements: `var(--space-lg)`
