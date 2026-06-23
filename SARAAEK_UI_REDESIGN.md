# SaraaTEK UI Redesign — Master-Piece Design System

**Version:** 1.0
**Date:** 2026-06-22
**Status:** Planning Phase
**Goal:** Transform SaraaTEK into a premium, world-class desktop application that rivals Linear, Stripe, and Notion in craft and polish.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Current Design Audit](#2-current-design-audit)
3. [Target Design System](#3-target-design-system)
4. [Token System](#4-token-system)
5. [Component Redesign](#5-component-redesign)
6. [Screen-by-Screen Redesign](#6-screen-by-screen-redesign)
7. [Motion & Animation](#7-motion--animation)
8. [Data Visualization](#8-data-visualization)
9. [Implementation Plan](#9-implementation-plan)

---

## 1. Design Philosophy

### The Anti-AI-Slop Test

Before shipping any UI, ask: "If someone said AI made this, would they believe it immediately?" If yes, start over.

### Design Principles

1. **Productivity First** — Every screen helps users complete tasks faster. No decorative elements, no unnecessary animations, no visual clutter.

2. **Restraint is Premium** — One accent color (purple), used sparingly. 90%+ neutral tones. Color only for status and brand.

3. **Data is the Hero** — Content IS the design. No ornamental gradients, blobs, or abstract shapes competing with the product.

4. **Craft in the Details** — Every button has 6 states. Every input has a designed focus ring. Every number uses tabular-nums. Every empty state is helpful.

5. **Dark-Mode-First** — Dark is the primary mode. Elevation via surface tint, not shadows. Light mode exists but dark is the star.

### Inspiration Sources

| Source | What to Learn |
|---|---|
| **Linear** | Dark canvas, surface ladder, single accent, keyboard-first, empty states |
| **Stripe** | Information density, typography as hierarchy, tabular numbers, financial data |
| **Notion** | Workspace feel, pastel accents for categories, editorial layout |
| **Vercel** | Monochrome + context color, deployment status, clean navigation |
| **Carbon** | Luminous accent on dark, elevation via surface step, no shadows |

---

## 2. Current Design Audit

### What's Good ✅

- Dark-first approach (Linear-inspired)
- Single purple accent (#7C4DFF)
- Clean typography scale
- Consistent spacing
- Good component variety

### What Needs Improvement ⚠️

| Area | Current | Target |
|---|---|---|
| **Token System** | Hardcoded hex values | OKLCH-based perceptually uniform tokens |
| **Surface Elevation** | Fixed gray values | Transparency-based elevation (white at stepped opacity) |
| **Typography** | No negative tracking on display | Aggressive negative tracking on headings |
| **Tabular Numbers** | Not specified | `font-variant-numeric: tabular-nums` on all data |
| **Shadows** | Flat, single-layer | Layered ambient + direct shadows |
| **Motion** | Basic easing | Refined cubic-bezier curves, stagger animations |
| **Empty States** | Basic text | Designed, helpful, actionable |
| **Loading States** | Basic skeleton | Geometry-matching skeletons |
| **Chart Design** | Not defined | Cleveland-McGill compliant charts |
| **Focus Rings** | Basic | Designed, brand-colored, intentional |
| **Hover States** | Basic | Six-state micro-interactions |
| **Data Tables** | Basic | Status dots, proportion bars, keyboard navigation |
| **Sidebar** | Fixed dark | Subtly tinted, not full black |
| **Metric Cards** | Equal weight | Hero metric + supporting hierarchy |
| **Color on Dark** | Hardcoded | OKLCH with hue consistency |

### What to Remove ❌

- `transition: all` (use specific properties)
- Uniform border-radius on everything
- Basic skeleton loaders
- Generic empty states
- Color-only status indicators (add text labels)

---

## 3. Target Design System

### Theme Selection: Carbon (Dark Premium)

Based on the ui-craft skill's theme presets, **Carbon** is the best fit for SaraaTEK:

- Dark-first (matches current approach)
- Deep cool neutrals with blue tint
- Elevation via surface tint (not shadows)
- Luminous accent (matches purple brand)
- For developer/business tools used for hours in the dark

### Color Palette

#### Surface Hierarchy (OKLCH-based)

```css
/* Surface ladder — elevation via lightness, not shadow */
--surface-0: oklch(14% 0.012 260);   /* page background */
--surface-1: oklch(17.5% 0.012 260); /* cards, panels */
--surface-2: oklch(21% 0.012 260);   /* raised: hover, popover */
--surface-3: oklch(25% 0.012 260);   /* highest: modal, tooltip */
--surface-4: oklch(29% 0.012 260);   /* elevated: command palette */
```

#### Text Hierarchy

```css
--text-1: oklch(93% 0.005 260);  /* primary — headings, body */
--text-2: oklch(70% 0.01 260);   /* secondary — labels, descriptions */
--text-3: oklch(52% 0.012 260);  /* tertiary — placeholders, metadata */
--text-on-accent: oklch(8% 0.008 260); /* text on purple buttons */
```

#### Accent (Purple)

```css
--accent: oklch(68% 0.18 280);        /* primary purple */
--accent-hover: oklch(74% 0.18 280);  /* lighter on hover */
--accent-active: oklch(60% 0.18 280); /* darker on press */
--accent-tint: oklch(68% 0.18 280 / 0.10); /* background tint */
--accent-glow: oklch(68% 0.18 280 / 0.25); /* focus ring */
```

#### Hairlines

```css
--line-1: oklch(28% 0.012 260); /* subtle borders */
--line-2: oklch(32% 0.012 260); /* default borders */
--line-3: oklch(38% 0.012 260); /* strong borders, hover */
```

#### Semantic Colors

```css
--success: oklch(74% 0.12 155);  /* green */
--warning: oklch(78% 0.13 85);   /* amber */
--danger: oklch(68% 0.16 25);    /* red */
--info: oklch(70% 0.12 250);     /* blue */
```

### Typography

#### Font Stack

```css
--font-body: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
```

#### Type Scale

```css
/* Display — aggressive negative tracking */
--text-display-lg: 48px / 1.1 -0.035em;  /* page titles */
--text-display: 36px / 1.15 -0.03em;     /* screen headings */
--text-display-sm: 28px / 1.2 -0.025em;  /* section headings */

/* Body */
--text-lg: 18px / 1.5 -0.01em;   /* card titles */
--text-md: 14px / 1.5;           /* section headers, labels */
--text-base: 13px / 1.5;         /* default body */
--text-sm: 12px / 1.5;           /* table cells, descriptions */
--text-xs: 11px / 1.4 0.04em;   /* labels, badges, category labels */

/* Weights */
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Tabular numbers — on ALL data */
--tabular-nums: font-variant-numeric: tabular-nums;
```

### Spacing Scale (8px base)

```css
--space-0: 0;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

### Border Radius

```css
--radius-sm: 4px;    /* inputs, badges */
--radius-md: 6px;    /* small cards */
--radius-lg: 10px;   /* cards, panels */
--radius-xl: 14px;   /* modals, dialogs */
--radius-2xl: 20px;  /* expressive cards */
--radius-full: 9999px; /* pills, avatars */
```

### Shadows (Layered)

```css
/* Light mode — ambient + direct */
--shadow-sm: 0 1px 2px oklch(0% 0 0 / 0.05);
--shadow-md: 0 4px 6px oklch(0% 0 0 / 0.07),
             0 1px 3px oklch(0% 0 0 / 0.06);
--shadow-lg: 0 10px 15px oklch(0% 0 0 / 0.09),
             0 4px 6px oklch(0% 0 0 / 0.05);
--shadow-xl: 0 20px 25px oklch(0% 0 0 / 0.10),
             0 8px 10px oklch(0% 0 0 / 0.04);

/* Dark mode — reduced intensity */
--shadow-dark-sm: 0 1px 2px oklch(0% 0 0 / 0.2);
--shadow-dark-md: 0 4px 6px oklch(0% 0 0 / 0.25),
                  0 1px 3px oklch(0% 0 0 / 0.2);
--shadow-dark-lg: 0 10px 15px oklch(0% 0 0 / 0.3),
                  0 4px 6px oklch(0% 0 0 / 0.2);
```

### Motion

```css
/* Durations */
--duration-instant: 80ms;
--duration-fast: 120ms;
--duration-normal: 200ms;
--duration-slow: 320ms;
--duration-page: 400ms;

/* Easings */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Rules */
/* GPU-only: opacity, transform, filter */
/* Never animate: layout, width, height */
/* Exit faster than enter (~75% duration) */
/* prefers-reduced-motion: honor it */
```

### Z-Index Scale

```css
--z-base: 0;
--z-raised: 1;
--z-dropdown: 10;
--z-sticky: 20;
--z-modal-backdrop: 30;
--z-modal: 40;
--z-toast: 50;
--z-tooltip: 60;
```

---

## 4. Component Redesign

### Button

```
States: default → hover → active → focus-visible → disabled → loading

Default:
  bg: var(--accent)
  text: var(--text-on-accent)
  radius: var(--radius-md)
  padding: 8px 16px
  font: 500 13px

Hover:
  bg: var(--accent-hover)
  transform: translateY(-1px)
  box-shadow: 0 2px 8px var(--accent-tint)

Active:
  bg: var(--accent-active)
  transform: translateY(0)

Focus-visible:
  ring: 2px var(--accent-glow)
  ring-offset: 2px var(--surface-1)

Disabled:
  opacity: 0.5
  cursor: not-allowed
  transform: none

Loading:
  spinner icon
  pointer-events: none
```

### Input

```
States: default → hover → focus → error → disabled → readonly

Default:
  bg: var(--surface-0)
  border: 1px solid var(--line-2)
  radius: var(--radius-sm)
  padding: 8px 12px
  font: 400 13px

Hover:
  border-color: var(--line-3)

Focus:
  border-color: var(--accent)
  ring: 2px var(--accent-glow)
  ring-offset: 2px var(--surface-1)

Error:
  border-color: var(--danger)
  ring: 2px oklch(68% 0.16 25 / 0.25)

Disabled:
  opacity: 0.5
  cursor: not-allowed

Label:
  font: 500 11px var(--text-2)
  tracking: 0.04em
  margin-bottom: 4px

Error text:
  font: 400 11px var(--danger)
  margin-top: 4px

Hint text:
  font: 400 11px var(--text-3)
  margin-top: 4px
```

### Card

```
Default:
  bg: var(--surface-1)
  border: 1px solid var(--line-1)
  radius: var(--radius-lg)
  padding: 20px

Clickable:
  cursor: pointer
  transition: background 150ms, border-color 150ms

Hover (clickable):
  bg: var(--surface-2)
  border-color: var(--line-2)

Header:
  font: 600 15px var(--text-1)
  tracking: -0.01em
  margin-bottom: 16px

Body:
  font: 400 13px var(--text-1)

Footer:
  border-top: 1px solid var(--line-1)
  padding-top: 16px
  margin-top: 16px
```

### Modal

```
Overlay:
  bg: oklch(0% 0 0 / 0.6)
  backdrop-filter: blur(4px)
  z-index: var(--z-modal-backdrop)

Dialog:
  bg: var(--surface-3)
  border: 1px solid var(--line-1)
  radius: var(--radius-xl)
  shadow: var(--shadow-xl)
  z-index: var(--z-modal)

Sizes:
  sm: 384px
  md: 448px
  lg: 576px
  xl: 768px

Enter:
  opacity: 0 → 1
  scale: 0.98 → 1
  duration: 200ms
  ease: var(--ease-out)

Exit:
  opacity: 1 → 0
  scale: 1 → 0.98
  duration: 150ms
  ease: var(--ease-in)

Focus trap: yes
Body scroll lock: yes
Close: Esc key + click outside
```

### StatusBadge

```
Compact:
  height: 20px
  radius: var(--radius-full)
  padding: 0 8px
  font: 500 11px

Dot:
  width: 6px
  height: 6px
  radius: 50%
  margin-right: 6px

Colors:
  Received: gray (oklch(55% 0.012 260))
  Awaiting: amber (oklch(78% 0.13 85))
  Repairing: blue (oklch(70% 0.12 250))
  Ready: purple (oklch(68% 0.18 280))
  Completed: green (oklch(74% 0.12 155))
  Declined: red (oklch(68% 0.16 25))
  Cancelled: red (oklch(68% 0.16 25))
  Closed: gray (oklch(45% 0.012 260))

Always show: dot + text (not color-only)
```

### DataTable

```
Container:
  bg: var(--surface-1)
  border: 1px solid var(--line-1)
  radius: var(--radius-lg)
  overflow: hidden

Header:
  bg: var(--surface-2)
  font: 500 11px var(--text-2)
  tracking: 0.04em
  text-transform: none (sentence case!)
  border-bottom: 1px solid var(--line-1)
  position: sticky
  top: 0

Row:
  height: 44px
  border-bottom: 1px solid var(--line-1)
  transition: background 120ms

Hover:
  bg: var(--surface-2)

Selected:
  bg: var(--accent-tint)

Status:
  6px colored dot + text (not badge)

Numbers:
  font-variant-numeric: tabular-nums
  text-align: right

Empty:
  EmptyState component

Loading:
  Skeleton rows (match geometry)
```

### MetricCard

```
Primary (hero):
  bg: var(--accent-tint)
  border: 1px solid var(--accent-glow)
  radius: var(--radius-lg)
  padding: 20px

  Value:
    font: 700 36px var(--text-1)
    tracking: -0.02em
    font-variant-numeric: tabular-nums

  Label:
    font: 500 12px var(--text-2)
    margin-top: 4px

  Change:
    font: 400 12px var(--text-3)
    margin-top: 8px
    NO colored pills, NO arrows

  Sparkline:
    height: 32px
    stroke: var(--accent)
    fill: var(--accent-tint)

Secondary:
  bg: var(--surface-1)
  border: 1px solid var(--line-1)
  radius: var(--radius-lg)
  padding: 16px

  Value:
    font: 700 28px var(--text-1)
    tracking: -0.02em
    font-variant-numeric: tabular-nums

  Label:
    font: 500 12px var(--text-2)
    margin-top: 4px

  Change:
    font: 400 12px var(--text-3)
    margin-top: 8px
```

### EmptyState

```
Container:
  py: 64px
  text-align: center
  display: flex
  flex-direction: column
  align-items: center
  gap: 12px

Icon:
  width: 48px
  height: 48px
  color: var(--text-3)
  opacity: 0.4

Title:
  font: 500 14px var(--text-2)

Description:
  font: 400 13px var(--text-3)
  max-width: 320px

Action:
  margin-top: 8px
  Button component
```

### Skeleton

```
Base:
  bg: var(--surface-2)
  border-radius: var(--radius-sm)
  animation: pulse 2s ease-in-out infinite

Variants:
  SkeletonText: height 12px, varying widths
  SkeletonHeading: height 20px, width 60%
  SkeletonAvatar: width 32px, height 32px, radius 50%
  SkeletonCard: height 120px, radius var(--radius-lg)
  SkeletonTable: 5 rows, 44px each

Rule: Match dimensions of actual content
```

### Toast

```
Position: bottom-right, z-index: var(--z-toast)

Variants:
  success: border-left 3px var(--success)
  error: border-left 3px var(--danger)
  warning: border-left 3px var(--warning)
  info: border-left 3px var(--info)

Container:
  bg: var(--surface-3)
  border: 1px solid var(--line-1)
  radius: var(--radius-lg)
  padding: 12px 16px
  shadow: var(--shadow-lg)
  max-width: 384px

Enter:
  opacity: 0, translateX(20px)
  → opacity: 1, translateX(0)
  duration: 200ms

Exit:
  opacity: 1
  → opacity: 0
  duration: 150ms

Auto-dismiss:
  success: 3s
  warning: 5s
  error: manual
  info: 5s

Max visible: 5
Stack: newest on top
```

---

## 5. Screen-by-Screen Redesign

### Dashboard

**Current:** 4 equal metric cards + recent repairs list
**Target:** Hero metric + supporting metrics + charts + work queue

```
┌──────────────────────────────────────────────────────┐
│ sidebar │  topbar: title · date range · ⌘K          │
│         ├────────────┬────────┬────────┬─────────────┤
│         │ OPEN       │ await  │ repair │ ready       │
│         │ REPAIRS    │ 3      │ 5      │ 2           │
│         │ (hero)     │        │        │             │
│         ├────────────┴────────┴────────┴─────────────┤
│         │ filter row: ghost buttons · reset          │
│         ├────────────────────────────────────────────┤
│         │ WORK QUEUE table — dominant, 60%+          │
│         │ of viewport height                    ▼    │
└──────────────────────────────────────────────────────┘
```

**Key Changes:**
- Hero metric gets accent tint, larger number (36px)
- Supporting metrics neutral, smaller (28px)
- Add sparklines to all metric cards
- Table is dominant (operator workflow)
- Filter row with ghost buttons
- Date range selector prominent

### Repair Detail

**Current:** Linear layout, all sections visible
**Target:** Split-panel, contextual, designed states

```
┌──────────────────────────────────────────────────────┐
│ sidebar │  back · Repair ID · status badge · actions │
│         ├────────────────────┬───────────────────────┤
│         │ LEFT PANEL         │ RIGHT PANEL           │
│         │                    │                       │
│         │ Customer info      │ Status timeline       │
│         │ Device info        │ Actions               │
│         │ Condition          │ Progress              │
│         │ Photos             │ Notes                 │
│         │                    │                       │
│         ├────────────────────┴───────────────────────┤
│         │ Documents & Payment section                │
│         ├────────────────────────────────────────────┤
│         │ Communications log (collapsible)           │
└──────────────────────────────────────────────────────┘
```

**Key Changes:**
- Split-panel layout (left: info, right: actions)
- Status as visual timeline with dots
- Photos as gallery, not list
- Communications log with chat-style bubbles
- Designed empty states for each section

### Repairs List

**Current:** Basic table with search
**Target:** Command palette + dense table + keyboard nav

```
┌──────────────────────────────────────────────────────┐
│ sidebar │  Repairs · search bar · filters · ⌘K       │
│         ├────────────────────────────────────────────┤
│         │ STATUS FILTER PILLS                        │
│         │ [All] [Received] [Repairing] [Ready] ...  │
│         ├────────────────────────────────────────────┤
│         │ TABLE (dense, keyboard navigable)          │
│         │ ID · Customer · Device · Status · Date     │
│         │ 00003/03/04 · Acme Corp · Dell XPS · ● 5  │
│         │ ...                                        │
│         ├────────────────────────────────────────────┤
│         │ Pagination · count                         │
└──────────────────────────────────────────────────────┘
```

**Key Changes:**
- Status filter as pills (not dropdown)
- Dense table (40px rows)
- Keyboard navigation (j/k, arrows)
- Status as 6px dots + text
- Tabular-nums on all numbers
- Sentence-case headers

### Settings

**Current:** Single column, basic form
**Target:** Tabbed sections, grouped settings

```
┌──────────────────────────────────────────────────────┐
│ sidebar │  Settings                                  │
│         ├────────────────────────────────────────────┤
│         │ TABS: Shop · Users · AI · Sync · Templates │
│         ├────────────────────────────────────────────┤
│         │ SECTION GROUPS                            │
│         │ ┌─────────────────────────────────────┐   │
│         │ │ Shop Information                     │   │
│         │ │ Name · Address · Phone · Logo        │   │
│         │ └─────────────────────────────────────┘   │
│         │ ┌─────────────────────────────────────┐   │
│         │ │ AI Configuration                    │   │
│         │ │ Provider · API Key · Model           │   │
│         │ └─────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

**Key Changes:**
- Tabbed navigation (not scrollable form)
- Settings grouped in cards
- Visual feedback on save
- Password fields with show/hide
- Status indicators for connected services

### AI Assistant Panel

**Current:** None
**Target:** Floating panel, bottom-right

```
┌─────────────────────────────────────┐
│ AI Assistant                    ×   │
├─────────────────────────────────────┤
│ Context: Repair 00003/03/04        │
│ Device: Dell XPS 15                 │
│ Status: Repairing                   │
├─────────────────────────────────────┤
│ Messages:                           │
│ ┌─────────────────────────────────┐ │
│ │ User: What's the estimated cost │ │
│ │       for this repair?          │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ AI: Based on similar repairs... │ │
│ │     Estimated: RM 450-550       │ │
│ │     Confidence: 85%             │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [Message input............] [Send]  │
└─────────────────────────────────────┘
```

**Key Changes:**
- Floating panel (always accessible)
- Context-aware (shows current repair)
- Chat-style interface
- Action buttons (copy, apply, send)
- Streaming responses
- Provider indicator (Gemini/OpenRouter)

---

## 6. Data Visualization

### Chart Type Selection

| Data Story | Chart Type | Why |
|---|---|---|
| Revenue trend | Area chart with gradient | Shows direction + volume |
| Repair count by status | Horizontal bar | Labels readable |
| Technician performance | Vertical bar (3-7 items) | Natural for small sets |
| Payment method split | Donut (2 segments only) | Binary proportion |
| Inline trend in card | Sparkline (32px) | Minimal, contextual |
| Customer growth | Line chart | Trend over time |

### Chart Styling Rules

- **Single accent hue** at varying opacities for multi-series
- **Gradient fill** underneath area lines (15% → 0%)
- **Horizontal-only** gridlines (no vertical)
- **Direct labels** (no legend for single series)
- **Tabular-nums** on all data labels
- **No pie charts** (except 2-segment donut)
- **No 3D charts** ever

### Color for Data

```css
/* Single hue opacity ramp */
--chart-1: var(--accent);
--chart-2: oklch(68% 0.18 280 / 0.6);
--chart-3: oklch(68% 0.18 280 / 0.3);

/* Semantic */
--chart-success: var(--success);
--chart-warning: var(--warning);
--chart-danger: var(--danger);
```

---

## 7. Accessibility

### Requirements

- **Focus-visible:** All interactive elements have `focus-visible: ring-2 ring-accent/50`
- **Keyboard:** All elements reachable by Tab, tables navigable with arrow keys
- **Color contrast:** All text passes WCAG AA (4.5:1+)
- **Color + text:** Status indicators always have text labels (not color-only)
- **ARIA:** Modals have `role="dialog"`, `aria-modal`, focus trap
- **Reduced motion:** `prefers-reduced-motion: reduce` disables animations
- **Screen reader:** Proper headings hierarchy, landmarks, labels

### Focus Management

```css
/* Focus ring — visible, branded */
:focus-visible {
  outline: 2px solid var(--accent-glow);
  outline-offset: 2px;
}

/* Focus within — for compound components */
:focus-within {
  border-color: var(--accent);
}
```

---

## 8. Implementation Plan

### Phase A: Token System (1 week)

1. Create `tokens.css` with OKLCH-based primitive tokens
2. Create semantic token layer (surfaces, text, borders)
3. Create component tokens (button, input, card, etc.)
4. Update Tailwind config to use tokens
5. Test both light and dark modes

### Phase B: Core Components (2 weeks)

1. Redesign Button (6 states)
2. Redesign Input (6 states)
3. Redesign Card (clickable, header, body, footer)
4. Redesign Modal (enter/exit animations)
5. Redesign StatusBadge (dot + text)
6. Redesign DataTable (sticky header, hover, keyboard)
7. Redesign MetricCard (primary/secondary)
8. Redesign EmptyState (helpful, actionable)
9. Redesign Skeleton (geometry-matching)
10. Redesign Toast (variants, auto-dismiss)

### Phase C: Screen Redesign (3 weeks)

1. Dashboard (hero metric, charts, work queue)
2. Repairs List (dense table, keyboard nav)
3. Repair Detail (split-panel, timeline)
4. Settings (tabbed, grouped)
5. AI Assistant Panel (floating, chat)
6. New Repair Form (wizard, validation)
7. Quotation/Invoice Builder (line items, preview)
8. Reports (charts, analytics)
9. Company Profile (tabs, timeline)
10. Communications Hub (inbox, chat)

### Phase D: Polish (1 week)

1. Loading states (skeletons for all screens)
2. Empty states (helpful for all screens)
3. Error states (graceful recovery)
4. Keyboard shortcuts (global + per-screen)
5. Command palette (Ctrl+K)
6. Micro-interactions (hover, focus, active)
7. Page transitions (300ms ease-out)
8. Accessibility audit (WCAG AA)
9. Performance pass (bundle size, render)
10. Cross-platform testing (Windows, macOS, Linux)

### Total Estimated Duration: 7 weeks

---

## 9. Success Metrics

| Metric | Target |
|---|---|
| Token coverage | 100% of colors via tokens |
| Component states | 6 states per interactive component |
| Focus-visible | 100% of interactive elements |
| Keyboard nav | All screens reachable by keyboard |
| WCAG AA contrast | All text passes |
| Empty states | All screens have designed empty states |
| Loading states | All screens have skeleton loaders |
| Chart compliance | Cleveland-McGill perceptual hierarchy |
| Animation budget | All ≤400ms, GPU-only |
| Bundle impact | <10KB additional CSS |

---

## 10. Reference Files

| File | Purpose |
|---|---|
| `tokens.css` | Primitive + semantic tokens |
| `components.css` | Component-specific tokens |
| `animations.css` | Motion definitions |
| `charts.css` | Chart styling |
| `DESIGN.md` | Updated design system docs |
| `tailwind.config.js` | Extended with tokens |

---

**Document Status:** UI redesign plan created. Awaiting user review and approval.

**Next Steps:**
1. User reviews this plan
2. Approve or adjust design direction
3. Begin Phase A: Token System
4. Iterate through phases sequentially
