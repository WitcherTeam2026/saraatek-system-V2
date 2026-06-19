# Dark Mode Design System - Professional Minimal Theme
**For UI / Web / App**  
Based on your logo (purple symbol + TEK)  
**Style**: Minimal, professional, accessible dark mode (low color usage)

## 1. Core Principles
- **Very minimal color**: One primary accent (deep purple)
- **High accessibility**: WCAG AA compliant (contrast ≥4.5:1 for text, ≥3:1 for UI)
- **Background**: Dark grays instead of pure black to reduce eye strain
- **Focus**: Typography, spacing, and subtle interactions over bright colors

## 2. Color Palette

### Backgrounds
| Name              | Hex       | RGB             | Usage |
|-------------------|-----------|-----------------|-------|
| bg-primary        | #0A0A0A   | 10,10,10        | Main page/app background |
| bg-surface        | #111111   | 17,17,17        | Cards, panels, modals |
| bg-elevated       | #1A1A1A   | 26,26,26        | Headers, sidebars, toolbars, floating elements |
| bg-overlay        | #000000CC | 0,0,0 (80% opacity) | Modals backdrop |

### Text
| Name              | Hex       | RGB             | Usage | Min Contrast |
|-------------------|-----------|-----------------|-------|--------------|
| text-primary      | #F5F5F5   | 245,245,245     | Headings, body text | 15:1+ on bg-surface |
| text-secondary    | #AAAAAA   | 170,170,170     | Subtitles, labels | 7:1+ |
| text-muted        | #666666   | 102,102,102     | Captions, placeholders, disabled | 3:1+ |
| text-inverse      | #111111   | 17,17,17        | On light accents (rare) | - |

### Accents & Brand
| Name                    | Hex       | RGB             | Usage |
|-------------------------|-----------|-----------------|-------|
| brand-purple-primary    | #6B46C1   | 107,70,193      | Logo symbol, primary buttons, links, active nav |
| brand-purple-hover      | #7C5DD7   | 124,93,215      | Hover states |
| brand-purple-active     | #5A3AA8   | 90,58,168       | Active/pressed states |
| accent-red (subtle)     | #D14D4D   | 209,77,77       | Errors, "T" in TEK (sparingly) |
| accent-green (subtle)   | #10A070   | 16,160,112      | Success, "E" in TEK (sparingly) |
| accent-blue (subtle)    | #3B82F6   | 59,130,246      | Info, "K" in TEK (sparingly) |

### Borders & Dividers
| Name              | Hex       | RGB             | Usage |
|-------------------|-----------|-----------------|-------|
| border-default    | #222222   | 34,34,34        | Default borders, dividers |
| border-strong     | #333333   | 51,51,51        | Focused or emphasized borders |
| border-purple      | #6B46C1   | 107,70,193      | Accent borders (rare) |

### Semantic / Status
| Name              | Hex       | Usage |
|-------------------|-----------|-------|
| success           | #10A070   | Success messages |
| error             | #D14D4D   | Error messages |
| warning           | #D97706   | Warnings |
| info              | #3B82F6   | Informational |

## 3. Typography Recommendations
- **Font Family**: `Inter`, `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, Roboto, sans-serif
- **Heading sizes**: Use proper scale (e.g. 2xl, 3xl)
- **Line height**: 1.5–1.7 for readability
- **Font weight**: 400 (regular), 500 (medium), 600 (semibold)

## 4. Accessibility Compliance (WCAG AA)
- All text meets ≥4.5:1 contrast
- UI components meet ≥3:1 non-text contrast
- Focus indicators: 2px solid purple border + outline
- Supports `prefers-color-scheme: dark`
- Color not sole indicator of information

## 5. Tailwind CSS Configuration (Ready to Copy)

```js
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'bg-primary': '#0A0A0A',
        'bg-surface': '#111111',
        'bg-elevated': '#1A1A1A',
        
        // Text
        'text-primary': '#F5F5F5',
        'text-secondary': '#AAAAAA',
        'text-muted': '#666666',
        
        // Brand
        'brand-purple': {
          500: '#6B46C1',
          600: '#5A3AA8',
          700: '#4C2F91',
        },
        
        // Borders
        border: '#222222',
      }
    }
  },
  plugins: [],
}
```

## 6. CSS Custom Properties (Alternative)

```css
:root {
  --bg-primary: #0A0A0A;
  --bg-surface: #111111;
  --bg-elevated: #1A1A1A;
  
  --text-primary: #F5F5F5;
  --text-secondary: #AAAAAA;
  --text-muted: #666666;
  
  --brand-purple: #6B46C1;
  --border-default: #222222;
}
```

## 7. Logo Treatment Recommendations
- Keep purple symbol as-is or slightly darken glow
- Change "TEK" text to `#F5F5F5` (neutral) or single `#6B46C1`
- Reduce neon glow intensity for professional look
- Minimum size: Ensure logo maintains contrast and readability at small sizes

## 8. Component Examples (Tailwind)
**Primary Button**
```html
<button class="bg-brand-purple hover:bg-[#7C5DD7] text-white px-6 py-3 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500">
  Get Started
</button>
```

**Card**
```html
<div class="bg-bg-surface border border-[#222222] rounded-2xl p-6">
  <!-- content -->
</div>
```

This file covers everything: palette, usage, accessibility, code-ready configs. 

**Next step?** I can generate the actual Tailwind file, CSS file, or Figma style export if needed.