# SaraaTEK Master Plan — Complete System Evolution

**Version:** 2.0
**Date:** 2026-06-22
**Status:** Planning Phase
**Goal:** Transform SaraaTEK from a repair management system into an AI-powered, cloud-synced, full-stack repair business platform with Apple Liquid Glass UI, 3D depth, and agentic AI.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current System Assessment](#2-current-system-assessment)
3. [Target Architecture](#3-target-architecture)
4. [UI/UX Design System](#4-uiux-design-system)
5. [Phase Breakdown](#5-phase-breakdown)
6. [Database Evolution](#6-database-evolution)
7. [Screen & Component Inventory](#7-screen--component-inventory)
8. [API Layer Design](#8-api-layer-design)
9. [Integration Points](#9-integration-points)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment & Migration](#11-deployment--migration)
12. [Timeline Estimates](#12-timeline-estimates)

---

## 1. Executive Summary

### What We're Building

SaraaTEK will evolve into a comprehensive repair business platform with:

- **Customer CRM** with company profiles, contact persons, communication logs, and timelines
- **Advanced Analytics** with revenue, repair, customer, warranty, and profit margin analysis
- **5-Level AI Assistant** powered by Gemini API (primary) + OpenRouter (fallback)
- **Multi-Channel Communications** — WhatsApp, Email, SMS with two-way messaging
- **Accounting Module** — Chart of Accounts, P&L, Balance Sheet, QuickBooks/Xero integration
- **Security** — User authentication, role-based access, comprehensive audit trail
- **Cloud Sync** — Google Cloud SQL with real-time sync and multi-device access
- **Document Management** — Templates, e-signatures, versioning, search, custom letterheads
- **Apple Liquid Glass UI** — 4-layer architecture with refraction, specular highlights, 3D depth
- **Agentic AI** — Intent prediction, adaptive layout, ambient intelligence

### Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Customer Model | Business-primary with contact persons | Companies are the main entity; individuals bring simpler profiles |
| AI Provider | Gemini (primary) + OpenRouter (fallback) | Free tier + fallback reliability |
| Database | SQLite (local) → Google Cloud SQL (synced) | Start local, migrate to cloud |
| Desktop Framework | Tauri 2 (keep) | Lightweight, performant, proven |
| Sync Strategy | Real-time via WebSocket + cloud backup | Instant updates across devices |
| Auth | PIN/Password + role-based access | Simple for shop environment |

### Module Selection Summary

| Module | Features Selected |
|---|---|
| Customer Profiles & CRM | Company Profile Pages, Contact Persons, Customer Timeline, Communication Log |
| Advanced Reporting | Revenue, Repair, Customer, Warranty, Profit Margin Analytics, Scheduled Reports, Data Viz, Comparative Analysis |
| AI Assistant | All 5 levels + Predictive Analytics, Anomaly Detection, Smart Suggestions, AI Cost Estimation |
| Communications | WhatsApp, Email, SMS, Two-Way, Communication History, Marketing Campaigns (with photos) |
| Accounting | Chart of Accounts, P&L, Balance Sheet, Multi-Payment, Late Payment Tracking, QuickBooks/Xero Integration |
| Security & Access | User Authentication, Audit Trail (enhanced) |
| Cloud & Sync | Google Cloud SQL, Real-Time Sync, Cloud Backup, Multi-Device Access |
| Document Management | Templates, E-Signatures, Versioning, Search, Letterhead Customization |
| Mobile Companion | Future phase |

---

## UNIFIED PHASE LIST (14 Phases)

### Phase 1-4: Complete ✅ (Current System)

| Phase | Features | Status |
|---|---|---|
| Phase 1 | Core Repair Management | ✅ Done |
| Phase 2 | Documents & Payment | ✅ Done |
| Phase 3 | Photos, Warranty & Notifications | ✅ Done |
| Phase 4 | Reporting & AI | ✅ Done |

### Phase 5: UI/UX Foundation (Week 1-2)

| Task | Description |
|---|---|
| Install Dependencies | shadcn/ui, Radix, Framer Motion, GSAP, Lenis, Three.js, Recharts, Fonts |
| Token System | OKLCH colors, glass scale, typography, spacing |
| Liquid Glass CSS | 4-layer architecture, rim highlights, specular sheen |
| Component Primitives | LiquidButton, LiquidInput, LiquidCard, LiquidModal |

### Phase 6: Customer CRM (Week 3-6)

| Task | Description |
|---|---|
| Company Profiles | Company list, profile tabs, contact persons |
| Communication Log | WhatsApp/Email/SMS history per company |
| Customer Timeline | Chronological view of all interactions |
| Database Schema | companies, contacts, communications tables |

### Phase 7: Security & Authentication (Week 7-9)

| Task | Description |
|---|---|
| Login System | PIN/Password authentication |
| User Management | Create/edit/deactivate users |
| Role-Based Access | Admin, Manager, Technician, Front Desk |
| Audit Trail | Enhanced with user attribution |

### Phase 8: 3D Integration (Week 10-12)

| Task | Description |
|---|---|
| React Three Fiber | 3D rendering setup |
| DevicePreview | Laptop/phone 3D models |
| StatusOrb | Rotating wireframe indicators |
| ParticleBackground | Ambient animated particles |
| PostProcessing | Bloom, vignette, grain effects |

### Phase 9: Accounting Module (Week 13-17)

| Task | Description |
|---|---|
| Chart of Accounts | GL account tree |
| Journal Entries | Double-entry accounting |
| P&L Report | Income statement |
| Balance Sheet | Assets, liabilities, equity |
| QuickBooks/Xero Integration | OAuth2 sync |

### Phase 10: Advanced Reporting (Week 18-21)

| Task | Description |
|---|---|
| Revenue Analytics | Trends, seasonal patterns |
| Repair Analytics | Common issues, avg duration |
| Customer Analytics | CLV, repeat rate |
| Warranty Analytics | Claim rates, cost analysis |
| Scheduled Reports | Automated email reports |

### Phase 11: AI Assistant (Week 22-25)

| Task | Description |
|---|---|
| Gemini + OpenRouter | Dual provider with fallback |
| Intent Prediction | LSTM-based user behavior |
| Adaptive Layout | Dynamic UI based on usage |
| AI Message Composer | Draft WhatsApp/email messages |
| Cost Estimation | AI-powered repair estimates |

### Phase 12: Communications (Week 26-29)

| Task | Description |
|---|---|
| WhatsApp Integration | Fonnte API |
| Email Integration | SMTP via lettre |
| SMS Integration | SMS API (TBD) |
| Two-Way Messaging | Receive and process replies |
| Marketing Campaigns | Bulk messaging with photos |

### Phase 13: Document Management (Week 30-32)

| Task | Description |
|---|---|
| Document Templates | Customizable quotation/invoice |
| E-Signatures | Canvas-based capture |
| Versioning | Track document changes |
| Full-Text Search | FTS5 across documents |
| Letterhead Customization | Upload logo, configure colors |

### Phase 14: Cloud Sync & Polish (Week 33-37)

| Task | Description |
|---|---|
| Google Cloud SQL | PostgreSQL cloud database |
| Real-Time Sync | WebSocket bidirectional |
| Cloud Backup | Automatic daily backups |
| Multi-Device Access | Multiple PCs share data |
| QR Codes | Instant repair lookup |
| Command Palette | Ctrl+K quick actions |
| Performance Pass | <250KB gzipped bundle |
| Accessibility Audit | WCAG AA compliance |

---

**Total Duration: 37 weeks (~9 months)**

| Category | Weeks | Percentage |
|---|---|---|
| UI/UX Foundation | 2 | 5% |
| CRM | 4 | 11% |
| Security | 3 | 8% |
| 3D Integration | 3 | 8% |
| Accounting | 5 | 14% |
| Reporting | 4 | 11% |
| AI Assistant | 4 | 11% |
| Communications | 4 | 11% |
| Documents | 3 | 8% |
| Cloud & Polish | 5 | 14% |

---

## 2. Current System Assessment

### What Exists (Phase 1-4 Complete)

**Frontend (34 files, ~177KB):**
- 10 screens: Dashboard, NewRepairStep1/2, RepairDetail, RepairsList, QuotationBuilder, InvoiceBuilder, Settings, Reports, WarrantySearch
- 16 components: Button, Input, Card, Modal, DataTable, StatusBadge, etc.
- State: Zustand (app store + toast store)
- Types: Full TypeScript interfaces for all entities

**Backend (19 files, ~229KB):**
- 47 Rust commands across 15 modules
- 13 SQLite tables
- PDF generation via printpdf (intake, quotation, invoice)
- WhatsApp via Fonnte API
- AI via OpenRouter (free model)
- Email via lettre (SMTP)

**Database (13 tables):**
- customers, repairs, repair_condition, repair_history, technicians
- shop_settings, quotations, quotation_items, payments
- photos, notifications, warranties, field_audit_log

### What Needs to Change

| Area | Current State | Target State |
|---|---|---|
| Customer Model | Individual/Business types, simple fields | Business-primary with contact persons, company profiles, communication logs |
| Database | Local SQLite only | SQLite local + Google Cloud SQL sync |
| AI | OpenRouter only | Gemini (primary) + OpenRouter (fallback) |
| Authentication | None | PIN/Password + role-based access |
| Accounting | None | Full accounting module |
| Communications | WhatsApp only | WhatsApp + Email + SMS + Two-Way |
| Documents | Basic PDF generation | Templates, e-signatures, versioning, search |
| Reporting | Basic reports | Advanced analytics with charts and scheduled emails |
| Multi-Device | Not supported | Real-time sync across devices |

---

## 3. Target Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SaraaTEK Desktop App                            │
│                         (Tauri 2 + React 19)                            │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    UI LAYER (Liquid Glass)                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │   │
│  │  │ Dashboard │ │ Repairs  │ │  CRM     │ │Reports   │          │   │
│  │  │ (3D BG)  │ │ Workflow │ │ Profiles │ │ Analytics│          │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │   │
│  │       │            │            │            │                  │   │
│  │  ┌────▼────────────▼────────────▼────────────▼─────┐           │   │
│  │  │              Zustand State Manager               │           │   │
│  │  └────────────────────┬────────────────────────────┘           │   │
│  │                       │                                         │   │
│  │  ┌────────────────────▼────────────────────────────┐           │   │
│  │  │           Tauri IPC Layer (Rust Backend)         │           │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐        │           │   │
│  │  │  │ Commands │ │ PDF Gen  │ │ AI Client │        │           │   │
│  │  │  │ (114+)   │ │ (printpdf)│ │ (Gemini) │        │           │   │
│  │  │  └────┬─────┘ └────┬─────┘ └────┬─────┘        │           │   │
│  │  │       │            │            │               │           │   │
│  │  │  ┌────▼────────────▼────────────▼─────┐        │           │   │
│  │  │  │        Database Layer              │        │           │   │
│  │  │  │  ┌────────────┐ ┌────────────┐    │        │           │   │
│  │  │  │  │ Local SQLite│ │ Cloud Sync │    │        │           │   │
│  │  │  │  │ (offline)   │ │ (realtime) │    │        │           │   │
│  │  │  │  └──────┬─────┘ └──────┬─────┘    │        │           │   │
│  │  │  │         │              │           │        │           │   │
│  │  │  │  ┌──────▼──────────────▼─────┐    │        │           │   │
│  │  │  │  │     Google Cloud SQL      │    │        │           │   │
│  │  │  │  │     (primary storage)     │    │        │           │   │
│  │  │  │  └───────────────────────────┘    │        │           │   │
│  │  │  └───────────────────────────────────┘        │           │   │
│  │  └───────────────────────────────────────────────┘           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    3D & EFFECTS LAYER                           │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │   │
│  │  │ React      │ │ Post-      │ │ Framer     │ │ GSAP       │  │   │
│  │  │ Three      │ │ Processing │ │ Motion     │ │ Animations │  │   │
│  │  │ Fiber      │ │ (Bloom,    │ │ (Springs,  │ │ (Timeline) │  │   │
│  │  │ (3D)       │ │ Vignette)  │ │ Stagger)   │ │            │  │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
    ┌─────────▼──┐  ┌──────▼──────┐  ┌──▼─────────┐
    │ Gemini API │  │ Fonnte API  │  │ SMTP Server│
    │ (AI)       │  │ (WhatsApp)  │  │ (Email)    │
    └────────────┘  └─────────────┘  └────────────┘
```

### Component Breakdown

| Layer | Technology | Purpose |
|---|---|---|
| Desktop Shell | Tauri 2 (Rust) | Native window, system integration, file access |
| Frontend | React 19 + TypeScript + Tailwind CSS v4 | UI rendering, state management |
| State | Zustand | Client-side state, navigation, UI state |
| UI Primitives | shadcn/ui + Radix UI | Accessible, headless components |
| Animation | Framer Motion + GSAP + Lenis | Physics-based motion, smooth scroll |
| 3D Graphics | Three.js + React Three Fiber + Drei | Device previews, status orbs, particles |
| Post-Processing | React Three Postprocessing | Bloom, chromatic aberration, vignette |
| Charts | Recharts + D3.js | Data visualization |
| IPC | Tauri invoke() | Frontend ↔ Backend communication |
| Backend | Rust (2021 edition) | Business logic, data access, PDF generation |
| Local DB | SQLite (rusqlite) | Offline-first data storage |
| Cloud DB | Google Cloud SQL (PostgreSQL) | Multi-device sync, cloud backup |
| Sync Engine | WebSocket + custom protocol | Real-time bidirectional sync |
| AI | Gemini API (primary) + OpenRouter (fallback) | AI assistant, intent prediction, adaptive layout |
| WhatsApp | Fonnte API | Customer messaging |
| Email | SMTP via lettre | Email notifications, marketing |
| SMS | SMS API (TBD) | SMS notifications |
| PDF | printpdf crate | Document generation |
| E-Signature | Canvas-based signature capture | Customer sign-off |
| Fonts | Inter + JetBrains Mono + Space Grotesk | Typography system |

---

## 4. UI/UX Design System

### Design Philosophy: Apple Liquid Glass + Volumetric UX

SaraaTEK uses Apple's Liquid Glass design language — the most premium visual system in 2026. Every surface has depth, refraction, and specular highlights.

### 4-Layer Glass Architecture

```css
/* Layer 1: Glass Base */
.liquid-glass {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px) saturate(180%);
}

/* Layer 2: Rim Highlights (inset shadows) */
.liquid-glass::before {
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.55),  /* top specular */
    inset 0 -1px 1px rgba(255, 255, 255, 0.30),  /* bottom reflection */
    inset 1px 0 1px rgba(255, 255, 255, 0.20),   /* left edge */
    inset -1px 0 1px rgba(255, 255, 255, 0.20);  /* right edge */
}

/* Layer 3: Specular Sheen (gradient overlay) */
.liquid-glass::after {
  background: linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.08) 28%, transparent 58%);
  mix-blend-mode: screen;
}

/* Layer 4: SVG Refraction (background warping) */
/* Uses feTurbulence + feDisplacementMap filter */
```

### Glass Thickness Scale

| Level | Blur | Opacity | Use Case |
|---|---|---|---|
| thin | 8px | 4% | Badges, tooltips |
| regular | 16px | 6% | Cards, inputs |
| thick | 24px | 8% | Elevated panels |
| heavy | 32px | 10% | Modals, dialogs |
| max | 48px | 12% | Command palette |

### 3D Integration

- **Device Preview** — Floating 3D model of device being repaired (React Three Fiber)
- **Status Orbs** — Rotating wireframe 3D indicators for repair status
- **Particle Background** — Ambient animated particles behind dashboard
- **Post-Processing** — Bloom, chromatic aberration, vignette, film grain

### Motion System

| Element | Duration | Easing | Effect |
|---|---|---|---|
| Button magnetic | 150ms | spring(400, 15) | Cursor attraction |
| Card parallax | 200ms | spring(300, 30) | 3D tilt on hover |
| List stagger | 50ms/item | spring(300, 24) | Sequential entrance |
| Page transition | 250ms | [0.16, 1, 0.3, 1] | Blur + fade |
| Number ticker | 1000ms | ease-out-cubic | Counting animation |
| Modal enter | 300ms | spring(400, 25) | Scale + blur |

### Color System (OKLCH)

```css
:root {
  --surface-0: oklch(6% 0.012 260);   /* #09090B */
  --surface-1: oklch(9% 0.012 260);   /* #0F0F12 */
  --surface-2: oklch(12% 0.012 260);  /* #141416 */
  --text-1: oklch(95% 0.005 260);     /* primary */
  --text-2: oklch(72% 0.01 260);      /* secondary */
  --accent: oklch(68% 0.18 280);      /* purple */
  --accent-glow: oklch(68% 0.18 280 / 0.25);
}
```

### Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Display | Space Grotesk | 600-700 | 24-48px |
| Body | Inter | 400-500 | 13-15px |
| Data | JetBrains Mono | 400-500 | 12-14px |

### Dependencies

```bash
# Core UI
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select

# Animation
npm install framer-motion gsap lenis

# 3D
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing postprocessing

# Charts
npm install recharts

# Fonts
npm install @fontsource/inter @fontsource/jetbrains-mono @fontsource/space-grotesk
```

---

## 5. Phase Breakdown

### Phase 5 — Customer CRM & Company Profiles

**Goal:** Transform customer management from simple records to full company profiles with contact persons, timelines, and communication logs.

**Estimated Duration:** 3-4 weeks

#### 5.1 Database Changes

```sql
-- Enhanced companies table (replaces simple customers)
CREATE TABLE companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT,
    address TEXT,
    tax_id TEXT,                    -- Company tax registration
    registration_number TEXT,       -- Business registration
    website TEXT,
    industry TEXT,                  -- e.g., "IT", "Education", "Government"
    notes TEXT,                     -- Internal notes
    tags TEXT,                      -- JSON array: ["VIP", "Corporate"]
    credit_terms TEXT,              -- e.g., "Net 30"
    credit_limit REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Contact persons per company
CREATE TABLE contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    position TEXT,                  -- Job title
    phone TEXT NOT NULL,
    email TEXT,
    is_primary INTEGER DEFAULT 0,   -- Primary contact flag
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contacts_company_id ON contacts(company_id);

-- Communication log
CREATE TABLE communications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    contact_id INTEGER REFERENCES contacts(id),
    repair_id TEXT REFERENCES repairs(id),
    channel TEXT NOT NULL CHECK(channel IN ('whatsapp','email','sms','phone','in_person')),
    direction TEXT NOT NULL CHECK(direction IN ('inbound','outbound')),
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT CHECK(status IN ('sent','delivered','read','failed')),
    sent_by TEXT,                   -- Staff member name
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_communications_company_id ON communications(company_id);
CREATE INDEX idx_communications_repair_id ON communications(repair_id);

-- Update repairs table to reference companies instead of customers
ALTER TABLE repairs ADD COLUMN company_id INTEGER REFERENCES companies(id);
ALTER TABLE repairs ADD COLUMN contact_id INTEGER REFERENCES contacts(id);
```

#### 5.2 New Screens

1. **Company List Screen** — Searchable table with filters (industry, tags, credit terms)
2. **Company Profile Screen** — Tabs: Overview, Contacts, Devices, Repairs, Invoices, Warranty Claims, Timeline, Communications
3. **Contact Management** — Add/edit contacts per company
4. **Communication Log View** — Filterable by channel, date, direction
5. **Customer Timeline** — Chronological view of all interactions

#### 5.3 Updated Screens

- **NewRepairStep1** — Company lookup by phone/name, select contact person
- **RepairDetail** — Show company profile link, contact person, communication history
- **Dashboard** — Company-specific metrics

#### 5.4 Rust Commands (8 new)

| Command | Description |
|---|---|
| `create_company` | Create new company profile |
| `update_company` | Update company details |
| `list_companies` | List with filters (industry, tags, search) |
| `get_company` | Full company profile with contacts |
| `create_contact` | Add contact to company |
| `update_contact` | Update contact details |
| `list_contacts` | List contacts for a company |
| `log_communication` | Record communication event |
| `get_communications` | Get communication history for company/repair |

---

### Phase 6 — Enhanced Security & Authentication

**Goal:** Add user authentication, role-based access control, and enhanced audit trail.

**Estimated Duration:** 2-3 weeks

#### 6.1 Database Changes

```sql
-- User accounts
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,     -- bcrypt hash
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'technician' CHECK(role IN ('admin','manager','technician','front_desk')),
    pin TEXT,                        -- Quick PIN login for shop
    is_active INTEGER DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Session management
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced audit trail
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,            -- 'create', 'update', 'delete', 'view'
    entity_type TEXT NOT NULL,       -- 'repair', 'company', 'invoice', etc.
    entity_id TEXT NOT NULL,
    field_name TEXT,
    old_value TEXT,
    new_value TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
```

#### 6.2 New Screens

1. **Login Screen** — PIN or username/password
2. **User Management Screen** — Admin only: create/edit/deactivate users
3. **Role Configuration** — Define permissions per role
4. **Audit Log Viewer** — Filterable by user, action, entity, date

#### 6.3 Rust Commands (6 new)

| Command | Description |
|---|---|
| `login` | Authenticate user, create session |
| `logout` | Destroy session |
| `create_user` | Create new user account |
| `update_user` | Update user details |
| `list_users` | List all users (admin only) |
| `get_audit_log` | Query audit log with filters |

#### 6.4 Security Features

- bcrypt password hashing
- Session tokens with expiry
- Role-based permission checks on all commands
- Comprehensive audit logging
- Auto-logout after inactivity

---

### Phase 7 — Accounting & Finance Module

**Goal:** Add basic accounting capabilities including Chart of Accounts, P&L, Balance Sheet, and QuickBooks/Xero integration.

**Estimated Duration:** 4-5 weeks

#### 7.1 Database Changes

```sql
-- Chart of Accounts
CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,       -- e.g., "1000", "2000"
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('asset','liability','equity','revenue','expense')),
    parent_id INTEGER REFERENCES accounts(id),
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Journal entries
CREATE TABLE journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_date DATE NOT NULL,
    description TEXT NOT NULL,
    reference TEXT,                  -- Repair ID, Invoice #, etc.
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Journal entry lines (double-entry)
CREATE TABLE journal_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER NOT NULL REFERENCES journal_entries(id),
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    debit REAL DEFAULT 0,
    credit REAL DEFAULT 0,
    description TEXT
);

CREATE INDEX idx_journal_lines_entry ON journal_lines(entry_id);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);

-- Payment methods configuration
CREATE TABLE payment_methods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,              -- "Cash", "Bank Transfer", "Credit Card", "E-Wallet"
    is_active INTEGER DEFAULT 1,
    account_id INTEGER REFERENCES accounts(id)  -- Linked GL account
);

-- Late payment tracking
CREATE TABLE payment_terms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    term_days INTEGER NOT NULL,      -- e.g., 30 for Net 30
    discount_days INTEGER,           -- Early payment discount window
    discount_percent REAL,           -- Discount percentage
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 7.2 New Screens

1. **Chart of Accounts Screen** — Tree view of all accounts
2. **Journal Entry Screen** — Create/edit double-entry journal entries
3. **P&L Report Screen** — Income statement with drill-down
4. **Balance Sheet Screen** — Assets, liabilities, equity
5. **Accounts Receivable** — Outstanding invoices by company
6. **Accounts Payable** — What's owed to suppliers
7. **Payment Terms Config** — Set terms per company
8. **QuickBooks/Xero Integration Settings** — API credentials and sync config

#### 7.3 Rust Commands (10 new)

| Command | Description |
|---|---|
| `create_account` | Create GL account |
| `list_accounts` | List all accounts (tree structure) |
| `create_journal_entry` | Create double-entry journal |
| `get_journal_entries` | Query entries with filters |
| `get_profit_loss` | Generate P&L statement |
| `get_balance_sheet` | Generate balance sheet |
| `get_accounts_receivable` | Outstanding invoices |
| `get_accounts_payable` | Outstanding bills |
| `sync_quickbooks` | Sync data with QuickBooks |
| `sync_xero` | Sync data with Xero |

#### 7.4 Integration Logic

- **QuickBooks:** OAuth2 + REST API for invoices, payments, accounts
- **Xero:** OAuth2 + REST API for invoices, contacts, accounts
- **Sync Strategy:** Bidirectional sync on-demand or scheduled
- **Data Mapping:** Map SaraaTEK entities to QuickBooks/Xero entities

---

### Phase 8 — Advanced Reporting & Analytics

**Goal:** Add revenue, repair, customer, and warranty analytics with data visualization, profit margin analysis, scheduled report emails, and comparative analysis.

**Estimated Duration:** 3-4 weeks

#### 8.1 Database Changes

```sql
-- Scheduled reports
CREATE TABLE scheduled_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_type TEXT NOT NULL,       -- 'revenue', 'repair', 'customer', etc.
    frequency TEXT NOT NULL CHECK(frequency IN ('daily','weekly','monthly','quarterly')),
    recipients TEXT NOT NULL,        -- JSON array of email addresses
    last_sent DATETIME,
    next_send DATETIME,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Report snapshots (for historical comparison)
CREATE TABLE report_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_type TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    data TEXT NOT NULL,              -- JSON blob of report data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_report_snapshots_type ON report_snapshots(report_type, period_start);
```

#### 8.2 New Screens

1. **Revenue Analytics Dashboard** — Line charts, bar charts, seasonal trends
2. **Repair Analytics Dashboard** — Most common repairs, avg duration, completion rates
3. **Customer Analytics Dashboard** — CLV, repeat rate, churn risk indicators
4. **Warranty Analytics Dashboard** — Claim rates, common issues, cost analysis
5. **Profit Margin Analysis** — Per-repair, per-part, per-technician margins
6. **Comparative Analysis** — Period vs period (this month vs last, this year vs last)
7. **Report Builder** — Custom report creation with drag-and-drop
8. **Scheduled Reports Config** — Set up automated report emails
9. **Data Visualization Gallery** — All charts (bar, line, pie, heatmap, scatter)

#### 8.3 Rust Commands (8 new)

| Command | Description |
|---|---|
| `get_revenue_analytics` | Revenue trends, seasonal patterns |
| `get_repair_analytics` | Repair metrics, common issues |
| `get_customer_analytics` | CLV, repeat rate, segmentation |
| `get_warranty_analytics` | Claim rates, cost analysis |
| `get_profit_margins` | Margin analysis by repair/part/tech |
| `compare_periods` | Side-by-side period comparison |
| `schedule_report` | Create/update scheduled report |
| `generate_scheduled_reports` | Cron job to send scheduled reports |

#### 8.4 Data Visualization

- **Charts:** Bar, Line, Pie, Donut, Heatmap, Scatter, Area
- **Libraries:** Use lightweight charting (e.g., recharts, or custom SVG)
- **Export:** All charts exportable as PNG/SVG
- **Interactive:** Hover tooltips, click-to-drill-down

---

### Phase 9 — AI Assistant (Gemini + OpenRouter)

**Goal:** Build a 5-level AI assistant with Gemini as primary provider and OpenRouter as fallback.

**Estimated Duration:** 3-4 weeks

#### 9.1 Architecture

```
┌─────────────────────────────────────────────┐
│           AI Assistant (Floating Panel)       │
│  ┌─────────────────────────────────────┐    │
│  │  Chat Interface                      │    │
│  │  - Message input                     │    │
│  │  - Response display                  │    │
│  │  - Action buttons                    │    │
│  └──────────────┬──────────────────────┘    │
│                 │                            │
│  ┌──────────────▼──────────────────────┐    │
│  │  AI Router                           │    │
│  │  - Check Gemini availability         │    │
│  │  - Fallback to OpenRouter             │    │
│  │  - Rate limit handling               │    │
│  └──────────────┬──────────────────────┘    │
│                 │                            │
│  ┌──────────────▼──────────────────────┐    │
│  │  Context Builder                      │    │
│  │  - Current repair data                │    │
│  │  - Customer history                   │    │
│  │  - Business metrics                   │    │
│  │  - System knowledge base              │    │
│  └──────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

#### 9.2 AI Levels

**Level 1 — Database Assistant:**
- Natural language → SQL query
- "Show all HP laptop repairs this month"
- "Find company by phone 0771234567"
- "How many repairs are awaiting approval?"

**Level 2 — Business Analysis:**
- "What is the most common repair this month?"
- "Which technician completed the most repairs?"
- "What brand generates the most revenue?"
- "What's our average repair turnaround time?"

**Level 3 — Communication Assistant:**
- Generate WhatsApp messages
- Draft repair summaries
- Create collection notices
- Write quotation explanations
- All messages require human review

**Level 4 — Business Intelligence:**
- "How is the business performing?"
- Revenue trends analysis
- Repair volume trends
- Technician performance insights
- Customer growth patterns
- Warranty claim patterns

**Level 5 — Software Knowledge:**
- "How do I reopen a warranty claim?"
- "How do I generate an invoice?"
- "Why is this repair blocked?"
- "How do I send a WhatsApp notification?"

**Level 6 — Predictive Analytics (NEW):**
- Revenue forecasting
- Repair demand prediction
- Seasonal trend prediction
- Customer churn prediction

**Level 7 — Anomaly Detection (NEW):**
- Unusual cost patterns
- Slow repair detection
- Unusual customer behavior
- Revenue anomalies

**Level 8 — Smart Suggestions (NEW):**
- Next action recommendations
- Pricing suggestions based on history
- Part reorder suggestions
- Technician assignment optimization

**Level 9 — AI Cost Estimation (NEW):**
- Estimate repair cost based on similar past repairs
- Factor in parts cost, labor time, complexity
- Confidence score on estimate

#### 9.3 Database Changes

```sql
-- AI configuration
INSERT OR IGNORE INTO shop_settings (key, value) VALUES
    ('gemini_api_key', ''),
    ('gemini_model', 'gemini-2.0-flash'),
    ('ai_primary_provider', 'gemini'),
    ('ai_fallback_provider', 'openrouter');

-- AI conversation history
CREATE TABLE ai_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    repair_id TEXT REFERENCES repairs(id),
    messages TEXT NOT NULL,          -- JSON array of messages
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 9.4 Rust Commands (6 new)

| Command | Description |
|---|---|
| `ai_chat` | Main AI chat endpoint with provider routing |
| `ai_query_database` | Natural language → SQL execution |
| `ai_analyze_business` | Business analysis queries |
| `ai_draft_message` | Communication drafting |
| `ai_predict_revenue` | Revenue forecasting |
| `ai_estimate_cost` | Repair cost estimation |

#### 9.5 Gemini API Integration

```rust
// Gemini API client
struct GeminiClient {
    api_key: String,
    model: String,
}

impl GeminiClient {
    async fn chat(&self, messages: Vec<Message>) -> Result<String> {
        // POST to https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
        // Handle rate limits, retries, fallback to OpenRouter
    }
}
```

---

### Phase 10 — Multi-Channel Communications

**Goal:** Add Email and SMS integration alongside WhatsApp, with two-way messaging and marketing campaigns.

**Estimated Duration:** 3-4 weeks

#### 10.1 Database Changes

```sql
-- Email configuration
INSERT OR IGNORE INTO shop_settings (key, value) VALUES
    ('smtp_host', ''),
    ('smtp_port', '587'),
    ('smtp_username', ''),
    ('smtp_password', ''),
    ('smtp_from_name', 'SaraaTEK'),
    ('smtp_from_email', '');

-- SMS configuration (provider TBD)
INSERT OR IGNORE INTO shop_settings (key, value) VALUES
    ('sms_provider', ''),
    ('sms_api_key', ''),
    ('sms_sender_id', '');

-- Marketing campaigns
CREATE TABLE campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('whatsapp','email','sms','multi')),
    target_audience TEXT NOT NULL,   -- JSON: filters or segment
    message_template TEXT NOT NULL,
    media_urls TEXT,                 -- JSON array of image URLs
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft','scheduled','sent','cancelled')),
    scheduled_at DATETIME,
    sent_at DATETIME,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Campaign sends
CREATE TABLE campaign_sends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
    company_id INTEGER NOT NULL REFERENCES companies(id),
    contact_id INTEGER REFERENCES contacts(id),
    channel TEXT NOT NULL,
    status TEXT CHECK(status IN ('sent','delivered','read','failed','bounced')),
    error_message TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaign_sends_campaign ON campaign_sends(campaign_id);

-- Two-way message handling
CREATE TABLE incoming_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel TEXT NOT NULL CHECK(channel IN ('whatsapp','email','sms')),
    from_address TEXT NOT NULL,
    to_address TEXT,
    message TEXT NOT NULL,
    media_urls TEXT,                 -- JSON array
    matched_company_id INTEGER REFERENCES companies(id),
    matched_repair_id TEXT REFERENCES repairs(id),
    processed INTEGER DEFAULT 0,
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 10.2 New Screens

1. **Communications Hub** — Unified inbox for all channels
2. **Campaign Builder** — Create marketing campaigns with message + images
3. **Campaign History** — Past campaigns with delivery stats
4. **Template Manager** — Create/manage message templates
5. **Two-Way Inbox** — View and reply to incoming messages

#### 10.3 Rust Commands (8 new)

| Command | Description |
|---|---|
| `send_email` | Send email via SMTP |
| `send_sms` | Send SMS via provider API |
| `create_campaign` | Create marketing campaign |
| `send_campaign` | Execute campaign sends |
| `get_campaign_stats` | Campaign delivery statistics |
| `get_incoming_messages` | Fetch incoming messages |
| `match_incoming_message` | Match incoming to company/repair |
| `send_bulk_notification` | Send to multiple recipients |

#### 10.4 Marketing Campaigns with Photos

- Upload images to campaign
- Image compression and optimization
- WhatsApp: Media message via Fonnte
- Email: Embedded images via SMTP
- SMS: Short URL links to images

---

### Phase 11 — Document Management System

**Goal:** Add document templates, e-signatures, versioning, search, and letterhead customization.

**Estimated Duration:** 2-3 weeks

#### 11.1 Database Changes

```sql
-- Document templates
CREATE TABLE document_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('quotation','invoice','receipt','intake','custom')),
    content TEXT NOT NULL,           -- HTML/template content
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Document versions
CREATE TABLE document_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_type TEXT NOT NULL,     -- 'quotation', 'invoice', etc.
    entity_id TEXT NOT NULL,         -- repair_id or quotation_id
    version INTEGER NOT NULL,
    content TEXT NOT NULL,           -- PDF content or template data
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_document_versions_entity ON document_versions(document_type, entity_id);

