# SaraaTEK UI Redesign V2 — 1000x Master-Piece

**Version:** 2.0
**Date:** 2026-06-22
**Status:** Planning Phase
**Goal:** Transform SaraaTEK into the most premium repair shop management system ever built — combining Glassmorphism V4, 3D depth, liquid glass effects, and world-class micro-interactions.

---

## Table of Contents

1. [Design Philosophy 2026](#1-design-philosophy-2026)
2. [The 1000x Vision](#2-the-1000x-vision)
3. [Technology Stack](#3-technology-stack)
4. [Glassmorphism V4 System](#4-glassmorphism-v4-system)
5. [3D Depth Integration](#5-3d-depth-integration)
6. [Liquid Glass Effects](#6-liquid-glass-effects)
7. [Motion & Micro-Interactions](#7-motion--micro-interactions)
8. [Token System V2](#8-token-system-v2)
9. [Component System](#9-component-system)
10. [Screen Designs](#10-screen-designs)
11. [Skills & MCP Integration](#11-skills--mcp-integration)
12. [Implementation Phases](#12-implementation-phases)

---

## 1. Design Philosophy 2026

### The Volumetric UX Era

In 2026, "Surface Design" is over. We are in the era of **Volumetric UX** — depth is a functional tool for reducing cognitive load. By using Glassmorphism V4 Physics with refractive indices, we create UI layers that truly feel separated in 3D space, allowing the user's brain to categorize information faster.

### Core Principles

1. **Depth is Function** — Every layer has a purpose. Foreground = urgent. Background = context. Glass thickness = importance.

2. **Light Follows Physics** — Shadows have multiple penumbra layers, mimicking multi-source light environments. Gravity is the foundation of digital trust.

3. **Restraint in Motion** — Every animation serves a purpose. No decorative motion. GPU-only properties. `prefers-reduced-motion` always honored.

4. **Data is Sacred** — Charts, numbers, and tables are the heroes. Everything else is infrastructure.

5. **Craft in the Micro** — Six button states. Designed focus rings. Tabular-nums everywhere. Helpful empty states.

### Inspiration Matrix

| Source | What to Steal | Why |
|---|---|---|
| **Linear** | Surface ladder, keyboard-first, empty states | Proven dark canvas hierarchy |
| **Stripe** | Typography as hierarchy, tabular numbers | Financial data done right |
| **AuraGlass** | Liquid glass components, token system | Production-ready glass system |
| **Arcanea** | Motion primitives, gradient meshes | Cosmic dashboard patterns |
| **Apple HIG** | Spatial depth, glass layers | Platform-native feel |
| **Vercel** | Monochrome + context color | Clean navigation |

---

## 2. The 1000x Vision

### What Makes This Different

| Current (1x) | Target (1000x) |
|---|---|
| Flat dark UI | Volumetric glass layers with depth |
| Basic shadows | Multi-penumbra physics shadows |
| Simple hover | 6-state micro-interactions |
| Static charts | Animated, interactive data viz |
| Text-heavy | 3D device previews, visual status |
| Basic modals | Glassmorphic overlays with blur |
| Flat sidebar | Tinted glass sidebar with depth |
| Static metrics | Animated number tickers |
| Basic loading | Skeleton matching geometry |
| Plain empty states | Designed, helpful, branded |

### The Visual Language

```
┌─────────────────────────────────────────────────────────────────┐
│  DEPTH LAYER 4 (Modal)     ┌──────────────────────┐           │
│  Glass: 12px blur          │  LIQUID GLASS CARD   │           │
│  Opacity: 8%               │  Refractive: 1.15    │           │
│  Border: 1px white/10%     │  Shadow: multi-pen   │           │
│                             └──────────────────────┘           │
│  DEPTH LAYER 3 (Elevated)  ┌──────────────────────┐           │
│  Glass: 8px blur           │  DATA TABLE          │           │
│  Opacity: 5%               │  Status dots         │           │
│  Border: 1px white/6%      │  Tabular-nums        │           │
│                             └──────────────────────┘           │
│  DEPTH LAYER 2 (Surface)   ┌──────────────────────┐           │
│  Glass: 4px blur           │  METRIC CARDS        │           │
│  Opacity: 3%               │  Sparklines          │           │
│  Border: 1px white/4%      │  Hero + supports     │           │
│                             └──────────────────────┘           │
│  DEPTH LAYER 1 (Canvas)    ┌──────────────────────┐           │
│  Background: #09090B       │  AMBIENT GRADIENT    │           │
│  Subtle gradient mesh      │  Mesh orbs (subtle)  │           │
│  Grid lines (2% opacity)   │  Behind everything   │           │
│                             └──────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### New Dependencies

| Package | Purpose | Size |
|---|---|---|
| `@react-three/fiber` | 3D rendering for device previews | ~150KB |
| `@react-three/drei` | 3D utilities, camera controls | ~100KB |
| `three` | 3D engine | ~600KB |
| `framer-motion` | Premium animations | ~150KB |
| `@fontsource/inter` | Inter font | ~100KB |
| `@fontsource/jetbrains-mono` | Mono font for data | ~100KB |
| `recharts` | Data visualization | ~200KB |

### Bundle Impact

- Current: ~315KB JS (87KB gzipped)
- With 3D: ~800KB JS (~200KB gzipped)
- Tree-shaking: Only import used 3D components

### Performance Strategy

- **Lazy load 3D**: Only mount Three.js canvas when visible
- **Dynamic imports**: `React.lazy()` for heavy components
- **Web Workers**: Offload chart data processing
- **GPU acceleration**: `will-change: transform` on animated elements
- **Debounce**: 300ms on search, 150ms on resize

---

## 4. Glassmorphism V4 System

### The Physics of Glass

Glassmorphism V4 uses real-world physics to simulate light refraction and sub-surface scattering. The "Surface Design" era is over — we are now in "Volumetric UX."

### Glass Layers

```css
/* Layer 1: Canvas — background ambient */
.glass-canvas {
  background: linear-gradient(135deg, #09090B 0%, #0F0F12 50%, #0A0A0C 100%);
  position: relative;
  overflow: hidden;
}

/* Ambient gradient orbs — behind everything */
.glass-canvas::before {
  content: '';
  position: absolute;
  top: -20%;
  right: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(124, 77, 255, 0.08) 0%, transparent 70%);
  filter: blur(80px);
  animation: float 20s ease-in-out infinite;
}

/* Layer 2: Surface — cards, panels */
.glass-surface {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

/* Layer 3: Elevated — hover states, popovers */
.glass-elevated {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Layer 4: Modal — overlays, dialogs */
.glass-modal {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 16px;
  box-shadow:
    0 20px 25px rgba(0, 0, 0, 0.15),
    0 8px 10px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

/* Layer 5: Floating — tooltips, commands */
.glass-floating {
  background: rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.25),
    0 10px 20px rgba(0, 0, 0, 0.12);
}
```

### Shadow System — Multi-Penumbra

```css
/* Multi-penumbra shadows — mimicking real light */
.shadow-glass-sm {
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(255, 255, 255, 0.04) inset;
}

.shadow-glass-md {
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.10),
    0 2px 4px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

.shadow-glass-lg {
  box-shadow:
    0 10px 15px rgba(0, 0, 0, 0.12),
    0 4px 6px rgba(0, 0, 0, 0.08),
    0 2px 4px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(255, 255, 255, 0.06) inset;
}

.shadow-glass-xl {
  box-shadow:
    0 20px 25px rgba(0, 0, 0, 0.15),
    0 8px 10px rgba(0, 0, 0, 0.10),
    0 4px 6px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}

/* Active glow — brand accent */
.shadow-glass-glow {
  box-shadow:
    0 0 20px rgba(124, 77, 255, 0.15),
    0 0 40px rgba(124, 77, 255, 0.08),
    0 0 0 1px rgba(124, 77, 255, 0.2) inset;
}
```

---

## 5. 3D Depth Integration

### React Three Fiber Setup

```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
```

### 3D Elements

#### 1. Device Preview Card (Repair Detail)

A floating 3D model of the device being repaired. Shows condition photos mapped as textures.

```tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

function DeviceModel({ brand, model, photos }: DeviceProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      // Subtle floating animation
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })

  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <primitive ref={meshRef} object={deviceGeometry} />
      <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2.5} />
      <Environment preset="city" />
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  )
}
```

#### 2. Dashboard Background — Ambient Gradient Mesh

```tsx
function AmbientMesh() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.05
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.03
    }
  })

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Canvas>
        <ambientLight intensity={0.3} />
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[2, 1]} />
          <meshStandardMaterial 
            color="#7C4DFF" 
            wireframe 
            transparent 
            opacity={0.03}
          />
        </mesh>
      </Canvas>
    </div>
  )
}
```

#### 3. 3D Status Indicator

```tsx
function StatusOrb({ status }: { status: string }) {
  const colors = {
    received: '#6B7280',
    awaiting: '#F59E0B',
    repairing: '#3B82F6',
    ready: '#8B5CF6',
    completed: '#10B981',
    declined: '#EF4444',
  }

  return (
    <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial 
          color={colors[status]} 
          emissive={colors[status]} 
          emissiveIntensity={0.3}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Canvas>
  )
}
```

### 3D Performance Rules

- **Lazy mount**: Only render Canvas when visible
- **Low poly**: Max 10K triangles per scene
- **Instancing**: Reuse geometries for repeated elements
- **Frustum culling**: Skip off-screen objects
- **LOD**: Use lower detail when zoomed out
- **Max 2 canvases**: Per screen, preferably 1

---

## 6. Liquid Glass Effects

### SVG Displacement Filter

```css
/* Liquid glass distortion */
.liquid-glass {
  filter: url(#liquid-displacement);
  backdrop-filter: blur(8px) saturate(1.5);
  background: rgba(255, 255, 255, 0.04);
}

/* SVG filter definition */
<svg class="hidden">
  <defs>
    <filter id="liquid-displacement">
      <feTurbulence 
        type="fractalNoise" 
        baseFrequency="0.01" 
        numOctaves="3" 
        result="noise"
      />
      <feDisplacementMap 
        in="SourceGraphic" 
        in2="noise" 
        scale="10" 
        xChannelSelector="R" 
        yChannelSelector="G"
      />
    </filter>
  </defs>
</svg>
```

### Chromatic Aberration (Subtle)

```css
/* Chromatic aberration on hover */
.chromatic-hover:hover {
  text-shadow:
    -1px 0 rgba(255, 0, 0, 0.1),
    1px 0 rgba(0, 255, 255, 0.1);
  transition: text-shadow 0.2s ease-out;
}
```

### Gradient Mesh Backgrounds

```css
/* Cosmic gradient mesh */
.gradient-mesh {
  background:
    radial-gradient(ellipse at 20% 80%, rgba(124, 77, 255, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(59, 130, 246, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(16, 185, 129, 0.04) 0%, transparent 50%),
    linear-gradient(180deg, #09090B 0%, #0F0F12 100%);
}

/* Animated orbs */
@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: float 20s ease-in-out infinite;
}
```

---

## 7. Motion & Micro-Interactions

### Framer Motion Setup

```bash
npm install framer-motion
```

### Motion Primitives

#### 1. Glass Card with Hover

```tsx
import { motion } from 'framer-motion'

function GlassCard({ children, className }: GlassCardProps) {
  return (
    <motion.div
      className={`glass-surface ${className}`}
      whileHover={{ 
        scale: 1.02,
        boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(124, 77, 255, 0.2) inset'
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.div>
  )
}
```

#### 2. Number Ticker Animation

```tsx
import { useEffect, useRef, useState } from 'react'

function NumberTicker({ value, duration = 1 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const startTime = useRef(Date.now())
  const startValue = useRef(0)

  useEffect(() => {
    startValue.current = displayValue
    startTime.current = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime.current
      const progress = Math.min(elapsed / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      
      setDisplayValue(Math.round(startValue.current + (value - startValue.current) * eased))
      
      if (progress < 1) requestAnimationFrame(animate)
    }
    
    requestAnimationFrame(animate)
  }, [value, duration])

  return <span className="tabular-nums">{displayValue.toLocaleString()}</span>
}
```

#### 3. Staggered List Entrance

```tsx
function StaggeredList({ items }: { items: Item[] }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: { staggerChildren: 0.05 }
        }
      }}
    >
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        >
          <ItemRow item={item} />
        </motion.div>
      ))}
    </motion.div>
  )
}
```

#### 4. Page Transition

```tsx
import { AnimatePresence, motion } from 'framer-motion'

function PageTransition({ children, routeKey }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={routeKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

#### 5. Floating Label Input

```tsx
function FloatingInput({ label, value, onChange }: FloatingInputProps) {
  return (
    <div className="relative">
      <motion.label
        className="absolute left-3 text-text-muted pointer-events-none origin-left"
        animate={{
          y: value ? -24 : 0,
          scale: value ? 0.85 : 1,
          color: value ? 'var(--accent)' : 'var(--text-muted)'
        }}
        transition={{ duration: 0.15 }}
      >
        {label}
      </motion.label>
      <input
        value={value}
        onChange={onChange}
        className="w-full bg-inset border border-border-default rounded-md px-3 py-2.5 text-text-primary focus:outline-none focus:border-accent-brand/50 focus:ring-1 focus:ring-accent-brand/20"
      />
    </div>
  )
}
```

### Motion Budget

| Element | Duration | Easing | Properties |
|---|---|---|---|
| Button hover | 120ms | ease-out | transform, box-shadow |
| Button press | 80ms | ease-out | transform, opacity |
| Card hover | 200ms | spring(400, 25) | transform, box-shadow |
| Modal enter | 250ms | [0.16, 1, 0.3, 1] | opacity, scale, backdrop-filter |
| Modal exit | 150ms | ease-in | opacity, scale |
| Page transition | 200ms | [0.16, 1, 0.3, 1] | opacity, y |
| List stagger | 50ms/item | spring(300, 24) | opacity, y |
| Number ticker | 1000ms | ease-out-cubic | value |
| Toast enter | 200ms | spring(400, 25) | opacity, x, scale |
| Toast exit | 150ms | ease-in | opacity, x |
| Tooltip | 150ms | ease-out | opacity, y |
| Sidebar collapse | 200ms | ease-out | width |

### GPU-Only Properties

```css
/* Safe to animate */
.animate-safe {
  will-change: transform, opacity;
  transition: transform 0.2s ease-out, opacity 0.2s ease-out;
}

/* NEVER animate these */
/* width, height, padding, margin, top, left, right, bottom */
```

---

## 8. Token System V2

### OKLCH Color System

```css
:root {
  /* ─── Surface Ladder (Glassmorphism V4) ─── */
  --surface-0: oklch(6% 0.012 260);     /* #09090B — page */
  --surface-1: oklch(9% 0.012 260);     /* #0F0F12 — canvas */
  --surface-2: oklch(12% 0.012 260);    /* #141416 — cards */
  --surface-3: oklch(15% 0.012 260);    /* #1C1C1F — elevated */
  --surface-4: oklch(18% 0.012 260);    /* #232326 — hover */
  --surface-5: oklch(22% 0.012 260);    /* #2E2E32 — modal */

  /* ─── Glass Layers ─── */
  --glass-1: rgba(255, 255, 255, 0.03);
  --glass-2: rgba(255, 255, 255, 0.05);
  --glass-3: rgba(255, 255, 255, 0.08);
  --glass-4: rgba(255, 255, 255, 0.10);

  /* ─── Text Hierarchy ─── */
  --text-1: oklch(95% 0.005 260);       /* primary */
  --text-2: oklch(72% 0.01 260);        /* secondary */
  --text-3: oklch(55% 0.012 260);       /* tertiary */
  --text-4: oklch(40% 0.012 260);       /* disabled */

  /* ─── Brand Accent ─── */
  --accent: oklch(68% 0.18 280);        /* purple */
  --accent-hover: oklch(74% 0.18 280);  /* lighter */
  --accent-active: oklch(60% 0.18 280); /* darker */
  --accent-tint: oklch(68% 0.18 280 / 0.10);
  --accent-glow: oklch(68% 0.18 280 / 0.25);

  /* ─── Semantic ─── */
  --success: oklch(74% 0.12 155);
  --warning: oklch(78% 0.13 85);
  --danger: oklch(68% 0.16 25);
  --info: oklch(70% 0.12 250);

  /* ─── Hairlines ─── */
  --line-1: oklch(30% 0.012 260);
  --line-2: oklch(35% 0.012 260);
  --line-3: oklch(40% 0.012 260);

  /* ─── Typography ─── */
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* ─── Radii ─── */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* ─── Spacing (8px base) ─── */
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

  /* ─── Motion ─── */
  --duration-fast: 120ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ─── Z-Index ─── */
  --z-base: 0;
  --z-raised: 10;
  --z-dropdown: 20;
  --z-sticky: 30;
  --z-modal-backdrop: 40;
  --z-modal: 50;
  --z-toast: 60;
  --z-tooltip: 70;
}
```

---

## 9. Component System

### Glass Button

```tsx
import { motion } from 'framer-motion'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
}

function Button({ variant = 'primary', size = 'md', children, ...props }: ButtonProps) {
  const baseStyles = "relative rounded-md font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0"
  
  const variants = {
    primary: "bg-accent text-white hover:bg-accent-hover active:bg-accent-active shadow-glass-sm",
    secondary: "glass-surface text-text-1 hover:bg-glass-2 active:bg-glass-3",
    ghost: "text-text-2 hover:text-text-1 hover:bg-glass-1 active:bg-glass-2",
    danger: "bg-danger text-white hover:opacity-90 active:opacity-80",
  }
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-2.5 text-base gap-2.5",
  }

  return (
    <motion.button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      disabled={props.disabled || props.loading}
      {...props}
    >
      {props.loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : props.icon ? (
        <span className="shrink-0">{props.icon}</span>
      ) : null}
      {children}
    </motion.button>
  )
}
```

### Glass Input

```tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface InputProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'number' | 'password'
  error?: string
  hint?: string
  icon?: React.ReactNode
}

function Input({ label, value, onChange, type = 'text', error, hint, icon }: InputProps) {
  const [focused, setFocused] = useState(false)
  const isActive = focused || value.length > 0

  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
          {icon}
        </span>
      )}
      <motion.label
        className="absolute pointer-events-none origin-left"
        animate={{
          x: icon ? 36 : 12,
          y: isActive ? -10 : 12,
          scale: isActive ? 0.75 : 1,
          color: error ? 'var(--danger)' : isActive ? 'var(--accent)' : 'var(--text-3)'
        }}
        transition={{ duration: 0.15 }}
      >
        {label}
      </motion.label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-3 bg-inset border rounded-md text-text-primary text-sm focus:outline-none transition-colors duration-150 ${
          error 
            ? 'border-danger focus:ring-1 focus:ring-danger/20' 
            : 'border-border-default focus:border-accent/50 focus:ring-1 focus:ring-accent/20'
        }`}
      />
      <AnimatePresence>
        {(error || hint) && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={`text-xs mt-1 ${error ? 'text-danger' : 'text-text-3'}`}
          >
            {error || hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
```

### Glass Metric Card

```tsx
interface MetricCardProps {
  label: string
  value: number
  change?: number
  sparkline?: number[]
  primary?: boolean
}

function MetricCard({ label, value, change, sparkline, primary }: MetricCardProps) {
  return (
    <motion.div
      className={`p-4 rounded-lg ${
        primary 
          ? 'glass-surface border-accent/20 shadow-glass-glow' 
          : 'glass-surface'
      }`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-3 uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold mt-1 tabular-nums ${primary ? 'text-accent' : 'text-text-1'}`}>
            <NumberTicker value={value} />
          </p>
        </div>
        {change !== undefined && (
          <span className={`text-xs ${change >= 0 ? 'text-success' : 'text-danger'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      {sparkline && (
        <div className="mt-3 h-8">
          <Sparkline data={sparkline} color={primary ? 'var(--accent)' : 'var(--text-3)'} />
        </div>
      )}
    </motion.div>
  )
}
```

### Glass Modal

```tsx
import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const sizes = { sm: '384px', md: '448px', lg: '576px' }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Dialog */}
          <motion.div
            className="relative glass-modal p-6"
            style={{ width: sizes[size] }}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <h2 className="text-lg font-semibold text-text-1 mb-4">{title}</h2>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

---

## 10. Screen Designs

### Dashboard — Volumetric Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ ░░ AMBIENT GRADIENT MESH (behind everything) ░░                    │
│                                                                     │
│ ┌──────┬──────────────────────────────────────────────────────────┐ │
│ │ GLASS│  topbar: title · date range · ⌘K                         │ │
│ │ SIDE │────────────┬────────┬────────┬──────────────────────────┤ │
│ │ BAR  │ HERO CARD  │ card 2 │ card 3 │ STATUS STRIP (glass)    │ │
│ │      │ (accent    │        │        │ ● ● ● ● ●              │ │
│ │      │  glow)     │        │        │                          │ │
│ │      ├────────────┴────────┴────────┴──────────────────────────┤ │
│ │      │ FILTER ROW (ghost buttons)                              │ │
│ │      ├──────────────────────────────────────────────────────────┤ │
│ │      │ WORK QUEUE TABLE (glass-surface, dense, keyboard nav)   │ │
│ │      │ ID · Customer · Device · Status · Date                  │ │
│ │      │ 00003/03/04 · Acme · Dell XPS · ● Repairing            │ │
│ │      │ ...                                                     │ │
│ └──────┴──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Repair Detail — Split Panel with 3D

```
┌─────────────────────────────────────────────────────────────────────┐
│ sidebar │ back · 00003/03/04 · ● Repairing · actions              │
│         ├─────────────────────────┬─────────────────────────────────┤
│         │ LEFT PANEL              │ RIGHT PANEL                    │
│         │ (glass-surface)         │ (glass-elevated)               │
│         │                         │                                │
│         │ Customer info           │ STATUS TIMELINE (vertical)     │
│         │ Device info             │ ● Received → ● Repairing       │
│         │                         │                                │
│         │ ┌─────────────────┐    │ ACTIONS                        │
│         │ │ 3D DEVICE MODEL │    │ [Update Status] [Add Photos]   │
│         │ │ (floating,      │    │                                │
│         │ │  interactive)   │    │ PROGRESS NOTES                 │
│         │ └─────────────────┘    │ [textarea]                     │
│         │                         │                                │
│         ├─────────────────────────┴─────────────────────────────────┤
│         │ DOCUMENTS & PAYMENT (glass-surface)                      │
│         │ [Generate Quotation] [Generate Invoice] [Record Payment]  │
│         ├───────────────────────────────────────────────────────────┤
│         │ COMMUNICATIONS LOG (collapsible, glass)                  │
│         │ WhatsApp · Email · SMS · Two-way                         │
└─────────┴───────────────────────────────────────────────────────────┘
```

### AI Assistant — Floating Glass Panel

```
┌─────────────────────────────────────────────────┐
│ AI Assistant                        [—] [✕]    │
│ (glass-floating, backdrop-blur-16)              │
├─────────────────────────────────────────────────┤
│ Context: 00003/03/04 · Dell XPS · Repairing    │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐    │
│ │ User: What's the estimated cost?        │    │
│ └─────────────────────────────────────────┘    │
│ ┌─────────────────────────────────────────┐    │
│ │ AI: Based on similar repairs...         │    │
│ │     Estimated: LKR 45,000 - 55,000     │    │
│ │     Confidence: 85%                     │    │
│ └─────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
│ [Message input............] [Send] [Regenerate] │
└─────────────────────────────────────────────────┘
```

---

## 11. Skills & MCP Integration

### Recommended Skills

| Skill | Source | Installs | Purpose |
|---|---|---|---|
| `premium-frontend-design` | kv0906/cc-skills | 1.1K | Premium UI patterns |
| `framer-motion` | mindrally/skills | 1.3K | Animation patterns |
| `ui-craft` | local | — | Design system craft |
| `frontend-design` | local | — | Visual design principles |

### Install Commands

```bash
npx skills add kv0906/cc-skills@premium-frontend-design -g -y
npx skills add mindrally/skills@framer-motion -g -y
```

### MCP Integrations

| MCP Server | Purpose |
|---|---|
| `context7` | Library docs for Three.js, Framer Motion, Recharts |
| `sequential-thinking` | Complex design decisions |
| `playwright` | Visual regression testing |
| `sqlite` | Local data for 3D previews |

---

## 12. Implementation Phases

### Phase A: Foundation (Week 1-2)

1. Install dependencies (three, framer-motion, recharts, fonts)
2. Create token system (CSS custom properties)
3. Build glass component primitives (Button, Input, Card, Modal)
4. Set up Framer Motion provider
5. Create ambient gradient mesh background

### Phase B: Components (Week 3-4)

1. Glass Button (6 states)
2. Glass Input (floating label)
3. Glass Card (hover effects)
4. Glass Modal (enter/exit)
5. Glass MetricCard (ticker, sparkline)
6. Glass DataTable (sticky header, keyboard nav)
7. Glass Sidebar (tinted, collapsible)
8. Glass Toast (variants, auto-dismiss)
9. Glass StatusBadge (dot + text)
10. Glass EmptyState (designed, helpful)

### Phase C: 3D Integration (Week 5-6)

1. Set up React Three Fiber
2. Create DevicePreview component
3. Create StatusOrb component
4. Create AmbientMesh background
5. Add 3D to Dashboard
6. Add 3D to RepairDetail
7. Optimize performance (lazy load, low poly)

### Phase D: Motion (Week 7-8)

1. Page transitions (AnimatePresence)
2. Staggered list entrances
3. Number ticker animations
4. Hover micro-interactions
5. Focus ring animations
6. Skeleton loading animations
7. Toast entrance/exit
8. Modal backdrop blur

### Phase E: Polish (Week 9-10)

1. Loading states (geometry-matching skeletons)
2. Empty states (all screens)
3. Error states (graceful recovery)
4. Keyboard shortcuts (global + per-screen)
5. Command palette (Ctrl+K)
6. Accessibility audit (WCAG AA)
7. Performance pass (bundle size, render)
8. Cross-platform testing
9. Visual regression tests
10. Documentation

---

## Success Metrics

| Metric | Target |
|---|---|
| Glass layers | 5 distinct depth levels |
| 3D elements | 2-3 per screen max |
| Animations | All GPU-only, ≤300ms |
| Bundle size | <250KB gzipped (with 3D) |
| Framer Motion | All interactive elements |
| Tabular-nums | All data displays |
| Focus-visible | 100% interactive elements |
| WCAG AA | All text passes |
| Empty states | All screens |
| Loading states | All screens |

---

**Document Status:** Enhanced UI redesign plan V2. Awaiting user review and approval.

**Next Steps:**
1. User reviews this plan
2. Install recommended skills
3. Begin Phase A: Foundation
4. Iterate through phases sequentially
