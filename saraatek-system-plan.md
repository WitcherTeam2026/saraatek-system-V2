# Saraatek — Repair Management System Plan

---

## Table of Contents

1. [Business Overview](#1-business-overview)
2. [Full Repair Workflow](#2-full-repair-workflow)
3. [Tech Stack Decisions](#3-tech-stack-decisions)
4. [All Phases Overview](#4-all-phases-overview)
5. [Phase 1 — Full Detailed Plan](#5-phase-1--full-detailed-plan)
6. [Phase 2 — Full Detailed Plan](#6-phase-2--full-detailed-plan)
7. [Phase 3 — Full Detailed Plan](#7-phase-3--full-detailed-plan)
8. [Phase 4 — Full Detailed Plan](#8-phase-4--full-detailed-plan)

---

## 1. Business Overview

Saraatek is a repair shop that handles laptops and other devices. The business accepts both walk-in individual customers and business clients. Every repair job is tracked from the moment a device arrives until it is returned to the customer, with full documentation and invoicing handled in one desktop system.

**Customer types:**

- **Individual** — walk-in personal customer. No quotation needed. Goes straight to repair after intake.
- **Business** — company or organisation sending device(s). Requires a formal quotation before work begins. Quotation must be acknowledged before repair starts.

---

## 2. Full Repair Workflow

### Step 1 — Device Intake (New Repair)

When a customer arrives or sends a device, a new repair is created in the system.

**Captured at intake:**
- Repair ID (auto-generated, format: `00003/03/04`)
- Date and time received
- Customer name, phone number, email
- Customer type (Individual or Business)
- Company name (if Business)
- Device type, brand, model, serial number, colour/description
- Reported problem in the customer's own words

**Physical condition checklist (optional):**
- Screen condition: Fine / Scratched / Cracked
- Keyboard condition: Fine / Keys missing / Damaged
- Body/casing: Fine / Dented / Cracked
- Battery present: Yes / No
- Charger included: Yes / No
- Bag or accessories included: Yes / No (with notes)
- Additional intake notes (free text)

At the end of intake:
- Repair is saved and status is set to **Received**
- Intake PDF is generated automatically (customer copy + shop copy)
- Customer is given their Repair ID for reference

---

### Step 2 — Technician Work & Notes

After intake, the assigned technician inspects and works on the device. All notes are recorded directly inside the Repair detail screen.

**What gets recorded:**
- Technician assigned to the job
- Technician findings (what is actually wrong)
- Recommended repair action
- Parts required (pre-repair estimate)
- Estimated cost of repair (RM)
- Repair progress notes (updated during work)
- Parts used (logged after repair)

**For Individual customers:**
- No quotation needed
- Cost communicated verbally or via WhatsApp
- Status moves directly to **Repairing**

**For Business customers:**
- A formal quotation must be generated before work begins (Phase 2)
- Status moves to **Awaiting Approval**
- If approved → **Repairing**
- If declined → **Declined** (closed)

---

### Step 3 — Quotation (Business Customers Only) — Phase 2

Once technician findings are complete, a quotation is generated using the Saraatek template.

- Auto-filled from repair data (customer, device, repair description, parts, labour, total)
- Exported as PDF
- Sent to business customer via WhatsApp or email
- System marks repair as **Awaiting Approval**
- Customer responds: Approved → repair starts / Declined → repair closed

---

### Step 4 — Repair

Once approved (or immediately for individual customers), repair work begins.

- Technician updates repair with progress notes
- Parts used are logged
- Status is **Repairing**
- Photos taken during repair are uploaded and attached (Phase 3)
- Photos can be shared to Facebook for marketing (Phase 3)

When repair is complete:
- Final repair notes added
- Status → **Ready for Collection**
- Customer notified via WhatsApp/SMS (Phase 3)

---

### Step 5 — Invoice & Payment — Phase 2

When customer collects the device, invoice is generated.

- Auto-filled from repair data
- Saraatek letterhead applied
- Payment method recorded (cash, bank transfer, etc.)
- Invoice printed or saved as PDF
- Device handed over to customer
- Status → **Completed**

---

### Step 6 — Warranty — Phase 3

Not every repair gets a warranty. Decided case by case.

- If warranty given: duration recorded, expiry auto-calculated
- Status → **Completed — Under Warranty**
- System alerts when warranty is about to expire
- If customer returns under warranty: repair is reopened, no new invoice
- If no warranty: status → **Closed**

---

### Repair Status Flow

```
Received
   ↓
Repairing  (Individual — direct)
   ↓
[Business] Awaiting Approval → Declined (closed)
   ↓
Repairing
   ↓
Ready for Collection
   ↓
Completed
   ↓
Closed  OR  Under Warranty → (if return) → Reopened
```

---

## 3. Tech Stack Decisions

| Layer | Choice | Reason |
|---|---|---|
| Desktop framework | Tauri 2 | Lightweight (~5 MB), fast startup, low RAM — better than Electron for a shop PC running all day |
| Frontend | React + TypeScript | Component-based UI, strong typing, large ecosystem |
| Styling | Tailwind CSS | Utility-first, fast to build consistent UI |
| State management | Zustand | Simple, lightweight, fits desktop app well |
| Form handling | React Hook Form | Validation, controlled inputs, clean integration |
| Database | SQLite via sqlx | Embedded, zero installation, single file backup, used by major desktop apps |
| PDF generation | HTML template + system print to PDF | Uses existing Saraatek templates, no extra library needed |
| WhatsApp integration | Fonnte | Malaysia-based, connects to existing WhatsApp Business number, no Meta approval needed, REST API, MYR pricing (Phase 3) |

---

## 4. All Phases Overview

### Phase 1 — Core Repair Management (Weeks 1–4)
Get the repair shop fully running on the system. Covers everything from customer intake to repair tracking.

- Customer profiles (Individual & Business)
- New repair creation (2-step form)
- Repair ID generation (monthly counter format)
- Physical condition checklist (optional)
- Technician assignment and notes inside repair detail
- Status tracking (full flow)
- Intake PDF auto-generated on save (customer copy + shop copy)
- Repairs list with search and filters
- Full repair status history with timestamps
- Settings screen (shop info, technicians, counter management)

---

### Phase 2 — Documents & Payment (Weeks 5–8)
Attach money and formal documents to repairs.

- Quotation generator (Business customers only, PDF export using existing template)
- Quotation approval/decline workflow
- Invoice generator (all customers, PDF using existing template)
- Saraatek letterhead and branding applied to both documents
- Terms & conditions and validity period settings
- Payment recording (amount, method, date)
- Customer sign-off on collection (optional)

---

### Phase 3 — Photos, Warranty & Notifications (Weeks 9–12)
After-repair trust, communication, and evidence.

- Photo uploads attached per repair (permanent visual history)
- Facebook photo sharing directly from repair (marketing + proof of work)
- WhatsApp/SMS notification when device is ready for collection (via Fonnte)
- Warranty tracking (duration, start date, expiry auto-calculated)
- Warranty expiry alerts
- Warranty claim reopen flow (search → reopen → rework → close)
- Full repair audit log (every update timestamped)

---

### Phase 4 — Reporting & AI Assistance (Weeks 13–16)
Business insights on top of real data, plus light AI assistance for communication. Split into two sub-phases: 4a (reporting, no AI, no external dependency) built first, then 4b (AI features via OpenRouter free model).

- Revenue and repair volume dashboard (4a)
- Technician performance report (4a)
- AI-drafted WhatsApp messages — ready-for-collection template + free-form composer, always repair-linked, always reviewed before send (4b)
- AI repair history summary for returning customers (4b)

**Explicitly dropped from original scope:**
- AI-suggested technician findings — not needed, technicians are the experts
- Overdue/pending repair alerts — not needed

---

## 5. Phase 1 — Full Detailed Plan

---

### 5.1 Repair ID Format

**Format:** `00003/03/04`

| Segment | Meaning | Example |
|---|---|---|
| `00003` | Sequential count of repairs created this month (5 digits, zero-padded) | 3rd repair of the month |
| `03` | Month (2 digits) | March |
| `04` | Day of month (2 digits) | 4th |

**Counter logic:**
- Two values stored in `shop_settings`: `month_counter` (integer) and `counter_month` (MM string)
- On every new repair creation: check if current month matches `counter_month`
- If same month → increment `month_counter` by 1
- If new month → reset `month_counter` to 1 and update `counter_month`
- Format result as zero-padded 5-digit number + `/MM/DD`

**Examples:**
- First repair ever created in March: `00001/03/01`
- Fifth repair on 15 March: `00005/03/15`
- First repair in April (counter resets): `00001/04/01`

---

### 5.2 Screens to Build

#### Screen 1 — Dashboard (Home)

The first screen shown when the app opens. Gives a live overview of the shop's active work.

**Summary counts (top row):**
- Total open repairs (all active statuses)
- Awaiting approval count (business customers pending response)
- Repairing count (currently being worked on)
- Ready for collection count (waiting for customer pickup)

**Recent repairs list:**
- Shows the last 10 repairs created
- Columns: Repair ID, Customer name, Device, Status, Date received
- Clicking a row opens the repair detail screen

**Quick search bar:**
- Search by repair ID or customer phone number
- Results appear inline, clicking opens repair detail

**Primary action button:**
- "New Repair" button — navigates to the new repair form (Step 1)

---

#### Screen 2 — New Repair, Step 1: Customer

Two-step form for creating a new repair. Step 1 captures the customer.

**Customer lookup (first action on the screen):**
- Phone number input field at the top
- As the technician types, search runs against the `customers` table
- If a match is found: customer name, type, email, and company name auto-fill as read-only
- A "different customer?" link allows clearing and starting fresh
- If no match: the fields below remain editable for a new customer entry

**Fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| Phone number | Text input | Yes | Used as lookup key. Stored as unique in DB. |
| Customer type | Toggle (Individual / Business) | Yes | Controls whether company name field appears |
| Full name | Text input | Yes | |
| Email | Text input | No | Optional |
| Company name | Text input | Conditional | Shown only when Business is selected |

**Behaviour on submit:**
- If existing customer found and confirmed → no new customer row created, use existing ID
- If new customer → insert into `customers` table, get new ID
- Navigate to Step 2 with customer ID in state

---

#### Screen 3 — New Repair, Step 2: Device & Condition

**Device details section:**

| Field | Type | Required | Notes |
|---|---|---|---|
| Device type | Dropdown | Yes | Options: Laptop, Desktop, Tablet, Phone, Other |
| Brand | Text input | Yes | e.g. Dell, HP, Lenovo, Apple |
| Model | Text input | No | e.g. Inspiron 15, ThinkPad X1 |
| Serial number | Text input | No | From the device label if visible |
| Colour / description | Text input | No | Physical identifier e.g. "black, sticker on lid" |
| Reported problem | Textarea | Yes | Customer's own words, not technician interpretation |

**Physical condition checklist (optional section):**
- Collapsed by default, with a toggle/expand button labelled "Add condition checklist"
- If technician skips it: no `repair_condition` row is created in the database
- If technician fills it: all fields below are saved

| Field | Type | Options |
|---|---|---|
| Screen condition | Dropdown | Fine / Scratched / Cracked |
| Keyboard condition | Dropdown | Fine / Keys missing / Damaged |
| Body / casing | Dropdown | Fine / Dented / Cracked |
| Battery present | Toggle | Yes / No |
| Charger included | Toggle | Yes / No |
| Bag / accessories included | Toggle + text | Yes / No, and free text notes if Yes |
| Extra notes | Textarea | Free text — any other observed condition |

**On save:**
1. Insert row into `repairs` table
2. If checklist was filled, insert row into `repair_condition`
3. Insert first row into `repair_history` (status: Received, timestamp: now)
4. Generate intake PDF (both copies)
5. Navigate to the newly created repair detail screen

---

#### Screen 4 — Repair Detail Screen

The main working screen for a repair. Everything about a single repair lives here.

**Header section (read-only):**
- Repair ID (large, prominent)
- Status badge (colour-coded by current status)
- Date and time received
- Customer name, phone, email, company name (if business)

**Device info section (read-only after creation):**
- Device type, brand, model, serial number, colour/description
- Reported problem

**Condition checklist section (read-only):**
- Shown only if checklist was filled at intake
- Displays each field value
- If checklist was skipped, this section is hidden entirely

**Technician section (editable):**

| Field | Type | Notes |
|---|---|---|
| Assigned technician | Dropdown | Pulls from `technicians` table. Can be changed at any time. |
| Technician findings | Textarea | What the technician found after inspection |
| Recommended action | Textarea | What repair is proposed |
| Parts required | Text input | Parts needed before repair starts |
| Estimated cost (RM) | Number input | Pre-repair cost estimate |

**Repair progress section (editable during repair):**

| Field | Type | Notes |
|---|---|---|
| Repair notes | Textarea | Updated as work progresses. Final notes added here when done. |
| Parts used | Text input | Actual parts used after completion |

**Status control:**
- Current status shown as a coloured badge
- "Update status" button opens a small modal with:
  - Dropdown to select next valid status
  - Optional note field
  - Confirm button
- On confirm: updates `repairs.status`, inserts a new row in `repair_history`

**Status history log (read-only):**
- Full list of all status changes for this repair
- Each row: status name, note (if any), timestamp
- Ordered newest to oldest

**Actions:**
- "Reprint intake PDF" — regenerates and opens the intake PDF for this repair
- "Cancel repair" — sets status to Cancelled with a required reason note

---

#### Screen 5 — Repairs List

The main browse screen for all repairs in the system.

**Search:**
- Single search bar — searches across repair ID, customer name, and customer phone number
- Results update as the technician types (debounced)

**Filters (all combinable):**
- Status: multi-select (Received, Repairing, Awaiting Approval, Ready for Collection, Completed, Declined, Cancelled)
- Technician: dropdown, filter by assigned technician
- Customer type: Individual / Business / All
- Date range: date picker for received_at range

**Sort options:**
- Date received (newest first — default)
- Date received (oldest first)
- Status (alphabetical)

**Repair list table columns:**
- Repair ID
- Customer name
- Phone number
- Device (brand + model)
- Status (colour-coded badge)
- Technician assigned
- Date received

**Row interaction:**
- Clicking any row opens the repair detail screen for that repair

---

#### Screen 6 — Settings

Configuration for the shop. Set once, referenced everywhere.

**Shop information:**
- Shop name
- Address
- Phone number
- Logo upload (used in intake PDF and future documents)

**Technicians:**
- List of all technicians with name and phone
- Add new technician (name + phone)
- Mark technician as inactive (removed from assignment dropdown but data preserved)

**Repair counter:**
- View current `month_counter` value
- View `counter_month`
- Manual reset button (with confirmation) — for edge cases only

**PDF template:**
- File path to the intake PDF template
- Option to browse and update if template file moves

---

### 5.3 Intake PDF — Generated on New Repair Save

Generated automatically the moment a new repair is saved. No manual action needed from the technician.

**How it works:**
- The intake PDF template is an HTML file with placeholder tags (e.g. `{{repair_id}}`, `{{customer_name}}`)
- On save, Tauri injects all repair data into the template
- The system print dialog opens with the filled template, allowing the technician to print or save as PDF
- Two versions are printed: customer copy and shop copy

**Customer copy contains:**
- Saraatek logo and name
- Repair ID (large, easy to read)
- Date and time received
- Customer name and phone number
- Device: type, brand, model
- Reported problem
- Physical condition summary (if checklist was filled)
- Footer: "We will contact you when your device is ready. Please keep this receipt."

**Shop copy contains:**
- Everything in the customer copy
- Technician assigned (if set at time of intake, otherwise blank)
- Current status
- Internal notes field (blank, for handwritten updates)
- Space for technician signature
- Space for customer signature at collection

---

### 5.4 Database Schema

#### Table: `customers`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique customer ID |
| type | TEXT | NOT NULL | 'individual' or 'business' |
| name | TEXT | NOT NULL | Full name |
| phone | TEXT | UNIQUE NOT NULL | Used as lookup key |
| email | TEXT | | Optional |
| company_name | TEXT | | Business customers only |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Auto set on insert |

---

#### Table: `repairs`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | TEXT | PRIMARY KEY | Format: 00003/03/04 |
| customer_id | INTEGER | NOT NULL, FK → customers.id | |
| status | TEXT | NOT NULL | Current stage of the repair |
| device_type | TEXT | | Laptop / Desktop / Tablet / Phone / Other |
| brand | TEXT | NOT NULL | Device brand |
| model | TEXT | | Device model |
| serial_number | TEXT | | Optional |
| color_desc | TEXT | | Colour and physical description |
| reported_problem | TEXT | NOT NULL | Customer's words at intake |
| technician_id | INTEGER | FK → technicians.id | Nullable — assigned later |
| tech_findings | TEXT | | What technician found |
| recommended_action | TEXT | | Proposed repair action |
| parts_required | TEXT | | Parts needed pre-repair |
| estimated_cost | REAL | | Estimated cost in RM |
| repair_notes | TEXT | | Progress and final notes |
| parts_used | TEXT | | Actual parts used after repair |
| received_at | DATETIME | NOT NULL | Timestamp of intake |

---

#### Table: `repair_condition`

Only one row per repair. Row is only created if the checklist was filled at intake.

| Column | Type | Constraints | Description |
|---|---|---|---|
| repair_id | TEXT | PRIMARY KEY, FK → repairs.id | One-to-one with repair |
| screen | TEXT | | 'fine' / 'scratched' / 'cracked' |
| keyboard | TEXT | | 'fine' / 'keys missing' / 'damaged' |
| body | TEXT | | 'fine' / 'dented' / 'cracked' |
| battery_present | INTEGER | | 1 = Yes, 0 = No |
| charger_included | INTEGER | | 1 = Yes, 0 = No |
| accessories_included | INTEGER | | 1 = Yes, 0 = No |
| accessories_notes | TEXT | | Free text if accessories included |
| extra_notes | TEXT | | Any other observed condition |

---

#### Table: `repair_history`

One row inserted every time a repair's status changes. Never updated, only appended.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| repair_id | TEXT | NOT NULL, FK → repairs.id | |
| status | TEXT | NOT NULL | Status applied at this point |
| note | TEXT | | Optional context for the change |
| changed_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Auto timestamp |

---

#### Table: `technicians`

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| name | TEXT | NOT NULL | |
| phone | TEXT | | |
| active | INTEGER | DEFAULT 1 | 1 = active, 0 = inactive |

---

#### Table: `shop_settings`

Key-value store for all configurable values.

| key | Example value | Description |
|---|---|---|
| shop_name | Saraatek | |
| shop_address | No. 12, Jalan ... | |
| shop_phone | 03-XXXXXXXX | |
| shop_logo_path | /path/to/logo.png | |
| month_counter | 5 | Current month's repair count |
| counter_month | 03 | Month the counter belongs to |
| pdf_template_path | /path/to/template.html | Path to intake PDF template |

---

### 5.5 Status Values (Phase 1)

| Status | Colour | Meaning |
|---|---|---|
| Received | Gray | Device has arrived, intake complete |
| Awaiting Approval | Amber | Business customer quotation sent, waiting for response |
| Repairing | Blue | Work is in progress |
| Ready for Collection | Purple | Repair done, waiting for customer pickup |
| Completed | Green | Device collected, payment received |
| Declined | Red | Business customer rejected the quotation |
| Cancelled | Red | Repair cancelled for any other reason |

---

### 5.6 Build Order (Recommended)

Build in this order so each step is testable before the next begins.

1. **Project setup** — Initialise Tauri 2 project, React + TypeScript, Tailwind CSS, Zustand, React Hook Form
2. **Database layer** — Create all SQLite tables using migrations (sqlx), seed `shop_settings` with defaults
3. **Settings screen** — Shop info and technician management (needed before anything else references them)
4. **Customer lookup logic** — Phone search function used in Step 1 form
5. **New Repair form — Step 1** (customer)
6. **New Repair form — Step 2** (device + optional checklist)
7. **Repair ID generation** — Monthly counter logic wired to save action
8. **Intake PDF generation** — Template injection and print dialog
9. **Repair detail screen** — Read-only sections + editable technician fields + status control
10. **Repair history log** — Auto-insert on every status change
11. **Repairs list screen** — Table, search, filters, sort
12. **Dashboard** — Counts, recent list, quick search (pulls from already-built data)

---

*Document version: Phase 1 planning complete. Phase 2 onwards to be detailed after Phase 1 is built and confirmed.*

---

## Phase 1 — Complete ✓

### Build Summary

**Tech stack realized:**
- Tauri 2 + React 19 + TypeScript + Tailwind CSS v4 + Zustand + React Hook Form
- SQLite via rusqlite (bundled, not sqlx as originally planned)
- PDF via printpdf crate (programmatic, not HTML template print)
- Single Rust process (no Tauri plugin for SQL — custom commands for type safety + DB access)

**Screens built (6/6):**
1. Dashboard — summary counts, recent repairs, quick search, "New Repair" button
2. NewRepairStep1 — customer phone lookup + create form (Individual/Business toggle)
3. NewRepairStep2 — device details + optional physical condition checklist
4. RepairDetail — read-only info, editable technician/progress fields, status modal, history log, PDF reprint
5. RepairsList — search by ID/name/phone, multi-filter (status/tech/type/date), sort, clickable rows
6. Settings — shop info, technician CRUD, counter view

**Database (6 tables):**
- customers, repairs, repair_condition, repair_history, technicians, shop_settings
- All with proper indexes, foreign keys, seed data for defaults

**Rust commands (16):**
- Customer: search_customer, create_customer
- Repair: generate_new_repair_id, create_repair, get_repair, list_repairs, update_repair_status, update_technician_fields, get_repair_history, get_dashboard_counts
- Settings: get_all_settings, save_setting
- Technicians: list_technicians, create_technician, toggle_technician_active
- PDF: generate_intake_pdf

**Shared components (7):**
- Button, Input, Select, Textarea, Card, Modal, StatusBadge, Sidebar, Layout

**PDF generation:**
- printpdf 0.9 crate generates A4 intake PDFs programmatically
- Purple header bar (#6B46C1), repair ID card, customer/device info grids, condition checklist, reported problem, shop-use-only section with signature lines, footer
- Save As on first use (stores directory in shop_settings), auto-save thereafter
- Both customer copy and shop copy generated per save

**Skills installed for future development:**
| Skill | Source | Installs |
|---|---|---|
| tauri-v2 | nodnarbnitram/claude-code-extensions | 5.3K |
| rust-best-practices | apollographql/skills | 12.2K |
| rust-async-patterns | wshobson/agents | 14.4K |
| sqlite-database-expert | martinholovsky/claude-skills-generator | 2.0K |

**Build status:**
- `cargo build` — zero errors, zero warnings
- `npx tsc -b --noEmit` — zero errors
- Ready for Phase 2 planning

---

---

## 6. Phase 2 — Full Detailed Plan

---

### 6.1 Overview

Phase 2 attaches money and formal documents to repairs. Every repair that reaches the collection stage must have an invoice. Business customer repairs additionally require a quotation before work begins. Payment is recorded at collection and the repair is marked Completed.

**What changes in Phase 2:**
- `customers` table gains an `address` column
- New Repair Step 1 gains an address field
- Repair Detail gains three new action buttons: Generate Quotation (business only), Generate Invoice, Record Payment
- Two new PDF types generated with `printpdf`: Quotation and Invoice
- Three new database tables: `quotation_items`, `quotations`, `payments`

---

### 6.2 Database Schema Changes

#### Table: `customers` — updated

One new column added to the existing table via migration.

| Column | Type | Constraints | Description |
|---|---|---|---|
| address | TEXT | | Customer address — used on quotation and invoice |

Migration:
```sql
ALTER TABLE customers ADD COLUMN address TEXT;
```

---

#### Table: `quotations`

One row per quotation. Only created for Business customer repairs.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| repair_id | TEXT | NOT NULL, UNIQUE, FK → repairs.id | One quotation per repair |
| status | TEXT | NOT NULL | 'pending' / 'approved' / 'declined' |
| generated_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When quotation was created |
| responded_at | DATETIME | | When approval or decline was recorded |
| response_note | TEXT | | Optional note when approving or declining |

---

#### Table: `quotation_items`

Line items for both quotations and invoices. Max 2 rows per document. Each item is either a repair service (labour) or a part.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| repair_id | TEXT | NOT NULL, FK → repairs.id | Links items to the repair |
| document_type | TEXT | NOT NULL | 'quotation' or 'invoice' |
| sort_order | INTEGER | NOT NULL | 1 or 2 — controls display order |
| description | TEXT | NOT NULL | e.g. "Screen Replacement" or "LCD Panel 15.6\"" |
| item_type | TEXT | NOT NULL | 'labour' or 'part' |
| device_name | TEXT | | Device brand + model shown under description |
| serial_number | TEXT | | Device serial shown under description |
| unit_price | REAL | NOT NULL | Price per unit in RM |
| qty | INTEGER | NOT NULL DEFAULT 1 | Quantity |
| total | REAL | NOT NULL | unit_price × qty (computed on save) |

**Note:** When a quotation is approved and work is done, the invoice items are pre-filled from the quotation items. The technician can edit them before generating the invoice if the final cost differs.

---

#### Table: `payments`

One row per repair payment. Recorded at collection.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| repair_id | TEXT | NOT NULL, UNIQUE, FK → repairs.id | One payment per repair |
| amount | REAL | NOT NULL | Amount paid in RM |
| method | TEXT | NOT NULL | 'cash' or 'bank_transfer' |
| paid_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When payment was recorded |
| note | TEXT | | Optional note e.g. transaction reference |

---

### 6.3 Screens to Build / Update

---

#### Update: New Repair Step 1 — Add Address Field

One new optional field added to the existing customer form.

| Field | Type | Required | Notes |
|---|---|---|---|
| Address | Textarea | No | Used on quotation and invoice. Shown for both Individual and Business. |

**Behaviour:**
- If existing customer found by phone lookup: address auto-fills as read-only (same as other fields)
- If new customer: address field is editable
- Stored in `customers.address`

---

#### Update: Repair Detail Screen — New Actions Section

A new **Documents & Payment** section is added at the bottom of the Repair Detail screen, below the status history log.

**What appears depends on repair state:**

| Condition | Buttons shown |
|---|---|
| Business customer, no quotation yet | "Generate Quotation" |
| Business customer, quotation pending | "Approve Quotation" / "Decline Quotation" / "Reprint Quotation" |
| Business customer, quotation approved OR Individual customer | "Generate Invoice" (if no invoice yet) |
| Invoice generated, no payment yet | "Record Payment" / "Reprint Invoice" |
| Payment recorded | Payment summary (read-only) / "Reprint Invoice" |

---

#### New Screen: Quotation Builder

Opened when technician clicks "Generate Quotation" from the Repair Detail screen. Business customers only.

**Pre-filled (read-only) from repair data:**
- Repair ID
- Customer name, address, phone
- Date (today)

**Line items section (up to 2 items):**

Each item row contains:

| Field | Type | Required | Notes |
|---|---|---|---|
| Item type | Toggle | Yes | Labour / Part |
| Description | Text input | Yes | e.g. "Screen Replacement" or "LCD Panel 15.6\"" |
| Device name | Text input | No | Pre-filled from repair brand + model |
| Serial number | Text input | No | Pre-filled from repair serial number |
| Unit price (RM) | Number input | Yes | |
| QTY | Number input | Yes | Default: 1 |
| Total | Calculated | — | Auto-calculated: unit_price × qty, read-only |

**Grand total:**
- Sum of all item totals — displayed prominently, read-only

**Actions:**
- "Generate & Print" — saves quotation to DB, generates PDF, opens print dialog, sets repair status to **Awaiting Approval**
- "Cancel" — returns to Repair Detail without saving

**On save:**
1. Insert row into `quotations` (status: 'pending')
2. Insert up to 2 rows into `quotation_items` (document_type: 'quotation')
3. Update `repairs.status` → Awaiting Approval
4. Insert row into `repair_history` (status: Awaiting Approval)
5. Generate Quotation PDF and open print dialog

---

#### New Screen: Invoice Builder

Opened when technician clicks "Generate Invoice" from the Repair Detail screen. Available for all customers once repair is at Ready for Collection or later.

**Pre-filled (read-only) from repair data:**
- Repair ID
- Customer name, address, phone
- Date (today)

**Line items section (up to 2 items):**

For Business customers: pre-filled from approved quotation items. Technician can edit if final cost differs.
For Individual customers: blank, technician fills in manually.

Same fields as Quotation Builder:

| Field | Type | Required | Notes |
|---|---|---|---|
| Item type | Toggle | Yes | Labour / Part |
| Description | Text input | Yes | |
| Device name | Text input | No | Pre-filled from repair |
| Serial number | Text input | No | Pre-filled from repair |
| Unit price (RM) | Number input | Yes | |
| QTY | Number input | Yes | Default: 1 |
| Total | Calculated | — | Auto-calculated, read-only |

**Grand total:**
- Sum of all item totals — displayed prominently, read-only

**Actions:**
- "Generate & Print" — saves invoice items to DB, generates PDF, opens print dialog
- "Cancel" — returns to Repair Detail without saving

**On save:**
1. Insert up to 2 rows into `quotation_items` (document_type: 'invoice')
2. Generate Invoice PDF and open print dialog
3. Repair status is NOT changed here — status changes only when payment is recorded

---

#### New Modal: Record Payment

Opened when technician clicks "Record Payment" from the Repair Detail screen. Small modal, not a full screen.

**Fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| Amount (RM) | Number input | Yes | Pre-filled with invoice grand total |
| Payment method | Dropdown | Yes | Cash / Bank Transfer |
| Note | Text input | No | e.g. bank transaction reference |

**Actions:**
- "Confirm Payment" — saves payment, updates repair status to Completed
- "Cancel" — closes modal, no changes

**On confirm:**
1. Insert row into `payments`
2. Update `repairs.status` → Completed
3. Insert row into `repair_history` (status: Completed, note: payment method + amount)

---

### 6.4 Quotation Approval / Decline Flow

When the printed quotation is handed to the business customer and they call or message to respond:

**To approve:**
1. Technician opens Repair Detail
2. Clicks "Approve Quotation"
3. Small confirmation modal appears with optional note field (e.g. "Customer called to approve")
4. On confirm:
   - `quotations.status` → 'approved'
   - `quotations.responded_at` → now
   - `repairs.status` → Repairing
   - New row in `repair_history`

**To decline:**
1. Technician clicks "Decline Quotation"
2. Small confirmation modal with optional note field (e.g. "Customer declined via WhatsApp")
3. On confirm:
   - `quotations.status` → 'declined'
   - `quotations.responded_at` → now
   - `repairs.status` → Declined
   - New row in `repair_history`

---

### 6.5 PDF — Quotation & Invoice

Both documents use the same visual layout. Only the document title changes (QUOTATION vs INVOICE).

**Generated with:** `printpdf` crate (same as Phase 1 intake PDF)

**Layout (A4, portrait):**

| Section | Content |
|---|---|
| Header bar | Dark background, Saraatek logo left, tagline "YOUR DEAD DEVICE HAS A SECOND LIFE" centre-right |
| Document title | "QUOTATION" or "INVOICE" — large, right-aligned below header |
| Repair ID | Below document title, right-aligned |
| Top left block | Date, shop address, shop email, shop phone |
| Top right block | "Payment via Commercial Bank", account name, account number, branch (hardcoded) |
| Line items table | DESCRIPTION / PRICE / QTY / TOTAL columns. Each item shows description bold, device name + S/N as sub-bullets below. Max 2 items. |
| Grand total row | Right-aligned, bold — sum of all item totals |
| Customer block | CUSTOMER: [name], ADDRESS: [address], CONTACT: [phone] |
| Terms & conditions | Fixed printed text block (same as template) |
| Signature line left | "Saraa TEK — Authorised Signature" |
| Signature line right | "Customer Signature" |
| Footer | Phone, email, WhatsApp number, address, Facebook name |

**Bank details (hardcoded in PDF generation code):**
- Payment via Commercial Bank
- Account Name: N.G.C.N Ariyarathna
- Account Number: 811701159B
- Branch: Pitakotte

**Save behaviour:**
- Same as intake PDF: Save As dialog on first use per document type, directory stored in `shop_settings`, auto-save to same directory thereafter
- Filename format: `QUO_[REPAIR_ID]_[DATE].pdf` and `INV_[REPAIR_ID]_[DATE].pdf`

---

### 6.6 New Rust Commands

| Command | Description |
|---|---|
| `update_customer_address` | Update address for an existing customer |
| `create_quotation` | Insert quotation + quotation items, update repair status |
| `approve_quotation` | Set quotation approved, update repair status to Repairing |
| `decline_quotation` | Set quotation declined, update repair status to Declined |
| `get_quotation` | Get quotation + items for a repair |
| `create_invoice_items` | Insert invoice line items for a repair |
| `get_invoice_items` | Get invoice items for a repair |
| `record_payment` | Insert payment record, update repair status to Completed |
| `get_payment` | Get payment details for a repair |
| `generate_quotation_pdf` | Generate Quotation PDF via printpdf, return file path |
| `generate_invoice_pdf` | Generate Invoice PDF via printpdf, return file path |

**Total Phase 2 Rust commands: 11**
**Cumulative total: 27 commands (16 Phase 1 + 11 Phase 2)**

---

### 6.7 Build Order (Recommended)

Build in this order so each step is testable before the next begins.

1. **Database migration** — `ALTER TABLE customers ADD COLUMN address` + create `quotations`, `quotation_items`, `payments` tables
2. **`update_customer_address` command** — wire address save to customer record
3. **New Repair Step 1 update** — add address field to customer form and lookup display
4. **Repair Detail update** — add Documents & Payment section with conditional button logic
5. **Quotation Builder screen** — form, line item rows, grand total calculation
6. **`create_quotation` command** — save quotation + items + status change
7. **Quotation PDF** (`generate_quotation_pdf`) — printpdf layout matching template
8. **Approve / Decline modals** — `approve_quotation` and `decline_quotation` commands wired to buttons
9. **Invoice Builder screen** — form, pre-fill from quotation items for business, blank for individual
10. **`create_invoice_items` command** — save invoice items
11. **Invoice PDF** (`generate_invoice_pdf`) — same layout as quotation, title swapped
12. **Record Payment modal** — `record_payment` command, status → Completed
13. **Reprint buttons** — `get_quotation` / `get_invoice_items` → regenerate PDFs on demand

---

### 6.8 Status Values Added in Phase 2

No new statuses are introduced. Phase 2 uses existing statuses from Phase 1:

| Status | Triggered by |
|---|---|
| Awaiting Approval | Quotation generated for business customer |
| Repairing | Quotation approved |
| Declined | Quotation declined |
| Completed | Payment recorded |

---

*Document version: Phase 2 build complete. Ready for Phase 3 planning.*

---

## Phase 2 — Complete ✓

### Build Summary

**Tech stack additions:**
- Same Tauri 2 + React 19 + TypeScript + Tailwind CSS v4 + Zustand stack
- One new migration: `ALTER TABLE customers ADD COLUMN address TEXT`
- 3 new DB tables: `quotations`, `quotation_items`, `payments`
- 11 new Rust commands (cumulative: 27)
- PDF via printpdf — quotation + invoice layouts with full professional styling

**Screens built / updated (5):**

1. **New Repair Step 1** — Address field added to customer form
   - Optional textarea for both Individual and Business
   - Read-only when customer found by phone lookup
   - Editable for new customers
   - Stored in `customers.address`

2. **Repair Detail — Documents & Payment section**
   - 5 conditional states matching repair progress:
     | Condition | Buttons |
     |---|---|
     | Business + no quotation | Generate Quotation |
     | Quotation pending | Approve / Decline / Reprint Quotation |
     | Quotation approved (business) OR Individual | Generate Invoice |
     | Invoice exists, no payment | Record Payment / Reprint Invoice |
     | Payment recorded | Payment summary (read-only) / Reprint Invoice |
   - Approve modal: optional `response_note` field, sets status → `Repairing`
   - Decline modal: optional `response_note` field, sets status → `Declined`

3. **Quotation Builder** (new screen, business only)
   - Pre-filled: Repair ID, customer name/address/phone, date, device info
   - 2 line item rows max with:
     - Item type toggle (Labour / Part)
     - Description (text)
     - Device name (pre-filled from repair)
     - Serial number (pre-filled from repair)
     - Unit price (RM) + Qty (default 1)
     - Auto-calculated total per row
   - Grand total displayed prominently
   - "Generate & Print" — saves quotation, generates PDF, status → Awaiting Approval
   - Detects existing pending quotation and pre-fills for edit

4. **Invoice Builder** (new screen, all customers)
   - Pre-filled from approved quotation items for business customers
   - Blank items for individual customers
   - Same line item fields as Quotation Builder
   - Existing invoice items shown as read-only
   - "Generate & Print" — saves invoice items, generates PDF (status unchanged)

5. **Record Payment Modal** (new modal)
   - Amount pre-filled with grand total
   - Payment method dropdown: Cash / Bank Transfer
   - Optional note field (e.g. transaction reference)
   - "Confirm Payment" — inserts payment, sets repair → Completed

**Database (3 new tables, 1 migration):**

| Table | Columns | Notes |
|---|---|---|
| `quotations` | id (PK), repair_id (UNIQUE FK), status ('pending'/'approved'/'declined'), subtotal, tax, grand_total, generated_at, responded_at, response_note | One per repair, business only |
| `quotation_items` | id (PK), repair_id (FK), document_type ('quotation'/'invoice'), sort_order (1/2), description, item_type ('labour'/'part'), device_name, serial_number, unit_price, qty (default 1), total | Shared via document_type |
| `payments` | id (PK), repair_id (UNIQUE FK), amount, method ('cash'/'bank_transfer'), paid_at, note | One per repair |
| `customers` | +address (TEXT, optional) | Migration: ALTER TABLE ADD COLUMN |

**Shop settings seed data updated:**
- 3 new keys: `shop_email` (saraatek25@gmail.com), `shop_whatsapp` (+9472 2828 100), `shop_facebook` (saraa tek)
- Total: 11 seed rows (was 8)

**Rust commands (11 new, 27 cumulative):**

| Command | Signature | Description |
|---|---|---|
| `update_customer_address` | (id: i64, address: String) → Customer | Update address for existing customer |
| `create_quotation` | (input: CreateQuotationInput) → QuotationWithItems | Insert quotation + items, status → Awaiting Approval |
| `get_quotation` | (id: i64) → Option\<QuotationWithItems\> | Get quotation by PK ID |
| `get_quotation_by_repair` | (repair_id: String) → Option\<QuotationWithItems\> | Get quotation by repair ID (UI convenience) |
| `approve_quotation` | (id: i64, response_note: Option\<String\>) → QuotationWithItems | Set approved, repair → Repairing |
| `decline_quotation` | (id: i64, response_note: Option\<String\>) → QuotationWithItems | Set declined, repair → Declined |
| `create_invoice_items` | (repair_id: String, items: Vec\<CreateQuotationItemInput\>) → Vec\<QuotationItem\> | Insert invoice items |
| `get_invoice_items` | (repair_id: String) → Vec\<QuotationItem\> | Get invoice items by repair |
| `record_payment` | (input: CreatePaymentInput) → Payment | Insert payment, repair → Completed |
| `get_payment` | (repair_id: String) → Option\<Payment\> | Get payment by repair |
| `generate_quotation_pdf_file` | (repair_id: String, save_as: bool) → String | Generate Quotation PDF via printpdf |
| `generate_invoice_pdf_file` | (repair_id: String, save_as: bool) → String | Generate Invoice PDF via printpdf |

**Frontend types added/updated:**

| Type | Fields |
|---|---|
| `Quotation` | id (number), repair_id, status, subtotal, tax, grand_total, generated_at, responded_at \| null, response_note \| null |
| `QuotationItem` | id (number), repair_id, document_type, sort_order, description, item_type, device_name \| null, serial_number \| null, unit_price, qty, total |
| `QuotationWithItems` | quotation: Quotation + items: QuotationItem[] |
| `CreateQuotationItemInput` | sort_order, description, item_type, device_name \| null, serial_number \| null, unit_price, qty |
| `CreateQuotationInput` | repair_id + items: CreateQuotationItemInput[] |
| `Payment` | id (number), repair_id, amount, method, paid_at, note \| null |
| `CreatePaymentInput` | repair_id, amount, method, note \| null |
| `RepairWithCustomer` | +customer_address: string |

**API layer (`lib/api.ts`) additions:**
- `quotations` namespace: create, get, getByRepair, approve, decline, createInvoiceItems, getInvoiceItems
- `payments` namespace: record, get
- `pdf` namespace: generateQuotationPdf, generateInvoicePdf

**PDF generation:**

- Shared `generate_document_pdf()` function parameterised by document title
- `printpdf` crate — A4 portrait, programmatic layout (no templates)

| Section | Content |
|---|---|
| Header bar | Purple (#6B46C1) full-width bar: shop name left, "YOUR DEAD DEVICE HAS A SECOND LIFE" right |
| Document title | "QUOTATION" or "INVOICE" — 18pt Helvetica Bold, right-aligned |
| Repair ID | Right-aligned below title |
| Left info column | Date, shop address, shop email, shop phone (label + value pairs) |
| Right info column | Bank details header + 4 lines (hardcoded): Payment via Commercial Bank, Account Name: N.G.C.N Ariyarathna, Account Number: 811701159B, Branch: Pitakotte |
| Purple divider | Full-width 1.5mm line |
| Customer block | Name \| Phone \| Address |
| Device block | Brand/Model, Type |
| Items table | DESCRIPTION / QTY / UNIT PRICE / TOTAL columns. [L] or [P] prefix. Device name + S/N as sub-bullets. Alternating row shading. Purple header row. |
| Summary box | Subtotal, Tax (0%), Grand Total in purple highlight box |
| Terms & Conditions | 6 fixed terms: 30-day validity, payment at collection, 3-month warranty (manufacturing defects only), no data liability, 90-day unclaimed disposal |
| Signature lines | "SaraaTEK - Authorised Signature" (left) + "Customer Signature" (right) with grey underline rules |
| Footer | shop_phone \| shop_email \| shop_whatsapp \| shop_address \| shop_facebook |
| Filename | `QUO_[REPAIR_ID]_[DATE].pdf` or `INV_[REPAIR_ID]_[DATE].pdf` |
| Save behaviour | Save As dialog on first use per document type, directory stored in `shop_settings.pdf_output_dir`, auto-save thereafter. Both customer + shop copy generated. |

**Internal Rust helpers added:**
- `draw_right_text()` — right-aligned text with width estimation
- `draw_bank_details()` — hardcoded Commercial Bank block
- `draw_label()` — single text label at (x, y)
- `draw_terms_and_conditions()` — 6-term block
- `draw_signatures()` — authorised + customer signature with underline lines

**Build status:**
- `cargo test` — 43/43 pass (0 failed, 0 warnings)
- `npx tsc -b --noEmit` — zero errors
- `cargo build` — zero errors, zero warnings
- **Phase 1 ✅ \| Phase 2 ✅**

**Status transitions added in Phase 2:**

| From | To | Trigger |
|---|---|---|
| Received | Awaiting Approval | Quotation generated (business customer) |
| Awaiting Approval | Repairing | Quotation approved by customer |
| Awaiting Approval | Declined | Quotation declined by customer |
| Repairing / Ready for Collection | Completed | Payment recorded |

---

---

## 7. Phase 3 — Full Detailed Plan

---

### 7.1 Overview

Phase 3 adds after-repair trust, communication, and evidence on top of the existing repair/document/payment flow. Nothing in Phase 1 or Phase 2 changes structurally — Phase 3 only adds new tables, new sections to the Repair Detail screen, and two new terminal statuses.

**What's included:**
- Photo uploads attached per repair (filesystem-based, thumbnail grid + lightbox)
- Manual "Open Photos Folder" action for Facebook/WhatsApp sharing (no Graph API integration)
- WhatsApp notification when device is ready for collection (via Fonnte), manually triggered
- Warranty tracking, set at invoice time, with manual reopen-by-serial-number flow
- Automatic warranty expiry check on app startup
- Field-level audit log for key technician-editable fields

**What's explicitly out of scope for Phase 3:**
- Facebook Graph API integration (requires Meta app review — replaced with manual folder share)
- Automatic/scheduled WhatsApp notifications (manual button only)
- Warranty expiry alerts/reminders (dropped — auto-close handles it silently)
- User login / technician attribution on audit log (no auth system exists yet)

---

### 7.2 Database Schema Changes

#### Table: `photos`

One row per uploaded photo. Files live on disk; this table is metadata only.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| repair_id | TEXT | NOT NULL, FK → repairs.id | |
| filename | TEXT | NOT NULL | e.g. `IMG_20260619_0001.jpg` |
| file_path | TEXT | NOT NULL | Full path on disk |
| uploaded_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |

**Storage layout on disk:**
```
saraatek-photos/[REPAIR_ID_SANITIZED]/
   IMG_20260619_0001.jpg
   IMG_20260619_0002.jpg
```
Repair IDs contain `/` (e.g. `00003/03/04`), which is invalid in folder names — sanitized to `00003-03-04` on disk only. The DB always stores the original `repair_id` unchanged.

---

#### Table: `notifications`

One row per WhatsApp send attempt. Future-proofed with a `type` column even though only one type exists today.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| repair_id | TEXT | NOT NULL, FK → repairs.id | |
| type | TEXT | NOT NULL | 'ready_for_collection' |
| status | TEXT | NOT NULL | 'sent' / 'failed' |
| fonnte_response | TEXT | | Raw API response, for debugging |
| sent_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |

---

#### Table: `warranties`

One row per repair. Only created when warranty is enabled at invoice time.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| repair_id | TEXT | NOT NULL, UNIQUE, FK → repairs.id | One warranty per repair |
| duration_label | TEXT | NOT NULL | e.g. "3 Months" or custom text |
| start_date | DATE | NOT NULL | Date invoice was generated |
| expiry_date | DATE | NOT NULL | Auto-calculated from start_date + duration |
| created_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |

---

#### Table: `field_audit_log`

Tracks edits to key technician-editable fields. No user attribution (no login system exists).

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | |
| repair_id | TEXT | NOT NULL, FK → repairs.id | |
| field_name | TEXT | NOT NULL | e.g. 'estimated_cost' |
| old_value | TEXT | | Stored as text regardless of source type |
| new_value | TEXT | | |
| changed_at | DATETIME | NOT NULL, DEFAULT CURRENT_TIMESTAMP | |

**Fields tracked:** `estimated_cost`, `tech_findings`, `recommended_action`, `parts_required`, `parts_used`, `repair_notes`
**Fields NOT tracked:** device details, customer details, condition checklist (low dispute risk, would add noise)

---

#### Table: `shop_settings` — new keys

| key | Example value | Description |
|---|---|---|
| photos_dir | /path/to/saraatek-photos | Root folder for all repair photos |
| fonnte_api_token | (token string) | API key for Fonnte WhatsApp account |
| default_country_code | 94 | Used to auto-format customer numbers for WhatsApp |

---

### 7.3 Status Values Added in Phase 3

| Status | Colour | Meaning |
|---|---|---|
| Completed — Under Warranty | Green (with badge icon) | Device collected, payment received, warranty active |
| Closed | Gray | Repair fully closed — either no warranty was given, or warranty has expired |

**Updated status reference (all phases combined):**

| Status | Colour | Meaning |
|---|---|---|
| Received | Gray | Device has arrived, intake complete |
| Awaiting Approval | Amber | Business customer quotation sent, waiting for response |
| Repairing | Blue | Work is in progress (incl. warranty reopen rework) |
| Ready for Collection | Purple | Repair done, waiting for customer pickup |
| Completed | Green | Device collected, payment received, no warranty given |
| Completed — Under Warranty | Green | Device collected, payment received, warranty active |
| Declined | Red | Business customer rejected the quotation |
| Cancelled | Red | Repair cancelled for any other reason |
| Closed | Gray | Final state — no warranty, or warranty expired |

---

### 7.4 Screens to Build / Update

---

#### Update: Invoice Builder — Add Warranty Toggle

New section added below the line items / grand total, before the "Generate & Print" action.

| Field | Type | Required | Notes |
|---|---|---|---|
| Give warranty? | Toggle | Yes | Default: Off |
| Duration | Dropdown (shown if On) | Yes if On | 1M / 2M / 3M / 6M / 1Y / 2Y / 3Y / 5Y / 10Y / Custom |
| Custom duration text | Text input (shown if "Custom" selected) | Conditional | Free text, e.g. "Until end of 2026" |

**On "Generate & Print" with warranty enabled:**
1. Insert row into `warranties` (start_date = today, expiry_date = calculated from duration)
2. Continue invoice generation as normal
3. After payment is recorded → repair status becomes **Completed — Under Warranty** instead of **Completed**
4. Warranty duration + expiry date printed at the bottom of the Invoice PDF

**If warranty is off:** repair status becomes **Completed** as before (Phase 2 behaviour unchanged), and on next status transition eventually reaches **Closed** (see 7.6).

---

#### Update: Repair Detail Screen — New Sections

Three new sections added below the existing Documents & Payment section (Phase 2):

**1. Photos section**
- Drop zone + "Add Photos" button (both supported — drag-and-drop and file picker)
- Thumbnail grid below (responsive, ~4–5 per row)
- Click thumbnail → full-size lightbox modal with next/prev arrows and a delete button
- "Open Photos Folder" button — opens the repair's folder in Windows Explorer for manual sharing

**2. Notification section**
- Visible only when status = **Ready for Collection**
- "Send WhatsApp Notification" button
- After send: button changes to show "Sent ✓ [time]" with a "Resend" link below
- On failure: inline error message, button remains clickable to retry

**3. Warranty section**
- Visible only if a `warranties` row exists for this repair
- Read-only display: duration, start date, expiry date, days remaining (or "Expired" badge if past expiry but not yet auto-closed)
- "Reopen for Warranty Claim" button (see 7.5)

**4. Audit Log section (collapsible)**
- Placed below the existing Status History log, visually separated
- Collapsed by default, "View field change history" toggle to expand
- Each row: field name, old value → new value, timestamp
- Newest first

---

#### New Screen: Warranty Reopen Search

A simple search screen accessible from the Dashboard or a "Warranty Claim" entry point.

**Search:**
- Single field: device serial number
- Searches `repairs.serial_number` for repairs with status **Completed — Under Warranty**
- Results show: Repair ID, customer name, device, warranty expiry date

**On selecting a result:**
1. Repair status → **Repairing**
2. New row in `repair_history` (status: Repairing, note: "Reopened for warranty claim")
3. Navigate to Repair Detail — technician adds new repair notes for the rework
4. Warranty record itself is untouched — duration and expiry date do not reset

**When rework is complete:**
- Technician manually updates status back to **Completed — Under Warranty** via the existing status modal
- No new invoice or payment is created — this is a warranty rework, not a new billable repair

---

### 7.5 Warranty Expiry Auto-Close

Runs once automatically every time the app starts.

**Logic:**
1. On app startup, query all repairs where `status = 'Completed — Under Warranty'`
2. Join to `warranties`, check if `expiry_date < today`
3. For each expired match:
   - Update `repairs.status` → **Closed**
   - Insert row into `repair_history` (status: Closed, note: "Warranty expired — automatically closed")
4. No popup or alert shown to the technician — this happens silently in the background

**Repairs with no warranty:** stay at **Completed** indefinitely unless manually moved to **Closed** by the technician (manual status update, same as any other transition).

---

### 7.6 WhatsApp Notification — Message Template & Send Logic

**Trigger:** Manual only. Button appears on Repair Detail when status = Ready for Collection. No automatic sends on any status change.

**Fixed message template:**
```
Hi [CUSTOMER_NAME], your device is ready for collection at Saraatek!

🔧 Repair ID: [REPAIR_ID]
💻 Device: [DEVICE_BRAND] [DEVICE_MODEL] ([DEVICE_TYPE])

Please visit us at your convenience to collect it.

📍 [SHOP_ADDRESS]
📞 [SHOP_PHONE]

Thank you for choosing Saraatek!
```
- `[DEVICE_MODEL]` may be blank if not captured at intake — brand is always present (required field)
- All other placeholders pulled directly from `repairs`, `customers`, and `shop_settings`

**Phone number formatting (applied at send time, not stored):**
1. Strip all non-digit characters from `customers.phone`
2. If result starts with `0` → drop the leading `0`, prepend `shop_settings.default_country_code`
3. If result already starts with the country code → use as-is
4. If final result is not 8–12 digits → block send, show inline error: "Invalid phone number — please check customer record"

**On send:**
1. Format phone number (above)
2. Build message from template
3. Call Fonnte API with formatted number + message
4. Insert row into `notifications` (status: 'sent' or 'failed', raw response saved)
5. UI updates to show "Sent ✓ [time]" or the inline error

---

### 7.7 New Rust Commands

| Command | Description |
|---|---|
| `add_photos` | Copies selected/dropped files into the repair's photo folder, inserts `photos` rows |
| `get_photos` | Returns photo list for a repair |
| `delete_photo` | Removes file from disk + deletes `photos` row |
| `open_photos_folder` | Opens the repair's photo folder in Windows Explorer |
| `send_ready_notification` | Formats phone, builds message, calls Fonnte API, inserts `notifications` row |
| `get_notification_history` | Returns past notification sends for a repair |
| `create_warranty` | Insert `warranties` row at invoice time (duration, start date, calculated expiry) |
| `get_warranty` | Get warranty details for a repair |
| `search_repair_by_serial` | Search repairs by device serial number, filtered to Completed — Under Warranty |
| `reopen_warranty_claim` | Update repair status → Repairing, insert `repair_history` row, warranty untouched |
| `check_expired_warranties` | Run on app startup — auto-closes expired warranty repairs |
| `get_field_audit_log` | Returns audit rows for a repair, newest first |

**Total Phase 3 Rust commands: 12**
**Cumulative total: 39 commands (16 Phase 1 + 11 Phase 2 + 12 Phase 3)**

---

### 7.8 Build Order (Recommended)

Build in this order so each step is testable before the next begins.

1. **Database migrations** — create `photos`, `notifications`, `warranties`, `field_audit_log` tables; seed new `shop_settings` keys (`photos_dir`, `fonnte_api_token`, `default_country_code`)
2. **Status values update** — add `Completed — Under Warranty` and `Closed` to status enum/badge colour map across frontend and backend
3. **Photos backend** — `add_photos`, `get_photos`, `delete_photo`, `open_photos_folder` commands + filesystem folder creation logic
4. **Photos UI** — drop zone + file picker, thumbnail grid, lightbox modal, wired into Repair Detail
5. **Field audit log backend** — wire change-detection into existing `update_technician_fields` command, `get_field_audit_log` command
6. **Field audit log UI** — collapsible section on Repair Detail
7. **Warranty backend** — `create_warranty` command, wire into existing invoice generation flow; duration → expiry_date calculation logic
8. **Invoice Builder UI update** — warranty toggle, duration dropdown, custom text input
9. **Invoice PDF update** — print warranty duration + expiry at bottom when applicable
10. **Warranty display + reopen UI** — warranty section on Repair Detail, Warranty Reopen Search screen, `search_repair_by_serial`, `reopen_warranty_claim` commands
11. **Warranty auto-close** — `check_expired_warranties` command, wired to run on app startup
12. **Fonnte integration** — API token setting in Settings screen, `send_ready_notification` command, phone formatting logic
13. **Notification UI** — button + sent/failed state on Repair Detail, `get_notification_history` for "Sent ✓" display

---

### 7.9 Status Transitions Added in Phase 3

| From | To | Trigger |
|---|---|---|
| Repairing / Ready for Collection (with warranty) | Completed — Under Warranty | Payment recorded, warranty was enabled at invoice |
| Completed — Under Warranty | Repairing | Warranty claim reopened (search by serial number) |
| Repairing (post-reopen) | Completed — Under Warranty | Rework complete, manually updated |
| Completed — Under Warranty | Closed | Automatic, on app startup, when `expiry_date < today` |
| Completed (no warranty) | Closed | Manual, technician-triggered |

---

*Document version: Phase 3 build complete. Ready for Phase 4 planning.*

---

## Phase 3 — Complete ✓

### Build Summary

**Tech stack additions:**
- Same Tauri 2 + React 19 + TypeScript + Tailwind CSS v4 + Zustand stack
- 4 new DB tables: `photos`, `notifications`, `warranties`, `field_audit_log`
- 12 new Rust commands (cumulative: 39)
- Added `ureq` crate for Fonnte WhatsApp API calls
- PDF via printpdf — warranty duration + expiry on Invoice PDF

**Screens built / updated (4):**

1. **Invoice Builder — Warranty Toggle** (updated)
   - Checkbox toggle "Give warranty for this repair?" (default: Off)
   - Duration dropdown when On: 1M / 2M / 3M / 6M / 1Y / 2Y / 3Y / 5Y / 10Y / Custom
   - Custom text input (shown when "Custom" selected)
   - Expiry date auto-calculated from duration
   - On "Generate & Print" with warranty: creates `warranties` row, expiry printed on PDF
   - Payment flow automatically uses `Completed — Under Warranty` status when warranty exists

2. **Repair Detail — 4 new sections** (updated)

   **Photos section:**
   - Drop zone + file picker (click to browse)
   - 4-column responsive thumbnail grid
   - Click thumbnail → full-size lightbox modal with prev/next arrows + delete button
   - "Open Photos Folder" button → opens repair folder in Windows Explorer

   **Notification section:**
   - Visible only when status = **Ready for Collection**
   - "Send WhatsApp Notification" button → calls Fonnte API
   - After send: "Sent ✓ [time]" with "Resend" link
   - On failure: inline error message, button remains clickable to retry

   **Warranty section:**
   - Visible only if a `warranties` row exists
   - Read-only display: duration, start date, expiry date, status badge (Active/Expired)
   - "Reopen for Warranty Claim" button when status = `Completed — Under Warranty`

   **Audit Log section (collapsible):**
   - Placed below Status History, visually separated
   - Collapsed by default, "View field change history (N)" toggle
   - Each row: field name, old value → new value, timestamp

3. **Warranty Search** (new screen)
   - Single field: device serial number search
   - Searches `repairs.serial_number` where status = `Completed — Under Warranty`
   - Results show: Repair ID, customer name, device, warranty expiry date
   - "Reopen for Warranty Claim" button → status becomes **Repairing**, navigates to Repair Detail
   - Accessible from Sidebar navigation

4. **Settings — 3 new fields** (updated)
   - Fonnte API Token (password field)
   - Default Country Code (pre-filled: 94)
   - Photos Directory (leave empty for default: `%APPDATA%/saraatek/photos`)

**Database (4 new tables):**

| Table | Columns | Notes |
|---|---|---|
| `photos` | id (PK), repair_id (FK), filename, file_path, uploaded_at | Metadata only; files on disk |
| `notifications` | id (PK), repair_id (FK), type ('ready_for_collection'), status ('sent'/'failed'), fonnte_response, sent_at | One row per send attempt |
| `warranties` | id (PK), repair_id (UNIQUE FK), duration_label, start_date, expiry_date, created_at | One per repair, created at invoice time |
| `field_audit_log` | id (PK), repair_id (FK), field_name, old_value, new_value, changed_at | Tracks 6 technician-editable fields |

**Shop settings seed data updated:**
- 3 new keys: `photos_dir` (''), `fonnte_api_token` (''), `default_country_code` ('94')
- Total: 14 seed rows (was 11)

**Rust commands (12 new, 39 cumulative):**

| Command | Module | Description |
|---|---|---|
| `add_photos` | `photos.rs` | Copies files into repair's photo folder, inserts `photos` rows |
| `get_photos` | `photos.rs` | Returns photo list for a repair |
| `delete_photo` | `photos.rs` | Removes file from disk + deletes `photos` row |
| `open_photos_folder` | `photos.rs` | Ensures folder exists, spawns Explorer at the path |
| `send_ready_notification` | `notifications.rs` | Formats phone, builds message, calls Fonnte API, inserts `notifications` row |
| `get_notification_history` | `notifications.rs` | Returns past notification sends for a repair |
| `create_warranty` | `warranties.rs` | Insert `warranties` row at invoice time (duration, start date, calculated expiry) |
| `get_warranty` | `warranties.rs` | Get warranty details for a repair |
| `search_repair_by_serial` | `warranties.rs` | Search repairs by device serial number, filtered to active warranties |
| `reopen_warranty_claim` | `warranties.rs` | Update repair status → Repairing, insert `repair_history` row, warranty untouched |
| `check_expired_warranties` | `warranties.rs` | Run on app startup — auto-closes expired warranty repairs |
| `get_field_audit_log` | `audit.rs` | Returns audit rows for a repair, newest first |

**Existing commands modified:**

| Command | Change |
|---|---|
| `record_payment` | Now checks for warranty → uses `Completed — Under Warranty` instead of `Completed` |
| `update_technician_fields` | Detects changes to 6 tracked fields, writes old/new values to `field_audit_log` |

**Frontend types added:**

| Type | Fields |
|---|---|
| `Photo` | id, repair_id, filename, file_path, uploaded_at |
| `Notification` | id, repair_id, type, status, fonnte_response \| null, sent_at |
| `Warranty` | id, repair_id, duration_label, start_date, expiry_date, created_at |
| `WarrantyWithRepair` | warranty: Warranty + customer_name, device_brand, device_model, serial_number |
| `CreateWarrantyInput` | repair_id, duration_label, start_date, expiry_date |
| `FieldAuditEntry` | id, repair_id, field_name, old_value \| null, new_value \| null, changed_at |

**WhatsApp notification (Fonnte):**

- **Template:** Includes customer name, shop name, Repair ID, device details (brand/model/type), shop address, shop phone
- **Emojis:** 🔧 Repair ID, 💻 Device, 📍 shop address, 📞 shop phone
- **Phone formatting:** Strip non-digits, drop leading `0` + prepend country code, validate 8–12 digits
- **API:** POST to `https://api.fonnte.com/send` with Authorization header
- **Logging:** Each send attempt logged in `notifications` table with raw API response

**Warranty auto-close:**

- Runs silently on app startup via `lib.rs` setup
- Finds all repairs with status `Completed — Under Warranty` where `expiry_date < today`
- Updates status → `Closed`, inserts `repair_history` entry: "Warranty expired — automatically closed"
- No popup or alert shown

**Status transitions added in Phase 3:**

| From | To | Trigger |
|---|---|---|
| Repairing / Ready for Collection (with warranty) | Completed — Under Warranty | Payment recorded, warranty was enabled at invoice |
| Completed — Under Warranty | Repairing | Warranty claim reopened (search by serial number) |
| Repairing (post-reopen) | Completed — Under Warranty | Rework complete, manually updated |
| Completed — Under Warranty | Closed | Automatic, on app startup, when `expiry_date < today` |
| Completed (no warranty) | Closed | Manual, technician-triggered |

**Build status:**
- `cargo test` — 50/50 pass (0 failed, 0 warnings)
- `npx tsc --noEmit` — zero errors
- `cargo build` — zero errors, zero warnings
- **Phase 1 ✅ | Phase 2 ✅ | Phase 3 ✅**

---

## 8. Phase 4 — Full Detailed Plan

---

### 8.1 Overview

Phase 4 adds business intelligence and light AI-assisted communication on top of the existing repair/document/payment/photo/warranty flow. Nothing in Phases 1–3 changes structurally. Phase 4 is split into two sub-phases:

- **4a — Reporting** (build first): pure SQL aggregation over existing tables, zero external dependency, zero cost. No new tables.
- **4b — AI Assistance** (build second): AI-drafted WhatsApp messages and AI customer history summaries, powered by a free model on OpenRouter. New `shop_settings` keys only — no new core tables beyond a couple of small additions.

**Explicitly dropped from the original Phase 4 scope (decided during planning):**
- AI-suggested technician findings — not needed, technicians are the domain experts, not the AI
- Overdue/pending repair alerts — not needed

**Key decision — free-form AI messages are always repair-linked.** There is no "send a fully generic message" mode. Every AI-drafted message is generated using a specific repair's context (customer, device, status, notes) and every send is logged against that `repair_id` in `notifications`, same as Phase 3. This keeps every message auditable and ensures the AI always has real context to draft from — a real shop has no use case for messaging a customer about nothing.

---

### 8.2 Sub-phase 4a — Reporting & Dashboard

#### 8.2.1 New Screen — Reports

Accessible from Sidebar navigation, alongside Dashboard and Warranty Search.

**Date range control (top of screen):**
- Quick presets: This Month / Last Month / Last 3 Months / This Year
- Custom range: start date + end date pickers
- All cards below recalculate when range changes

**Revenue card:**
- Total revenue (sum of `payments.amount`) for the selected range
- Bar chart: revenue by month within the range
- Breakdown by payment method (cash vs bank transfer) — small split shown beneath the total

**Repair volume card:**
- Total repairs created in range
- Bar chart: count by status (Received, Repairing, Awaiting Approval, Ready for Collection, Completed, Completed — Under Warranty, Declined, Cancelled, Closed)
- Individual vs Business split

**Technician performance table:**
- One row per active technician
- Columns: Technician name, Repairs assigned (in range), Repairs completed (in range), Avg. days Received → Completed, Total revenue generated (sum of payments on repairs assigned to them)
- Sortable by any column
- Inactive technicians excluded by default, with a toggle to include them

All data is derived entirely from existing tables (`repairs`, `payments`, `repair_history`, `technicians`) — no new tables required for 4a.

---

#### 8.2.2 New Rust Commands (4a)

| Command | Description |
|---|---|
| `get_revenue_report` | (start_date, end_date) → revenue total, monthly breakdown, payment method split |
| `get_repair_volume_report` | (start_date, end_date) → counts by status, Individual/Business split |
| `get_technician_performance` | (start_date, end_date, include_inactive: bool) → per-technician stats table |
| `get_reports_summary` | Convenience wrapper returning all three above in one call, used to populate the Reports screen in a single round trip |

**Total 4a Rust commands: 4**

---

#### 8.2.3 Build Order (4a)

1. **Report queries** — write and test the three SQL aggregation functions directly against existing tables
2. **Rust commands** — wrap queries as Tauri commands, add `get_reports_summary` convenience wrapper
3. **Reports screen UI** — date range control, revenue card, volume card, technician table
4. **Charts** — wire up bar charts for revenue-by-month and volume-by-status
5. **Sidebar entry** — add "Reports" navigation item

---

### 8.3 Sub-phase 4b — AI Assistance (OpenRouter)

#### 8.3.1 AI Provider Decision

Uses **OpenRouter**, calling a free-tier (`:free`) model, to keep this phase at zero ongoing API cost. Same `ureq` HTTP-call pattern already used for Fonnte in Phase 3 — OpenRouter's `/chat/completions` endpoint is OpenAI-compatible.

**Known trade-offs of free models (worth knowing before relying on this in daily shop use):**
- Lower rate limits (shared free-tier pool — may need retry/backoff handling)
- Free models are rotated/deprecated more often than paid ones, so the model identifier may need updating periodically
- Output quality is sufficient for drafting short WhatsApp messages and summarizing repair history, but not guaranteed to match a paid frontier model

**`shop_settings` new keys:**

| key | Example value | Description |
|---|---|---|
| openrouter_api_key | (token string) | API key for OpenRouter account |
| openrouter_model | meta-llama/llama-3.1-8b-instruct:free | Editable text field (not dropdown) since free model availability shifts over time |

---

#### 8.3.2 Update: Repair Detail — Notification Section (extends Phase 3)

The existing "Send WhatsApp Notification" button (visible when status = Ready for Collection) gains a second option alongside the fixed-template send:

- **"Send Fixed Template"** — existing Phase 3 behaviour, unchanged
- **"Draft with AI"** — sends repair context (device, customer name, technician notes) to the OpenRouter model, asking for a natural variation of the same ready-for-collection message. Result appears in an editable text box. Technician can edit freely, then "Send" or "Cancel". Never auto-sent.

---

#### 8.3.3 New Screen / Modal — AI Message Composer (free-form)

Accessible from Repair Detail (new button: "Draft a Message") — always opened from within a specific repair's context, never as a standalone/global tool.

**Context shown (read-only, pulled automatically):**
- Customer name, phone
- Device (brand + model)
- Current status

**Input:**
- "What do you want to tell the customer?" — free text field, e.g. "tell him the part is delayed, available next Tuesday"
- "Draft Message" button

**On draft:**
- Sends the goal + repair context to OpenRouter, receives a drafted WhatsApp message
- Drafted message appears in an editable text box

**Actions:**
- "Send" — formats phone number (same logic as Phase 3), sends via Fonnte, logs to `notifications` with `type = 'custom'`, repair_id always attached
- "Regenerate" — re-drafts with the same goal (in case the first draft isn't good)
- "Cancel" — discards, no send

---

#### 8.3.4 New Section — Repair Detail / Customer History (returning customers)

Visible when the customer (matched by `customer_id`) has more than one repair on record.

- **"Summarize History"** button
- On click: pulls all past repairs for this `customer_id` (device, problem, dates, outcomes) and asks the OpenRouter model for a 2–3 sentence summary — recurring issues, last visit date, any pattern worth knowing before starting this repair
- Summary shown inline, **not stored in the database** — regenerated on demand each time, since history changes as new repairs are added

---

#### 8.3.5 New Rust Commands (4b)

| Command | Description |
|---|---|
| `draft_notification_message` | (repair_id, mode: 'template' \| 'freeform', goal: Option\<String\>) → calls OpenRouter, returns drafted message text |
| `send_custom_notification` | (repair_id, message: String) → formats phone (reuses Phase 3 logic), sends via Fonnte, inserts `notifications` row with type='custom' |
| `summarize_customer_history` | (customer_id) → pulls past repairs, calls OpenRouter, returns summary text (not persisted) |
| `save_openrouter_settings` | (api_key, model) → saves both keys to `shop_settings` |

**Total 4b Rust commands: 4**
**Total Phase 4 Rust commands: 8 (4a + 4b)**
**Cumulative total: 47 commands (16 Phase 1 + 11 Phase 2 + 12 Phase 3 + 8 Phase 4)**

---

#### 8.3.6 Database Changes (4b)

No new tables. Two small additions only:

- `shop_settings` — new keys: `openrouter_api_key`, `openrouter_model`
- `notifications.type` — gains a new allowed value `'custom'` (existing column, no schema migration needed — `type` is already free-text `TEXT`)

---

#### 8.3.7 Update: Settings Screen

New field group: **AI Assistant (OpenRouter)**
- OpenRouter API Token (password field)
- Model name (text input, pre-filled with a working free model identifier, editable in case it gets deprecated)

---

### 8.4 Build Order (Recommended) — Full Phase 4

1. **4a — Report queries** — revenue, volume, technician performance SQL functions
2. **4a — Rust commands** — wrap as Tauri commands + `get_reports_summary`
3. **4a — Reports screen** — date range, cards, charts, sidebar entry
4. **4b — Database** — seed `openrouter_api_key`, `openrouter_model` into `shop_settings`
5. **4b — Settings UI** — AI Assistant field group
6. **4b — OpenRouter client** — shared Rust helper for calling the chat completions endpoint, used by all three AI commands
7. **4b — `draft_notification_message`** — template mode first (lower risk, reuses known-good Phase 3 message shape)
8. **4b — Notification section update** — "Draft with AI" option alongside existing fixed-template send
9. **4b — `draft_notification_message`** — free-form mode (goal-based)
10. **4b — AI Message Composer screen/modal** — context display, goal input, draft/edit/send/regenerate
11. **4b — `send_custom_notification`** — wire to Fonnte send + `notifications` logging
12. **4b — `summarize_customer_history`** — query + OpenRouter call
13. **4b — Customer History section** — "Summarize History" button on Repair Detail, shown only for returning customers

---

### 8.5 Status Values / Transitions Added in Phase 4

None. Phase 4 introduces no new repair statuses and no new status transitions — it is purely additive (reporting + communication assistance) on top of the existing status flow from Phases 1–3.

---

*Document version: Phase 4 build complete. All 4 phases delivered.*

---

## Phase 4 — Complete ✓

### Build Summary

**Tech stack additions:**
- Same Tauri 2 + React 19 + TypeScript + Tailwind CSS v4 + Zustand stack
- No new crate dependencies (ureq already added in Phase 3 for Fonnte)
- 2 new shop_settings keys (cumulative: 16 seed rows)
- 8 new Rust commands (cumulative: 47)

**4a — Reporting (4 commands, 1 new screen):**

1. **Reports screen** (new)
   - Date range presets: This Month / Last Month / Last 3 Months / This Year + custom date pickers
   - Revenue card: total RM, monthly bar chart (CSS bars via Tailwind, no external chart library), breakdown by payment method (cash vs bank transfer)
   - Volume card: total repair count, status distribution bar chart, Individual vs Business split
   - Technician Performance table: sortable columns (repairs assigned, completed, avg days, total revenue), include-inactive toggle
   - Accessible from Sidebar navigation (new nav item: "Reports")

2. **Rust commands (4a):**
   - `get_revenue_report` — (start_date, end_date) → RevenueReport: total, count, monthly Vec, by_method Vec
   - `get_repair_volume_report` — (start_date, end_date) → VolumeReport: total, by_status Vec, by_type Vec
   - `get_technician_performance` — (start_date, end_date, include_inactive) → Vec\<TechnicianPerf\>
   - `get_reports_summary` — convenience wrapper returning all three above in one call, frontend calls this once to populate the Reports screen

**4b — AI Assistance (4 commands, OpenRouter free tier):**

3. **OpenRouter helper** (`openrouter.rs`)
   - Shared `call_openrouter(system_prompt, user_prompt, api_key, model)` function using ureq
   - Endpoint: `https://openrouter.ai/api/v1/chat/completions`
   - Configurable model via shop_settings.openrouter_model

4. **Notification section update** (Repair Detail — extends Phase 3)
   - Existing "Send WhatsApp Notification" split into two options:
     - "Send Fixed Template" — original Phase 3 behaviour, unchanged
     - "Draft with AI" — sends repair context (device, customer name, technician notes) to OpenRouter, asks for a natural variation of the ready-for-collection message. Result appears in editable text box. Never auto-sent.

5. **AI Message Composer** (modal, accessible from Repair Detail)
   - Context shown (read-only): customer name/phone, device, current status
   - Free-text goal input: "What do you want to tell the customer?"
   - "Draft Message" → sends goal + repair context to OpenRouter → drafted message in editable textarea
   - Actions: "Send" (Fonnte + notifications log with type='custom'), "Regenerate", "Cancel"

6. **Customer History section** (Repair Detail)
   - Visible only when customer (matched by customer_id) has more than 1 repair on record
   - "Summarize History" button → pulls all past repairs → calls OpenRouter → 2-3 sentence summary
   - Summary shown inline, not stored in database, regenerated on demand

7. **Settings — AI Assistant (OpenRouter)** (updated)
   - OpenRouter API Token (password field)
   - Model Name (text input, pre-filled with a working free model identifier, editable)

8. **Rust commands (4b):**
   - `draft_notification_message` — (repair_id, mode: 'template' | 'freeform', goal: Option\<String\>) → calls OpenRouter, returns drafted message text
   - `send_custom_notification` — (repair_id, message: String) → formats phone (reuses Phase 3 logic), sends via Fonnte, inserts notifications row with type='custom'
   - `summarize_customer_history` — (customer_id) → pulls past repairs, calls OpenRouter, returns summary text (not persisted)
   - Reuses `format_phone()` and Fonnte send-save logic from Phase 3 notifications.rs

**Database changes:**
- No new tables
- 2 new shop_settings keys: `openrouter_api_key` (''), `openrouter_model` ('meta-llama/llama-3.1-8b-instruct:free')
- Total shop_settings seed rows: 16 (was 14)
- notifications.type gains a new allowed value 'custom' (no schema migration needed — type is already free-text TEXT)

**Rust commands (8 new, 47 cumulative):**

| Command | Module | Description |
|---|---|---|
| `get_revenue_report` | reports.rs | Revenue total, monthly breakdown, method split |
| `get_repair_volume_report` | reports.rs | Counts by status, Individual/Business split |
| `get_technician_performance` | reports.rs | Per-technician assigned/completed/avg days/revenue |
| `get_reports_summary` | reports.rs | Convenience: all three above in one call |
| `draft_notification_message` | ai_messaging.rs | OpenRouter draft (template or free-form mode) |
| `send_custom_notification` | ai_messaging.rs | Fonnte send with type='custom' logging |
| `summarize_customer_history` | ai_messaging.rs | OpenRouter summary of past repairs |

**Frontend types added:**

| Type | Fields |
|---|---|
| `RevenueReport` | total, count, monthly: {month, amount}[], by_method: {method, amount}[] |
| `VolumeReport` | total, by_status: {status, count}[], by_type: {customer_type, count}[] |
| `TechnicianPerf` | technician_name, repairs_assigned, repairs_completed, avg_days, total_revenue |
| `ReportsSummary` | revenue: RevenueReport, volume: VolumeReport, technician_performance: TechnicianPerf[] |

**Build status:**
- `cargo test` — 61/61 pass (0 failed, 0 warnings)
- `npx tsc --noEmit` — zero errors
- `cargo clippy --all-targets -- -D warnings` — zero warnings
- `cargo build` — zero errors, zero warnings
- **Phase 1 ✅ | Phase 2 ✅ | Phase 3 ✅ | Phase 4 ✅**

---

## All Phases — Complete ✓

The entire SaraaTEK Repair Management System has been built across 4 phases:

| Phase | Rust commands | DB tables | Screens | Key features | Status |
|---|---|---|---|---|---|
| **Phase 1** — Core Repair | 16 | 6 | 6 | Customer intake, repair CRUD, status tracking, technician assignment, intake PDF, settings | ✅ |
| **Phase 2** — Documents & Payment | 11 (27 total) | 3 new (9 total) | +2 | Quotation builder, approval/decline flow, invoice builder, payment recording, professional PDFs | ✅ |
| **Phase 3** — Photos, Warranty & Fonnte | 12 (39 total) | 4 new (13 total) | +1 | Photo uploads, Fonnte WhatsApp, warranty tracking, auto-close, field audit log | ✅ |
| **Phase 4a** — Reporting | 4 (43 total) | 0 new | +1 | Revenue/volume reports, technician performance table, date range controls | ✅ |
| **Phase 4b** — AI Assistance | 3 (46 total) + 1 shared helper | 0 new (+2 settings) | +1 modal | OpenRouter drafting, custom messaging, customer history summary | ✅ |
| **Total** | **47** | **13 tables** | **10 screens** | — | **All complete** |