-- E-signatures
CREATE TABLE signatures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repair_id TEXT NOT NULL REFERENCES repairs(id),
    signer_name TEXT NOT NULL,
    signer_type TEXT NOT NULL CHECK(signer_type IN ('customer','technician','manager')),
    signature_data TEXT NOT NULL,    -- Base64 PNG or SVG path
    signed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Document search index (FTS5)
CREATE VIRTUAL TABLE document_search USING fts5(
    document_type,
    entity_id,
    content,
    created_at
);
```

#### 11.2 New Screens

1. **Template Editor** — WYSIWYG template creation/editing
2. **Signature Capture Modal** — Canvas-based signature pad
3. **Document Version History** — View/restore previous versions
4. **Document Search** — Full-text search across all documents
5. **Letterhead Settings** — Upload logo, set header/footer, configure colors

#### 11.3 Rust Commands (6 new)

| Command | Description |
|---|---|
| `save_template` | Create/update document template |
| `get_templates` | List templates by type |
| `save_signature` | Store e-signature |
| `get_signatures` | Get signatures for repair |
| `get_document_versions` | List versions of a document |
| `search_documents` | Full-text search across documents |

---

### Phase 12 — Cloud Sync & Multi-Device

**Goal:** Migrate from local SQLite to Google Cloud SQL with real-time sync and multi-device access.

**Estimated Duration:** 4-5 weeks

#### 12.1 Architecture

```
┌─────────────────┐    ┌─────────────────┐
│  Desktop App 1  │    │  Desktop App 2  │
│  (Local SQLite) │    │  (Local SQLite) │
└────────┬────────┘    └────────┬────────┘
         │                      │
         │    WebSocket/HTTPS    │
         │                      │
    ┌────▼──────────────────────▼────┐
    │         Sync Engine            │
    │  - Conflict resolution         │
    │  - Delta sync                  │
    │  - Offline queue               │
    └───────────────┬────────────────┘
                    │
    ┌───────────────▼────────────────┐
    │      Google Cloud SQL          │
    │      (PostgreSQL)              │
    │  - Primary data store          │
    │  - Real-time replication       │
    │  - Automatic backups           │
    └────────────────────────────────┘
