# DESIGN.md — SaraaTEK Design System

## 1. Overview

SaraaTEK is a Tauri 2 desktop repair shop management system. The design system is dark-first, using a Linear-inspired near-black canvas with a single purple accent. All surfaces use luminance-based depth, not shadows.

## 2. Color Tokens

### Surface Hierarchy
```
Canvas   #0C0C0E  → Page background
Surface  #141416  → Cards, panels, sidebar
Elevated #1C1C1F  → Secondary cards, raised states
Raised   #1C1C1F  → Hover states, secondary backgrounds
Hover    #232326  → Interactive hover fills
Overlay  #202023  → Modals, tooltips, command palette
Inset    #0A0A0C  → Input field backgrounds
```

### Text Hierarchy
```
Primary   #EDEDEF  → Body text, headings (contrast ~15:1)
Secondary #A1A1AA  → Labels, descriptions (contrast ~7:1)
Muted     #63636E  → Placeholders, metadata (contrast ~4:1)
Inverse   #0C0C0E  → Text on brand-colored backgrounds
```

### Brand Accent
```
Brand         #7C4DFF  → CTAs, active nav, focus rings, key metrics
Brand-Hover   #8E5FFF  → Button hover (lighter by ~7%)
Brand-Active  #6A3DE8  → Button pressed (darker by ~8%)
Brand-Subtle  #6B46C115 → Background tint (6% opacity)
Brand-Glow    #7C4DFF40 → Glow/ring (25% opacity)
```

### Semantic Colors
```
Success      #30A46C  + subtle #30A46C15
Error        #E5484D  + subtle #E5484D15
Info         #3E8EED  + subtle #3E8EED15
Warning      #F59E0B  + subtle #F59E0B15
```

### Border Hierarchy
```
Subtle   rgba(255,255,255,0.06)  → Card borders, dividers
Default  #232326                  → Input borders
Strong   #2E2E32                  → Hover borders
Brand    #7C4DFF40               → Active indicators
```

## 3. Typography

### Scale
| Token  | Size | Weight | Tracking | Use |
|--------|------|--------|----------|-----|
| xs     | 11px | 500    | 0.04em   | Labels, badges, table headers |
| sm     | 12px | 400    | normal   | Table cells, descriptions |
| base   | 13px | 400    | normal   | Default body |
| md     | 14px | 500    | normal   | Section headers |
| lg     | 15px | 600    | -0.01em  | Card titles |
| xl     | 18px | 600    | -0.02em  | Screen headings |
| 2xl    | 24px | 650    | -0.03em  | Page titles |

