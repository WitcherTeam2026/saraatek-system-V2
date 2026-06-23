# SaraaTEK UI Redesign V4 — THE ULTIMATE FUTURE

**Version:** 4.0 — The Definitive 2026-2030 Design System
**Date:** 2026-06-22
**Status:** Planning Phase
**Goal:** Build the most advanced, future-proof, AI-powered, spatially-aware repair shop management system ever created.

---

## Table of Contents

1. [The 2030 Vision](#1-the-2030-vision)
2. [Complete Technology Stack](#2-complete-technology-stack)
3. [Apple Liquid Glass Implementation](#3-apple-liquid-glass-implementation)
4. [3D & Spatial Computing](#4-3d--spatial-computing)
5. [Agentic AI-Powered UI](#5-agentic-ai-powered-ui)
6. [Motion & Micro-Interactions](#6-motion--micro-interactions)
7. [Token System V4](#7-token-system-v4)
8. [Component Library](#8-component-library)
9. [Screen Designs](#9-screen-designs)
10. [Implementation Roadmap](#10-implementation-roadmap)

---

## 1. The 2030 Vision

### From Reactive to Agentic UI

The singular most significant shift in interface design history is occurring right now. We are moving from **Reactive UI**—where an interface waits for a user to click—to **Agentic UI**, where the interface anticipates intent and executes on behalf of the user.

### The Evolution Timeline

| Era | Year | Interface | Input |
|---|---|---|---|
| **Flat Design** | 2013-2020 | 2D surfaces | Click/Tap |
| **Glassmorphism** | 2020-2025 | Frosted glass | Click/Type |
| **Liquid Glass** | 2025-2027 | Refractive depth | Click/Type/Voice |
| **Agentic UI** | 2027-2030 | Intent-aware | Thought/Context |
| **Spatial Computing** | 2030+ | 3D holographic | Gaze/Neural |

### SaraaTEK Position

We build at the **Liquid Glass → Agentic UI** boundary:
- Apple Liquid Glass for premium visual language
- AI-powered anticipation for reduced friction
- 3D device previews for spatial awareness
- Fallback patterns for future neural interfaces

---

## 2. Complete Technology Stack

### Core Framework

| Layer | Technology | Purpose |
|---|---|---|
| **Desktop** | Tauri 2 | Lightweight native shell |
| **Frontend** | React 19 | Component-based UI |
| **Language** | TypeScript ~6.0 | Type safety |
| **Styling** | Tailwind CSS v4 | Utility-first CSS |
| **Build** | Vite 8 | Fast bundling |

### UI & Animation

| Library | Purpose | Size |
|---|---|---|
| **shadcn/ui** | Accessible primitives | 0KB (copy) |
| **Radix UI** | Headless components | ~30KB |
| **Framer Motion** | React animations | ~150KB |
| **GSAP** | Advanced timeline | ~200KB |
| **Lenis** | Smooth scroll | ~20KB |
| **Lucide** | Icon system | ~100KB |

### 3D & Visual Effects

| Library | Purpose | Size |
|---|---|---|
| **Three.js** | 3D engine | ~600KB |
| **React Three Fiber** | React renderer | ~150KB |
| **React Three Drei** | 3D utilities | ~100KB |
| **React Three Postprocessing** | Visual effects | ~50KB |
| **Spline** | 3D design tool | Integration |

### Charts & Data Viz

| Library | Purpose |
|---|---|
| **Recharts** | React chart library |
| **D3.js** | Data visualization |
| **Victory** | Scientific charts |

### AI & Intelligence

| Library | Purpose |
|---|---|
| **Vercel AI SDK** | AI streaming |
| **OpenAI API** | GPT integration |
| **Anthropic API** | Claude integration |
| **Ollama** | Local AI models |
| **LangChain** | AI orchestration |
| **LangGraph** | Agent workflows |

### Backend & Data

| Layer | Technology |
|---|---|
| **Runtime** | Node.js / Bun |
| **API** | tRPC / FastAPI |
| **ORM** | Drizzle / Prisma |
| **Database** | SQLite (local) + PostgreSQL (cloud) |
| **Cache** | Redis |
| **Realtime** | Socket.io / Liveblocks |

### Auth & Security

| Library | Purpose |
|---|---|
| **Auth.js** | Authentication |
| **Zod** | Schema validation |
| **OWASP** | Security patterns |

### Infrastructure

| Service | Purpose |
|---|---|
| **Docker** | Containerization |
| **Vercel** | Deployment |
| **Railway** | Backend hosting |
| **Sentry** | Error tracking |
| **PostHog** | Analytics |

### Fonts

| Font | Purpose |
|---|---|
| **Inter** | Body text |
| **JetBrains Mono** | Code/data |
| **Space Grotesk** | Display |

---

## 3. Apple Liquid Glass Implementation

### 4-Layer Architecture

```css
/* ─── Layer 1: Glass Base ─── */
.liquid-glass {
  position: relative;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(var(--blur-md)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--blur-md)) saturate(180%);
}

/* ─── Layer 2: Rim Highlights ─── */
.liquid-glass::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.55),  /* top specular */
    inset 0 -1px 1px rgba(255, 255, 255, 0.30),  /* bottom reflection */
    inset 1px 0 1px rgba(255, 255, 255, 0.20),   /* left edge */
    inset -1px 0 1px rgba(255, 255, 255, 0.20);  /* right edge */
}

/* ─── Layer 3: Specular Sheen ─── */
.liquid-glass::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.45) 0%,
    rgba(255, 255, 255, 0.08) 28%,
    transparent 58%
  );
  mix-blend-mode: screen;
}

/* ─── Layer 4: SVG Refraction ─── */
<svg width="0" height="0" style="position: absolute">
  <filter id="liquid-refract" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="4" result="noise" />
    <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
    <feDisplacementMap in="SourceGraphic" in2="blurred" scale="60" xChannelSelector="R" yChannelSelector="G" />
  </filter>
</svg>
```

### Mouse-Reactive Specular

```tsx
'use client'
import { useRef, useState } from 'react'

export function LiquidCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 50, y: 50 })

  return (
    <div
      ref={ref}
      className="liquid-glass rounded-xl overflow-hidden"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setPos({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        })
      }}
      style={{
        background: `radial-gradient(circle at ${pos.x}% ${pos.y}%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 50%, transparent 100%)`
      }}
    >
      {children}
    </div>
  )
}
```

### Glass Thickness Scale

```css
.glass-thin { backdrop-filter: blur(8px) saturate(180%); --glass-bg: rgba(255,255,255,0.04); }
.glass-regular { backdrop-filter: blur(16px) saturate(180%); --glass-bg: rgba(255,255,255,0.06); }
.glass-thick { backdrop-filter: blur(24px) saturate(180%); --glass-bg: rgba(255,255,255,0.08); }
.glass-heavy { backdrop-filter: blur(32px) saturate(180%); --glass-bg: rgba(255,255,255,0.10); }
.glass-max { backdrop-filter: blur(48px) saturate(180%); --glass-bg: rgba(255,255,255,0.12); }
```

---

## 4. 3D & Spatial Computing

### React Three Fiber Setup

```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing postprocessing
```

### Device Preview (Repair Detail)

```tsx
'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { Suspense, useRef } from 'react'
import * as THREE from 'three'

function LaptopModel() {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
    }
  })
  return (
    <group ref={ref}>
      <mesh position={[0, -0.5, 0]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[2, 0.1, 1.4]} />
        <meshStandardMaterial color="#2A2A2E" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.4, -0.6]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[1.8, 1.2, 0.05]} />
        <meshStandardMaterial color="#1A1A1E" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.4, -0.57]} rotation={[0.3, 0, 0]}>
        <planeGeometry args={[1.6, 1.0]} />
        <meshStandardMaterial color="#7C4DFF" emissive="#7C4DFF" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

export function DevicePreview({ type }: { type: 'laptop' | 'phone' | 'tablet' }) {
  return (
    <div className="w-full h-48 rounded-xl overflow-hidden glass-surface">
      <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full" /></div>}>
        <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <spotLight position={[5, 5, 5]} angle={0.3} penumbra={0.5} />
          <LaptopModel />
          <ContactShadows position={[0, -1, 0]} opacity={0.3} scale={5} blur={2} />
          <Environment preset="city" />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </Suspense>
    </div>
  )
}
```

### Status Orb (3D Indicator)

```tsx
'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import * as THREE from 'three'

const COLORS: Record<string, string> = {
  received: '#6B7280', awaiting: '#F59E0B', repairing: '#3B82F6',
  ready: '#8B5CF6', completed: '#10B981', declined: '#EF4444',
}

function OrbMesh({ status }: { status: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.5
      ref.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.6, 2]} />
      <meshStandardMaterial color={COLORS[status]} emissive={COLORS[status]} emissiveIntensity={0.4} metalness={0.7} roughness={0.2} wireframe />
    </mesh>
  )
}

export function StatusOrb({ status }: { status: string }) {
  return (
    <div className="w-8 h-8">
      <Suspense fallback={null}>
        <Canvas camera={{ position: [0, 0, 2], fov: 50 }}>
          <ambientLight intensity={0.3} />
          <pointLight position={[2, 2, 2]} intensity={0.8} />
          <OrbMesh status={status} />
        </Canvas>
      </Suspense>
    </div>
  )
}
```

### Particle Background

```tsx
'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

function Particles({ count = 150 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const particles = useMemo(() => Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 20,
    y: (Math.random() - 0.5) * 20,
    z: (Math.random() - 0.5) * 10 - 5,
    s: Math.random() * 0.02 + 0.01
  })), [count])

  useFrame((state) => {
    if (!mesh.current) return
    const dummy = new THREE.Object3D()
    particles.forEach((p, i) => {
      dummy.position.set(p.x, p.y + Math.sin(state.clock.elapsedTime * 0.5 + i * 0.1) * 0.5, p.z)
      dummy.scale.setScalar(p.s)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#7C4DFF" transparent opacity={0.3} />
    </instancedMesh>
  )
}

export function ParticleBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <Particles count={150} />
      </Canvas>
    </div>
  )
}
```

### Post-Processing Pipeline

```tsx
'use client'
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

export function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom intensity={0.5} luminanceThreshold={0.6} luminanceSmoothing={0.9} mipmapBlur />
      <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={[0.001, 0.001]} />
      <Vignette offset={0.3} darkness={0.7} />
      <Noise opacity={0.02} blendFunction={BlendFunction.SOFT_LIGHT} />
    </EffectComposer>
  )
}
```

---

## 5. Agentic AI-Powered UI

### Intent Prediction System

```typescript
// AI-driven intent prediction
interface UserIntent {
  action: string
  confidence: number
  context: string[]
}

class IntentPredictor {
  private history: string[] = []
  private model: any // LSTM or transformer

  async predict(currentState: any): Promise<UserIntent[]> {
    // Analyze user behavior patterns
    const features = this.extractFeatures(currentState)
    
    // Get predictions from model
    const predictions = await this.model.predict(features)
    
    // Return top 3 likely intents
    return predictions.slice(0, 3)
  }

  private extractFeatures(state: any) {
    return {
      timeOfDay: new Date().getHours(),
      recentActions: this.history.slice(-10),
      currentScreen: state.screen,
      pendingRepairs: state.repairs.filter((r: any) => r.status === 'Received').length,
      uncollectedRepairs: state.repairs.filter((r: any) => r.status === 'Ready for Collection').length,
    }
  }
}
```

### Adaptive Layout Engine

```typescript
// Dynamic layout adaptation based on user behavior
class AdaptiveLayout {
  private userPreferences: Map<string, any> = new Map()

  adapt(screen: string, userBehavior: any) {
    // If user always checks revenue first → make it hero
    if (userBehavior.mostViewedMetric === 'revenue') {
      return { heroMetric: 'revenue', order: ['revenue', 'repairs', 'technicians'] }
    }

    // If user always filters by status → show filters prominently
    if (userBehavior.usesFilters > 0.7) {
      return { filtersExpanded: true, filterPriority: ['status', 'technician'] }
    }

    // Default layout
    return { heroMetric: 'open_repairs', order: ['repairs', 'awaiting', 'ready'] }
  }
}
```

### Ambient Intelligence

```typescript
// Background AI that monitors and assists
class AmbientAI {
  async monitorRepairs(repairs: Repair[]) {
    // Detect anomalies
    const longRunning = repairs.filter(r => {
      const days = differenceInDays(new Date(), new Date(r.received_at))
      return days > 7 && !['Completed', 'Closed', 'Cancelled'].includes(r.status)
    })

    if (longRunning.length > 0) {
      this.notify('Long-running repairs detected', longRunning)
    }

    // Predict collection patterns
    const readyForCollection = repairs.filter(r => r.status === 'Ready for Collection')
    if (readyForCollection.length > 5) {
      this.suggestBulkNotification(readyForCollection)
    }
  }

  async suggestNextAction(context: any) {
    // Based on time of day, suggest common actions
    const hour = new Date().getHours()
    
    if (hour === 9) {
      return { suggestion: 'Check overnight repairs', priority: 'high' }
    }
    
    if (hour === 17) {
      return { suggestion: 'Send collection reminders', priority: 'medium' }
    }

    return null
  }
}
```

### AI Message Composer

```tsx
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'

interface AIMessageProps {
  repair: Repair
  onSend: (message: string) => void
}

export function AIMessageComposer({ repair, onSend }: AIMessageProps) {
  const [goal, setGoal] = useState('')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDraft = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/draft', {
        method: 'POST',
        body: JSON.stringify({
          repairId: repair.id,
          customerName: repair.customer_name,
          device: `${repair.brand} ${repair.model}`,
          status: repair.status,
          goal
        })
      })
      const { message } = await response.json()
      setDraft(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-modal rounded-xl p-4 space-y-4">
      <h3 className="text-lg font-semibold text-text-1">AI Message Composer</h3>
      
      <div className="text-sm text-text-2">
        <p>Customer: {repair.customer_name}</p>
        <p>Device: {repair.brand} {repair.model}</p>
        <p>Status: {repair.status}</p>
      </div>

      <input
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="What do you want to tell the customer?"
        className="w-full bg-inset border border-border-default rounded-md px-3 py-2 text-text-primary focus:outline-none focus:border-accent/50"
      />

      <div className="flex gap-2">
        <button onClick={handleDraft} disabled={loading} className="liquid-button px-4 py-2">
          {loading ? 'Drafting...' : 'Draft Message'}
        </button>
      </div>

      {draft && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="w-full bg-inset border border-border-default rounded-md px-3 py-2 text-text-primary h-32 focus:outline-none focus:border-accent/50" />
          <button onClick={() => onSend(draft)} className="liquid-button px-4 py-2">Send</button>
        </motion.div>
      )}
    </div>
  )
}
```

---

## 6. Motion & Micro-Interactions

### Framer Motion Primitives

```tsx
'use client'
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion'

// ─── Magnetic Button ───
export function MagneticButton({ children, ...props }: any) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  return (
    <motion.button
      style={{ x, y }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        x.set((e.clientX - rect.left - rect.width / 2) * 0.15)
        y.set((e.clientY - rect.top - rect.height / 2) * 0.15)
      }}
      onMouseLeave={() => { x.set(0); y.set(0) }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// ─── Parallax Card ───
export function ParallaxCard({ children }: { children: React.ReactNode }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-100, 100], [5, -5]), { stiffness: 300, damping: 30 })
  const rotateY = useSpring(useTransform(x, [-100, 100], [-5, 5]), { stiffness: 300, damping: 30 })

  return (
    <motion.div
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        x.set(e.clientX - rect.left - rect.width / 2)
        y.set(e.clientY - rect.top - rect.height / 2)
      }}
      onMouseLeave={() => { x.set(0); y.set(0) }}
      className="liquid-glass rounded-xl"
    >
      {children}
    </motion.div>
  )
}

// ─── Staggered List ───
export function StaggeredList({ items, renderItem }: { items: any[]; renderItem: (item: any) => React.ReactNode }) {
  return (
    <motion.ul initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
      {items.map((item, i) => (
        <motion.li key={item.id} variants={{ hidden: { opacity: 0, x: -20, filter: 'blur(4px)' }, visible: { opacity: 1, x: 0, filter: 'blur(0px)' } }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}>
          {renderItem(item)}
        </motion.li>
      ))}
    </motion.ul>
  )
}

// ─── Page Transition ───
export function PageTransition({ children, routeKey }: { children: React.ReactNode; routeKey: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={routeKey} initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -12, filter: 'blur(8px)' }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Number Ticker ───
export function NumberTicker({ value, duration = 1 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = display
    let startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + (value - start) * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value, duration])
  return <span className="tabular-nums">{display.toLocaleString()}</span>
}
```

### Motion Budget

| Element | Duration | Easing | Effect |
|---|---|---|---|
| Button magnetic | 150ms | spring(400, 15) | x/y translate |
| Card parallax | 200ms | spring(300, 30) | rotateX/Y |
| List stagger | 50ms/item | spring(300, 24) | opacity, x, blur |
| Page transition | 250ms | [0.16, 1, 0.3, 1] | opacity, y, blur |
| Number ticker | 1000ms | ease-out-cubic | value |
| Modal enter | 300ms | spring(400, 25) | opacity, scale, blur |
| Toast enter | 200ms | spring(400, 25) | opacity, x |

---

## 7. Token System V4

```css
:root {
  /* ─── Surfaces ─── */
  --surface-0: oklch(6% 0.012 260);
  --surface-1: oklch(9% 0.012 260);
  --surface-2: oklch(12% 0.012 260);
  --surface-3: oklch(15% 0.012 260);
  --surface-4: oklch(18% 0.012 260);
  --surface-5: oklch(22% 0.012 260);

  /* ─── Glass ─── */
  --glass-1: rgba(255, 255, 255, 0.03);
  --glass-2: rgba(255, 255, 255, 0.05);
  --glass-3: rgba(255, 255, 255, 0.08);
  --glass-4: rgba(255, 255, 255, 0.10);
  --glass-5: rgba(255, 255, 255, 0.12);

  /* ─── Blur ─── */
  --blur-sm: 8px;
  --blur-md: 16px;
  --blur-lg: 24px;
  --blur-xl: 32px;
  --blur-2xl: 48px;

  /* ─── Text ─── */
  --text-1: oklch(95% 0.005 260);
  --text-2: oklch(72% 0.01 260);
  --text-3: oklch(55% 0.012 260);
  --text-4: oklch(40% 0.012 260);

  /* ─── Accent ─── */
  --accent: oklch(68% 0.18 280);
  --accent-hover: oklch(74% 0.18 280);
  --accent-active: oklch(60% 0.18 280);
  --accent-tint: oklch(68% 0.18 280 / 0.10);
  --accent-glow: oklch(68% 0.18 280 / 0.25);

  /* ─── Specular ─── */
  --specular-top: rgba(255, 255, 255, 0.18);
  --specular-rim: rgba(255, 255, 255, 0.55);
  --specular-edge: rgba(255, 255, 255, 0.20);

  /* ─── Radii ─── */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-2xl: 28px;
  --radius-full: 9999px;

  /* ─── Typography ─── */
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* ─── Motion ─── */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 8. Component Library

### Complete Component List

| Component | Glass | 3D | Motion | AI | Priority |
|---|---|---|---|---|---|
| LiquidButton | thick | magnetic | spring | — | P0 |
| LiquidInput | regular | floating label | blur | — | P0 |
| LiquidCard | regular | parallax | hover lift | — | P0 |
| LiquidModal | heavy | — | enter/exit | — | P0 |
| LiquidMetricCard | elevated | ticker | spring | prediction | P0 |
| LiquidTable | surface | — | stagger | — | P0 |
| LiquidSidebar | surface | — | collapse | — | P0 |
| LiquidToast | floating | — | slide | — | P0 |
| LiquidStatusOrb | thin | 3D orb | rotate | — | P1 |
| LiquidDevicePreview | regular | 3D model | float | — | P1 |
| LiquidParticleBg | thin | particles | wave | — | P1 |
| LiquidAIComposer | floating | — | — | Gemini/OpenRouter | P1 |
| LiquidCommandPalette | floating | — | enter/exit | fuzzy search | P1 |
| LiquidKanban | surface | drag | spring | — | P2 |

---

## 9. Screen Designs

### Dashboard — Ultimate

```
┌─────────────────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░ PARTICLE BACKGROUND ░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░ AMBIENT GRADIENT MESH ░░░░░░░░░░░░░░░░░░░░░░ │
│                                                                     │
│ ┌──────┬──────────────────────────────────────────────────────────┐ │
│ │LIQUID│  topbar: SaraaTEK / Dashboard     [⌘K]  [—][□][✕]     │ │
│ │GLASS │────────────┬────────┬────────┬──────────────────────────┤ │
│ │SIDE- │ HERO CARD  │ card 2 │ card 3 │ STATUS STRIP            │ │
│ │BAR   │ (accent    │ (glass)│ (glass)│ (liquid glass)           │ │
│ │      │  glow +    │        │        │ ● ● ● ● ●              │ │
│ │      │  3D orb)   │        │        │                          │ │
│ │      ├────────────┴────────┴────────┴──────────────────────────┤ │
│ │      │ FILTER ROW (ghost buttons)                              │ │
│ │      ├──────────────────────────────────────────────────────────┤ │
│ │      │ WORK QUEUE TABLE (liquid surface, stagger entrance)     │ │
│ │      │ [3D StatusOrb] ID · Customer · Device · Status · Date  │ │
│ │      │    ●         00003  Acme    Dell    ● Repairing        │ │
│ └──────┴──────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ░░░░░░░░░░░░░░░░░░░ POST-PROCESSING ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────────────────────────────────────────┘
```

### AI Assistant — Floating Glass Panel

```
┌─────────────────────────────────────────────────┐
│ AI Assistant                        [—] [✕]    │
│ (glass-floating, backdrop-blur-48)              │
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
│ │     [Apply Estimate] [Modify]           │    │
│ └─────────────────────────────────────────┘    │
├─────────────────────────────────────────────────┤
│ [Message input............] [Send] [Regenerate] │
└─────────────────────────────────────────────────┘
```

---

## 10. Implementation Roadmap

### Phase A: Foundation (Week 1-2)

1. Install all dependencies
2. Create V4 token system
3. Set up Liquid Glass CSS
4. Build ambient particle background
5. Configure Framer Motion + GSAP + Lenis

### Phase B: Liquid Glass Components (Week 3-5)

1. LiquidButton (magnetic, spring)
2. LiquidInput (floating label)
3. LiquidCard (parallax, reactive refraction)
4. LiquidModal (enter/exit, backdrop blur)
5. LiquidMetricCard (ticker, sparkline)
6. LiquidTable (stagger, keyboard nav)
7. LiquidSidebar (tinted, collapsible)
8. LiquidToast (variants, auto-dismiss)
9. LiquidStatusBadge (dot + text)
10. LiquidEmptyState (designed, helpful)

### Phase C: 3D Integration (Week 6-8)

1. Set up React Three Fiber
2. Create ParticleBackground
3. Create DevicePreview (laptop, phone, tablet)
4. Create StatusOrb (animated 3D indicators)
5. Add post-processing (bloom, vignette, grain)
6. Optimize performance

### Phase D: AI Integration (Week 9-11)

1. Set up Gemini + OpenRouter
2. Create IntentPredictor
3. Create AdaptiveLayout
4. Create AmbientAI
5. Create AIMessageComposer
6. Create AIAssistant panel

### Phase E: Polish (Week 12-14)

1. Loading states (geometry-matching skeletons)
2. Empty states (all screens)
3. Error states (graceful recovery)
4. Keyboard shortcuts (⌘K command palette)
5. Accessibility audit (WCAG AA)
6. Performance pass (<250KB gzipped)
7. Cross-platform testing
8. Visual regression tests
9. Documentation

---

## Success Metrics

| Metric | Target |
|---|---|
| Glass layers | 5 distinct depth levels |
| Liquid Glass | 4-layer architecture |
| 3D elements | 3-4 per screen |
| Post-processing | Bloom + vignette + grain |
| AI features | Intent prediction, adaptive layout |
| Animations | All physics-based, GPU-only |
| Bundle size | <250KB gzipped |
| Framer Motion | All interactive elements |
| Tabular-nums | All data displays |
| Focus-visible | 100% interactive elements |
| WCAG AA | All text passes |
| Empty states | All screens |
| Loading states | All screens |

---

**Document Status:** Ultimate V4 plan with all technologies. Awaiting user review.

**Next Steps:**
1. User reviews this plan
2. Begin Phase A: Foundation
3. Build the future of desktop UI