```

#### 12.2 Sync Strategy

- **Local-First:** App works fully offline with local SQLite
- **Delta Sync:** Only changed records are synced
- **Conflict Resolution:** Last-write-wins with timestamp comparison
- **Real-Time:** WebSocket notifications when data changes
- **Backup:** Automatic daily cloud backups

#### 12.3 Database Changes

```sql
-- Sync metadata (local)
CREATE TABLE sync_metadata (
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    last_modified DATETIME NOT NULL,
    synced INTEGER DEFAULT 0,
    operation TEXT CHECK(operation IN ('insert','update','delete')),
    PRIMARY KEY (table_name, record_id)
);

-- Sync state
CREATE TABLE sync_state (
    id INTEGER PRIMARY KEY,
    last_sync DATETIME,
    sync_status TEXT CHECK(status IN ('synced','syncing','offline','error')),
    device_id TEXT NOT NULL
);
```

#### 12.4 Rust Commands (4 new)

| Command | Description |
|---|---|
| `sync_to_cloud` | Push local changes to cloud |
| `sync_from_cloud` | Pull cloud changes to local |
| `get_sync_status` | Check sync status |
| `force_full_sync` | Full resync (conflict resolution) |

#### 12.5 Google Cloud SQL Setup

- **Instance:** Cloud SQL for PostgreSQL
- **Connection:** SSL/TLS encrypted
- **Authentication:** Service account key
- **Backup:** Daily automated backups
- **Scaling:** Start with db-f1-micro, scale as needed

---

### Phase 13 — Advanced Features & Polish

**Goal:** Add remaining advanced features and polish the overall experience.

**Estimated Duration:** 3-4 weeks

#### 13.1 Features

- **QR Code Generation** — Every repair gets a QR code for instant lookup
- **Repair Labels** — Printable labels for devices
- **Duplicate Detection** — Warn on same serial number, same customer open repair
- **Multi-Currency Support** — Handle different currencies
- **Tax Configuration** — Configurable tax rates
- **Discount System** — Per-repair or per-customer discounts
- **Appointment Scheduling** — Customers book repair appointments
- **Queue Management** — Walk-in queue tracking
- **Data Export** — Export to Excel, CSV, PDF
- **Keyboard Shortcuts** — Power user shortcuts for all actions
- **Command Palette** — Ctrl+K quick actions

#### 13.2 UI/UX Improvements

- **Kanban Board** — Visual repair workflow board
- **Dark/Light Theme Toggle** — User preference
- **Responsive Design** — Better window resizing
- **Loading States** — Skeleton loaders for all screens
- **Empty States** — Helpful empty state messages
- **Toast Notifications** — Better notification system
- **Error Handling** — Graceful error recovery

---

## 5. Database Evolution

### Current Schema (13 tables)

| Table | Records | Status |
|---|---|---|
| customers | — | Will be replaced by `companies` + `contacts` |
| repairs | — | Add `company_id`, `contact_id` |
| repair_condition | — | No changes |
| repair_history | — | Add `user_id` for attribution |
| technicians | — | Add `hourly_rate`, `specialties` |
| shop_settings | — | Add 20+ new keys |
| quotations | — | No changes |
| quotation_items | — | No changes |
| payments | — | Add `payment_method_id` |
| photos | — | No changes |
| notifications | — | Add `channel` column |
| warranties | — | No changes |
| field_audit_log | — | Enhanced with `user_id` |

### New Tables (20+ new)

| Table | Phase | Purpose |
|---|---|---|
| companies | 5 | Company profiles |
| contacts | 5 | Contact persons per company |
| communications | 5 | Communication log |
| users | 6 | User accounts |
| sessions | 6 | Auth sessions |
| audit_log | 6 | Enhanced audit trail |
| accounts | 7 | Chart of Accounts |
| journal_entries | 7 | Double-entry journal |
| journal_lines | 7 | Journal line items |
| payment_methods | 7 | Payment method config |
| payment_terms | 7 | Company payment terms |
| scheduled_reports | 8 | Automated reports |
| report_snapshots | 8 | Historical report data |
| ai_conversations | 9 | AI chat history |
| campaigns | 10 | Marketing campaigns |
| campaign_sends | 10 | Campaign delivery tracking |
| incoming_messages | 10 | Two-way message handling |
| document_templates | 11 | Document templates |
| document_versions | 11 | Document version history |
| signatures | 11 | E-signatures |
| sync_metadata | 12 | Sync tracking |
| sync_state | 12 | Sync state |

### Total Database Tables: 35+ (from 13)

---

## 6. Screen & Component Inventory

### New Screens (30+ new)

| Screen | Phase | Purpose |
|---|---|---|
| Company List | 5 | Browse/search companies |
| Company Profile | 5 | Full company view with tabs |
| Contact Manager | 5 | Manage contacts per company |
| Communication Log | 5 | View communication history |
| Customer Timeline | 5 | Chronological interaction view |
| Login | 6 | Authentication |
| User Management | 6 | Admin user CRUD |
| Role Configuration | 6 | Permission management |
| Audit Log Viewer | 6 | Audit trail browser |
| Chart of Accounts | 7 | GL account tree |
| Journal Entry | 7 | Create/edit journal entries |
| P&L Report | 7 | Income statement |
| Balance Sheet | 7 | Financial position |
| Accounts Receivable | 7 | Outstanding invoices |
| Accounts Payable | 7 | Outstanding bills |
| Revenue Analytics | 8 | Revenue dashboards |
| Repair Analytics | 8 | Repair metrics |
| Customer Analytics | 8 | Customer insights |
| Warranty Analytics | 8 | Warranty metrics |
| Profit Margin Analysis | 8 | Margin reports |
| Comparative Analysis | 8 | Period comparison |
| Scheduled Reports | 8 | Report automation |
| AI Assistant Panel | 9 | Floating AI chat |
| Communications Hub | 10 | Unified inbox |
| Campaign Builder | 10 | Marketing campaigns |
| Campaign History | 10 | Campaign stats |
| Template Editor | 11 | Document templates |
| Signature Capture | 11 | E-signature pad |
| Document Search | 11 | Full-text search |
| Sync Settings | 12 | Cloud sync config |
| QR Code Display | 13 | Repair QR codes |
| Appointment Calendar | 13 | Booking system |

### Updated Screens (10+ updated)

| Screen | Changes |
|---|---|
| Dashboard | Company metrics, AI suggestions, real-time data |
| NewRepairStep1 | Company lookup, contact person selection |
| RepairDetail | Company profile link, communication history, e-signature |
| RepairsList | Company filter, enhanced search |
| Settings | Auth, AI config, sync config, templates |
| Reports | Enhanced with new analytics |

### New Components (20+ new)

| Component | Purpose |
|---|---|
| AIChatPanel | Floating AI assistant |
| CompanyCard | Company summary card |
| ContactCard | Contact person card |
| CommunicationBubble | Chat-style message display |
| TimelineView | Chronological timeline |
| ChartWrapper | Reusable chart component |
| SignaturePad | Canvas signature capture |
| QRCodeGenerator | QR code display |
| CampaignBuilder | Marketing campaign form |
| TemplateEditor | Document template editor |
| DocumentPreview | PDF/document preview |
| SearchBar | Enhanced search with filters |
| LoadingSkeleton | Skeleton loader |
| EmptyState | Helpful empty states |
| ConfirmDialog | Confirmation modal |
| FileUploader | Drag-and-drop file upload |
| DatePicker | Date range picker |
| SelectMulti | Multi-select dropdown |
| TagInput | Tag/label input |
| ColorPicker | Status color picker |

---

## 7. API Layer Design

### Tauri Commands (100+ total)

| Phase | New Commands | Cumulative |
|---|---|---|
| Phase 1-4 (existing) | 47 | 47 |
| Phase 5 (CRM) | 9 | 56 |
| Phase 6 (Security) | 6 | 62 |
| Phase 7 (Accounting) | 10 | 72 |
| Phase 8 (Reporting) | 8 | 80 |
| Phase 9 (AI) | 6 | 86 |
| Phase 10 (Communications) | 8 | 94 |
| Phase 11 (Documents) | 6 | 100 |
| Phase 12 (Cloud Sync) | 4 | 104 |
| Phase 13 (Polish) | 10+ | 114+ |

### Frontend API Layer

```typescript
// api.ts namespace expansion
export const api = {
  // Existing
  customers: { ... },
  repairs: { ... },
  quotations: { ... },
  payments: { ... },
  photos: { ... },
  notifications: { ... },
  warranties: { ... },
  audit: { ... },
  reports: { ... },
  ai: { ... },
  settings: { ... },
  technicians: { ... },

  // New
  companies: {
    create, update, list, get, delete
  },
  contacts: {
    create, update, list, delete
  },
  communications: {
    log, list, getHistory
  },
  auth: {
    login, logout, getCurrentUser
  },
  users: {
    create, update, list, deactivate
  },
  accounting: {
    createAccount, listAccounts, createJournalEntry,
    getProfitLoss, getBalanceSheet, getAR, getAP
  },
  campaigns: {
    create, send, getStats, list
  },
  documents: {
    saveTemplate, getTemplates, saveSignature,
    getSignatures, search, getVersions
  },
  sync: {
    push, pull, getStatus, forceSync
  }
}
```

---

## 8. Integration Points

### External APIs

| Service | Purpose | Auth Method |
|---|---|---|
| Gemini API | AI assistant | API Key |
| OpenRouter | AI fallback | API Key |
| Fonnte | WhatsApp | API Token |
| Google Cloud SQL | Cloud database | Service Account |
| QuickBooks API | Accounting sync | OAuth2 |
| Xero API | Accounting sync | OAuth2 |
| SMTP Server | Email sending | Username/Password |
| SMS Provider | SMS sending | API Key |

### Internal Integrations

- **PDF Generation:** Reuse printpdf for all document types
- **Photo Storage:** Filesystem + cloud backup
- **Audit Trail:** Hook into all write operations
- **AI Context:** Pull data from all modules for AI responses

---

## 9. Testing Strategy

### Testing Levels

| Level | Scope | Tools |
|---|---|---|
| Unit Tests | Individual functions | Rust `#[test]`, Vitest |
| Integration Tests | Command + DB interactions | Rust integration tests |
| E2E Tests | Full user workflows | Playwright |
| Performance Tests | Load/stress testing | k6, Locust |