### Font
```css
font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

## 4. Radii
| Token | Value | Use |
|-------|-------|-----|
| radius-sm   | 4px   | Inputs, buttons, badges |
| radius-md   | 6px   | Cards, panels |
| radius-lg   | 8px   | Modals, dialogs |
| radius-full | 9999px | Pills, status indicators |

## 5. Shadows
| Token | Value | Use |
|-------|-------|-----|
| shadow-overlay | 0 4px 24px rgba(0,0,0,0.4) | Modals, dropdowns |
| shadow-tooltip | 0 2px 8px rgba(0,0,0,0.3) | Tooltips |

## 6. Spacing Scale

| Token | Value | Use |
|-------|-------|-----|
| 1     | 4px   | Tight inner padding |
| 2     | 8px   | Compact padding |
| 3     | 12px  | Standard inner padding |
| 4     | 16px  | Standard gap/outer padding |
| 5     | 20px  | Generous gap |
| 6     | 24px  | Section padding, card padding |
| 8     | 32px  | Large section gap |
| 10    | 40px  | Major section separator |
| 12    | 48px  | Maximum gap |

## 7. Breakpoints
| Name | Width | Usage |
|------|-------|-------|
| sm   | 640px | Mobile landscape |
| md   | 768px | Tablet |
| lg   | 1024px | Desktop (app min-width) |
| xl   | 1280px | Large desktop (app default) |
| 2xl  | 1536px | Ultra-wide |

## 8. Motion Budget
| Element | Duration | Easing |
|---------|----------|--------|
| Button hover | 150ms | ease-out |
| Button press | 100ms | ease-out |
| Focus ring | 150ms | ease-out |
| Table row hover | 150ms | ease-out |
| Sidebar collapse | 200ms | ease-out |
| Modal enter | 200ms | ease-out |
| Modal exit | 150ms | ease-in |
| Toast enter | 200ms | ease-out |
| Tooltip show | 200ms | ease-out |
| Dropdown open | 150ms | ease-out |
| Page transition | 300ms | ease-out |

GPU-only properties: opacity, transform, filter.
Never animate: layout, width, height (except sidebar width).

## 9. Component Contracts

### Button
- Variants: primary, secondary, ghost, danger
- Sizes: sm (h-7), md (h-8), lg (h-9)
- States: default, hover, active (scale-98), focus-visible, disabled, loading
- Icons: optional left-aligned, spinner when loading

### Input
- Variants: text, email, number, password
- States: default, hover (border-strong), focus (ring-brand), error (border-red), disabled, readonly
- Labels: text-xs, tracking-wide, text-secondary
- Hints: text-xs, text-muted below input
- Errors: text-xs, text-accent-red below input

### Card
- Background: bg-surface
- Border: border-subtle
- Radius: radius-md
- Padding: p-5
- Optional: CardHeader, CardBody, CardFooter
- States: default, clickable (hover:bg-raised)

### Modal
- Overlay: bg-black/70, backdrop-blur-sm, z-50
- Dialog: bg-surface, border-subtle, radius-lg, shadow-overlay
- Size: sm (384px), md (448px), lg (576px)
- Enter: opacity+scale 200ms
- Exit: 150ms
- Focus trap, body scroll lock
- Subcomponents: Header, Body, Footer

### StatusBadge
- Compact: h-5, rounded-full
- Dot: 4px circle, status color
- Label: text-xs, font-medium
- Interactive: onClick → inline dropdown
- Colors: gray (Received), amber (Awaiting), blue (Repairing), purple (Ready), green (Completed), red (Declined/Cancelled)

### DataTable
- Sticky header
- Sortable columns
- Row hover: bg-raised
- Selection: checkbox column
- Pagination: 10/25/50
- Empty state: EmptyState component
- Loading: Skeleton overlay

### ToggleGroup
- Container: bg-inset, radius-sm, p-0.5
- Items: equal width buttons
- Active: bg-raised, border-subtle, text-primary
- Inactive: text-muted

### Toast
- Fixed: bottom-right, z-50
- Variants: success, error, warning, info
- Auto-dismiss: success 3s, warning 5s, error manual
- Max visible: 5
- Stack: newest on top

### CommandPalette
- Trigger: Ctrl+K / Cmd+K
- Width: 480px, max-height: 384px
- Position: top-center
- Search: fuse.js fuzzy
- Sections: Screens, Recent Repairs, Quick Actions
- Keyboard: ↑↓ navigate, Enter select, Esc close

### KanbanBoard
- Columns: received, repairing, ready, completed
- Drag-and-drop: @dnd-kit/core
- Cards: compact, status border-left
- Column headers: colored, item count
- Empty column: drop zone placeholder

### Skeleton
- Base: bg-raised, animate-pulse
- Variants: Skeleton, SkeletonTable, SkeletonCard
- Match dimensions of actual content

### EmptyState
- Centered: py-16, gap-3
- Icon: 40px, text-muted/40
- Title: text-base, font-medium, text-secondary
- Description: text-sm, text-muted, max-w-sm
- Action: optional button below

## 10. Status Colors
| Status | Color | Dot |
|--------|-------|-----|
| Received | gray-400 | ● gray |
| Awaiting Approval | amber-400 | ● amber |
| Repairing | blue-400 | ● blue |
| Ready for Collection | purple-400 | ● purple |
| Completed | green-400 | ● green |
| Completed — Under Warranty | green-400 | ● green |
| Declined | red-400 | ● red |
| Cancelled | red-400 | ● red |
| Closed | gray-500 | ● gray |

## 11. Layout Rules
- App shell: flex-col, h-screen
- Sidebar: w-56 (224px), fixed
- Content: flex-1, overflow-y-auto
- Content container: max-w-5xl (1024px), mx-auto, p-6
- Card spacing: space-y-6
- Grid gaps: gap-4 or gap-6
- Section spacing: mb-4 (in cards), space-y-6 (between cards)

## 12. Interaction Patterns
- Debounced search: 300ms delay
- Phone validation: regex + async lookup
- Status change: optimistic UI + backend sync
- Form submission: loading button + error display
- Navigation: Zustand store update → ScreenRouter re-render
- Data loading: mounted ref guard, parallel promises
- Error display: ErrorBanner (inline), alert (urgent)

## 13. Accessibility
- All buttons: focus-visible ring-2 ring-brand/50
- All inputs: associated labels via htmlFor/id
- Status badges: text + color (not color-only)
- Modals: role=dialog, aria-modal, focus trap
- Tables: proper thead/tbody, th with scope
- Color contrast: all text passes WCAG AA (4.5:1+)
- Keyboard: all interactive elements reachable by Tab

## 14. Performance
- Lucide: tree-shaken per-import
- Debounced search: 300ms
- mounted ref guard: prevents stale state updates
- SQLite: WAL mode + indexed queries
- PDF: programmatic (no browser dependency)
- Bundle: ~70KB gzipped JS
- Tauri binary: ~7MB

## 15. Error Handling
- Load errors: ErrorBanner with message + close
- Validation: inline error text below inputs
- Action errors: alert() for urgent, ErrorBanner for non-urgent
- Silent failures: .catch(() => {}) for non-critical data
- Backend: Result<T, String> with human-readable messages