### Test Coverage Goals

- **Rust Backend:** 80%+ code coverage
- **Frontend:** 70%+ component coverage
- **Database:** All migrations tested
- **API:** All commands have integration tests
- **E2E:** Critical workflows covered

### Test Files to Add

```
src-tauri/src/
├── commands/
│   ├── companies.rs (tests)
│   ├── contacts.rs (tests)
│   ├── accounting.rs (tests)
│   ├── ai_messaging.rs (tests)
│   └── ...
├── tests/
│   ├── integration/
│   │   ├── companies_test.rs
│   │   ├── accounting_test.rs
│   │   └── ...
│   └── e2e/
│       ├── repair_workflow_test.rs
│       └── ...

src/
├── __tests__/
│   ├── components/
│   ├── screens/
│   └── integration/
```

---

## 10. Deployment & Migration

### Local SQLite → Google Cloud SQL Migration

1. **Phase 1:** Setup Google Cloud SQL instance
2. **Phase 2:** Implement sync engine in Rust
3. **Phase 3:** Add sync metadata tracking
4. **Phase 4:** Test with 2 devices
5. **Phase 5:** Migrate existing data
6. **Phase 6:** Full rollout

### Migration Steps

```sql
-- 1. Export local SQLite
sqlite3 saraatek.db .dump > backup.sql

-- 2. Transform for PostgreSQL
-- (data type conversions, syntax adjustments)

-- 3. Import to Cloud SQL
psql -h <instance-ip> -U postgres -d saraatek < backup.sql

-- 4. Update app config
-- Set cloud connection string in shop_settings
```

### Backup Strategy

- **Local:** Daily SQLite backup to user-specified folder
- **Cloud:** Automatic daily Cloud SQL backups
- **Photos:** Sync to Google Cloud Storage
- **PDFs:** Sync to Google Cloud Storage
- **Restore:** One-click restore from any backup

---

## 11. Timeline Estimates

### Phase Summary

| Phase | Name | Duration | Dependencies |
|---|---|---|---|
| 5 | Customer CRM | 3-4 weeks | None |
| 6 | Security & Auth | 2-3 weeks | Phase 5 (user attribution) |
| 7 | Accounting | 4-5 weeks | Phase 5 (company data) |
| 8 | Advanced Reporting | 3-4 weeks | Phases 5-7 (data sources) |
| 9 | AI Assistant | 3-4 weeks | Phase 5 (company data) |
| 10 | Communications | 3-4 weeks | Phase 5 (contacts) |
| 11 | Document Management | 2-3 weeks | Phases 5-7 (documents) |
| 12 | Cloud Sync | 4-5 weeks | All previous phases |
| 13 | Advanced Features | 3-4 weeks | All previous phases |

### Total Estimated Duration

- **Minimum:** 27-36 weeks (6-9 months)
- **With buffer:** 36-48 weeks (9-12 months)

### Recommended Build Order

```
Phase 5 (CRM) ─────────────────────────────────┐
                                                │
Phase 6 (Security) ────────────────────────────┤
                                                │
Phase 7 (Accounting) ──────────────────────────┤
                                                │
Phase 8 (Reporting) ◄──── Phases 5,6,7 ────────┤
Phase 9 (AI) ◄────────── Phase 5 ──────────────┤
Phase 10 (Comms) ◄────── Phase 5 ──────────────┤
                                                │
Phase 11 (Documents) ◄── Phases 5,6,7 ─────────┤
                                                │
Phase 12 (Cloud Sync) ◄─ All phases ───────────┤
Phase 13 (Polish) ◄───── All phases ───────────┘
```

---

## 12. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Cloud SQL latency | High | Medium | Local-first architecture, delta sync |
| Gemini API rate limits | Medium | High | Fallback to OpenRouter, retry logic |
| Data migration errors | High | Low | Extensive testing, rollback plan |
| Security vulnerabilities | High | Medium | Security audit, penetration testing |
| Scope creep | Medium | High | Strict phase boundaries, MVP focus |
| User adoption | Medium | Medium | Intuitive UI, training materials |

---

## 13. Success Metrics

| Metric | Target |
|---|---|
| Rust test coverage | 80%+ |
| Frontend test coverage | 70%+ |
| TypeScript errors | 0 |
| Rust build warnings | 0 |
| Database tables | 35+ |
| Rust commands | 100+ |
| Frontend screens | 30+ |
| Components | 40+ |
| Total source files | 150+ |
| Total code lines | 50,000+ (real, non-generated) |

---

## 14. Appendix

### A. Technology Stack (Final)

| Layer | Technology |
|---|---|
| Desktop | Tauri 2 |
| Frontend | React 19 + TypeScript + Tailwind CSS v4 |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Charts | Custom SVG / Recharts |
| Backend | Rust (2021 edition) |
| Local DB | SQLite (rusqlite) |
| Cloud DB | Google Cloud SQL (PostgreSQL) |
| Sync | WebSocket + custom protocol |
| AI Primary | Gemini API |
| AI Fallback | OpenRouter |
| WhatsApp | Fonnte API |
| Email | SMTP via lettre |
| SMS | TBD (Twilio/Africa's Talking) |
| PDF | printpdf crate |
| Auth | bcrypt + session tokens |
| Backup | Google Cloud Storage |

### B. Database Tables (Complete List)

1. companies
2. contacts
3. communications
4. users
5. sessions
6. audit_log
7. accounts
8. journal_entries
9. journal_lines
10. payment_methods
11. payment_terms
12. repairs
13. repair_condition
14. repair_history
15. technicians
16. shop_settings
17. quotations
18. quotation_items
19. payments
20. photos
21. notifications
22. warranties
23. field_audit_log
24. scheduled_reports
25. report_snapshots
26. ai_conversations
27. campaigns
28. campaign_sends
29. incoming_messages
30. document_templates
31. document_versions
32. signatures
33. sync_metadata
34. sync_state
35. devices (optional, for device history)

### C. Rust Commands (Complete List by Phase)

**Phase 1-4 (Existing): 47 commands**
- customers: 3
- repairs: 8
- quotations: 7
- payments: 2
- photos: 4
- notifications: 2
- warranties: 5
- reports: 4
- ai_messaging: 3
- settings: 2
- technicians: 3
- audit: 1
- email: 2
- pdf: 4

**Phase 5 (CRM): 9 commands**
- companies: 5
- contacts: 3
- communications: 1

**Phase 6 (Security): 6 commands**
- auth: 2
- users: 3
- audit: 1

**Phase 7 (Accounting): 10 commands**
- accounts: 2
- journal: 2
- reports: 2
- accounting: 2
- integrations: 2

**Phase 8 (Reporting): 8 commands**
- analytics: 6
- scheduling: 2

**Phase 9 (AI): 6 commands**
- ai: 6

**Phase 10 (Communications): 8 commands**
- email: 1
- sms: 1
- campaigns: 4
- incoming: 2

**Phase 11 (Documents): 6 commands**
- templates: 2
- signatures: 2
- search: 2

**Phase 12 (Cloud Sync): 4 commands**
- sync: 4

**Phase 13 (Polish): 10+ commands**
- qr: 2
- labels: 1
- appointments: 3
- export: 2
- misc: 2+

**Grand Total: 114+ commands**

### D. File Structure (Final)

```
saraaTEK/
├── src/                              # Frontend (100+ files)
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css                     # Tailwind + Liquid Glass CSS
│   ├── components/
│   │   ├── ui/                       # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── modal.tsx
│   │   │   └── ...
│   │   ├── liquid/                   # Liquid Glass components
│   │   │   ├── LiquidButton.tsx      # Magnetic, spring physics
│   │   │   ├── LiquidCard.tsx        # Parallax, reactive refraction
│   │   │   ├── LiquidInput.tsx       # Floating label, adaptive blur
│   │   │   ├── LiquidModal.tsx       # Enter/exit animations
│   │   │   ├── LiquidMetricCard.tsx  # Ticker, sparkline
│   │   │   ├── LiquidTable.tsx       # Stagger entrance, keyboard nav
│   │   │   ├── LiquidSidebar.tsx     # Tinted glass, collapsible
│   │   │   ├── LiquidToast.tsx       # Variants, auto-dismiss
│   │   │   └── LiquidStatusBadge.tsx # Dot + text
│   │   ├── 3d/                       # 3D components
│   │   │   ├── DevicePreview.tsx     # Laptop/phone 3D model
│   │   │   ├── StatusOrb.tsx         # Rotating wireframe indicator
│   │   │   ├── ParticleBackground.tsx # Ambient particles
│   │   │   └── PostProcessing.tsx    # Bloom, vignette, grain
│   │   ├── layout/                   # Layout components
│   │   ├── business/                 # Business-specific components
│   │   └── ai/                       # AI assistant components
│   │       ├── AIAssistant.tsx       # Floating glass panel
│   │       ├── AIMessageComposer.tsx # Draft messages with AI
│   │       └── IntentPredictor.tsx   # Predict user actions
│   ├── screens/                      # 30+ screens
│   │   ├── dashboard/
│   │   ├── repairs/
│   │   ├── companies/
│   │   ├── accounting/
│   │   ├── reports/
│   │   ├── communications/
│   │   ├── documents/
│   │   ├── settings/
│   │   └── auth/
│   ├── stores/                       # Zustand stores
│   ├── types/                        # TypeScript types
│   ├── lib/                          # Utilities
│   │   ├── api.ts
│   │   ├── phone.ts
│   │   ├── format.ts
│   │   └── validation.ts
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useSync.ts
│   │   ├── useAI.ts
│   │   ├── useMagnetic.ts           # Magnetic button effect
│   │   └── useParallax.ts           # Parallax card tilt
│   └── styles/
│       ├── tokens.css               # OKLCH design tokens
│       ├── liquid-glass.css         # Liquid Glass system
│       ├── animations.css           # Framer Motion presets
│       └── 3d.css                   # 3D component styles
│
├── src-tauri/                        # Rust backend (50+ files)
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── db.rs
│   │   ├── pdf.rs
│   │   ├── sync.rs                   # Cloud sync engine
│   │   ├── auth.rs                   # Authentication
│   │   ├── ai_client.rs              # Gemini/OpenRouter client
│   │   └── commands/                 # 114+ commands
│   │       ├── mod.rs
│   │       ├── companies.rs
│   │       ├── contacts.rs
│   │       ├── communications.rs
│   │       ├── users.rs
│   │       ├── auth.rs
│   │       ├── accounting.rs
│   │       ├── reports.rs
│   │       ├── ai.rs
│   │       ├── campaigns.rs
│   │       ├── documents.rs
│   │       ├── sync.rs
│   │       └── ... (existing modules)
│   ├── migrations/                   # SQL migrations
│   └── tests/                        # Integration tests
│
├── SARAAEK_MARSTER_PLAN.md           # This file
├── SARAAEK_UI_REDESIGN_V4.md        # UI/UX design system (V4)
├── DESIGN.md                         # Design tokens
└── ... (existing files)
```

---

**Document Status:** Master plan V2 with Apple Liquid Glass UI, 3D depth, and agentic AI. Awaiting user review.

**Next Steps:**
1. User reviews this plan
2. Install UI dependencies (see Section 4)
3. Begin Phase 5 (Customer CRM) implementation
4. Iterate through phases sequentially
5. Reference SARAAEK_UI_REDESIGN_V4.md for detailed UI implementation
