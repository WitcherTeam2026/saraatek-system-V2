export interface Customer {
  id: number
  type: 'individual' | 'business'
  name: string
  phone: string
  email: string | null
  company_name: string | null
  address: string | null
  created_at: string
}

export interface CreateCustomerInput {
  type: string
  name: string
  phone: string
  email: string | null
  company_name: string | null
  address: string | null
}

export interface Repair {
  id: string
  customer_id: number
  status: string
  device_type: string | null
  brand: string | null
  model: string | null
  serial_number: string | null
  color_desc: string | null
  reported_problem: string | null
  technician_id: number | null
  tech_findings: string | null
  recommended_action: string | null
  parts_required: string | null
  estimated_cost: number | null
  repair_notes: string | null
  parts_used: string | null
  received_at: string
  updated_at: string | null
  completed_at: string | null
}

export interface RepairWithCustomer {
  repair: Repair
  customer_name: string
  customer_phone: string
  customer_address: string
  customer_type: string
  technician_name: string | null
}

export interface CreateRepairInput {
  customer_id: number
  device_type: string | null
  brand: string
  model: string | null
  serial_number: string | null
  color_desc: string | null
  reported_problem: string
}

export interface RepairHistory {
  id: number
  repair_id: string
  status: string
  note: string | null
  changed_at: string
}

export interface Technician {
  id: number
  name: string
  phone: string | null
  active: boolean
}

export interface RepairFilter {
  search?: string
  status?: string[]
  technician_id?: number
  customer_type?: string
  date_from?: string
  date_to?: string
  sort_by?: string
  sort_order?: string
}

export type StatusColor = 'gray' | 'amber' | 'blue' | 'purple' | 'green' | 'red'

export const STATUS_CONFIG: Record<string, { label: string; color: StatusColor }> = {
  Received: { label: 'Received', color: 'gray' },
  'Awaiting Approval': { label: 'Awaiting Approval', color: 'amber' },
  Repairing: { label: 'Repairing', color: 'blue' },
  'Ready for Collection': { label: 'Ready for Collection', color: 'purple' },
  Completed: { label: 'Completed', color: 'green' },
  'Completed — Under Warranty': { label: 'Completed — Under Warranty', color: 'green' },
  Declined: { label: 'Declined', color: 'red' },
  Cancelled: { label: 'Cancelled', color: 'red' },
  Closed: { label: 'Closed', color: 'gray' },
}

export interface QuotationItem {
  id: number
  repair_id: string
  document_type: string
  sort_order: number
  description: string
  item_type: string
  device_name: string | null
  serial_number: string | null
  unit_price: number
  qty: number
  total: number
}

export interface Quotation {
  id: number
  repair_id: string
  status: string
  subtotal: number
  tax: number
  grand_total: number
  generated_at: string
  responded_at: string | null
  response_note: string | null
}

export interface QuotationWithItems {
  quotation: Quotation
  items: QuotationItem[]
}

export interface CreateQuotationItemInput {
  sort_order: number
  description: string
  item_type: string
  device_name: string | null
  serial_number: string | null
  unit_price: number
  qty: number
}

export interface CreateQuotationInput {
  repair_id: string
  items: CreateQuotationItemInput[]
}

export interface Payment {
  id: number
  repair_id: string
  amount: number
  method: string
  paid_at: string
  note: string | null
}

export interface RecordPaymentInput {
  repair_id: string
  amount: number
  method: string
  note?: string | null
}

export interface Photo {
  id: number
  repair_id: string
  filename: string
  file_path: string
  uploaded_at: string
}

export interface Notification {
  id: number
  repair_id: string
  type: string
  status: string
  fonnte_response: string | null
  sent_at: string
  channel: string
}

export interface Warranty {
  id: number
  repair_id: string
  duration_label: string
  start_date: string
  expiry_date: string
  created_at: string
}

export interface WarrantyWithRepair {
  warranty: Warranty
  customer_name: string
  device_brand: string
  device_model: string | null
  serial_number: string | null
}

export interface CreateWarrantyInput {
  repair_id: string
  duration_label: string
  start_date: string
  expiry_date: string
}

export interface FieldAuditEntry {
  id: number
  repair_id: string
  field_name: string
  old_value: string | null
  new_value: string | null
  changed_at: string
}

export interface MonthlyRevenue {
  month: string
  amount: number
}
export interface MethodSplit {
  method: string
  amount: number
}
export interface RevenueReport {
  total: number
  count: number
  monthly: MonthlyRevenue[]
  by_method: MethodSplit[]
}
export interface StatusCount {
  status: string
  count: number
}
export interface TypeSplit {
  customer_type: string
  count: number
}
export interface VolumeReport {
  total: number
  by_status: StatusCount[]
  by_type: TypeSplit[]
}
export interface TechnicianPerf {
  technician_name: string
  repairs_assigned: number
  repairs_completed: number
  avg_days: number
  total_revenue: number
}
export interface ReportsSummary {
  revenue: RevenueReport
  volume: VolumeReport
  technician_performance: TechnicianPerf[]
}

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  Received: ['Awaiting Approval', 'Repairing', 'Cancelled'],
  'Awaiting Approval': ['Repairing', 'Declined', 'Cancelled'],
  Repairing: ['Ready for Collection', 'Cancelled'],
  'Ready for Collection': ['Completed', 'Cancelled'],
  Completed: ['Closed'],
  'Completed — Under Warranty': ['Repairing', 'Closed'],
  Declined: [],
  Cancelled: [],
  Closed: [],
}

// Phase 6: CRM Types

export interface Company {
  id: number
  name: string
  phone: string
  email: string | null
  address: string | null
  tax_id: string | null
  registration_number: string | null
  website: string | null
  industry: string | null
  notes: string | null
  tags: string | null
  credit_terms: string | null
  credit_limit: number
  created_at: string
  updated_at: string
}

export interface CreateCompanyInput {
  name: string
  phone: string
  email?: string | null
  address?: string | null
  tax_id?: string | null
  registration_number?: string | null
  website?: string | null
  industry?: string | null
  notes?: string | null
  tags?: string | null
  credit_terms?: string | null
  credit_limit?: number | null
}

export interface CompanyFilter {
  search?: string
  industry?: string
  tags?: string
}

export interface Contact {
  id: number
  company_id: number
  name: string
  position: string | null
  phone: string
  email: string | null
  is_primary: boolean
  notes: string | null
  created_at: string
}

export interface CreateContactInput {
  company_id: number
  name: string
  position?: string | null
  phone: string
  email?: string | null
  is_primary?: boolean | null
  notes?: string | null
}

export interface Communication {
  id: number
  company_id: number
  contact_id: number | null
  repair_id: string | null
  channel: string
  direction: string
  subject: string | null
  message: string
  status: string | null
  sent_by: string | null
  created_at: string
}

export interface LogCommunicationInput {
  company_id: number
  contact_id?: number | null
  repair_id?: string | null
  channel: string
  direction: string
  subject?: string | null
  message: string
  status?: string | null
  sent_by?: string | null
}

// Phase 7: Auth Types

export interface User {
  id: number
  username: string
  name: string
  role: 'admin' | 'manager' | 'technician' | 'front_desk'
  is_active: boolean
  last_login: string | null
  created_at: string
}

export interface Session {
  id: number
  user_id: number
  token: string
  expires_at: string
  created_at: string
}

export interface LoginInput {
  username: string
  password: string
}

export interface LoginResult {
  user: User
  session: Session
}

export interface CreateUserInput {
  username: string
  password: string
  name: string
  role?: string
  pin?: string
}

export interface BackupInfo {
  path: string
  size: number
  created_at: string
}

// ── Accounting Types ───────────────────────────────────────────────

export interface Account {
  id: number
  code: string
  name: string
  account_type: 'asset' | 'liability' | 'equity' | 'income' | 'cogs' | 'expense'
  parent_id: number | null
  is_active: boolean
}

export interface JournalEntry {
  id: number
  entry_date: string
  description: string
  source_type: string | null
  source_id: string | null
  is_posted: boolean
  created_at: string
}

export interface JournalItem {
  id: number
  entry_id: number
  account_id: number
  account_code: string
  account_name: string
  debit: number
  credit: number
  note: string | null
}

export interface JournalEntryWithItems {
  entry: JournalEntry
  items: JournalItem[]
}

export interface LedgerEntry {
  date: string
  description: string
  debit: number
  credit: number
  balance: number
  entry_id: number
}

export interface AccountBalance {
  account_id: number
  code: string
  name: string
  account_type: string
  balance: number
}

export interface AccountLine {
  code: string
  name: string
  balance: number
}

export interface ProfitLossReport {
  revenue: AccountLine[]
  total_revenue: number
  cogs: AccountLine[]
  total_cogs: number
  gross_profit: number
  period_start: string
  period_end: string
}

export interface BalanceSheetReport {
  assets: AccountLine[]
  total_assets: number
  liabilities: AccountLine[]
  total_liabilities: number
  equity: AccountLine[]
  total_equity: number
  as_of_date: string
}

export interface CreateJournalEntryInput {
  entry_date: string
  description: string
  source_type?: string
  source_id?: string
  items: JournalItemInput[]
}

export interface JournalItemInput {
  account_id: number
  debit: number
  credit: number
  note?: string
}

export interface OpeningBalanceInput {
  account_id: number
  balance: number
}

// ── Phase 10: Advanced Analytics Types ─────────────────────────────

export interface RevenueAnalytics {
  monthly_trend: MonthlyRevenue[]
  growth_rate: number
  avg_monthly: number
  best_month: MonthlyRevenue | null
  worst_month: MonthlyRevenue | null
  by_payment_method: MethodSplit[]
}

export interface RepairAnalytics {
  total_repairs: number
  avg_duration_days: number
  by_brand: BrandCount[]
  by_status: StatusCount[]
  by_device_type: DeviceTypeCount[]
  common_issues: IssueCount[]
}

export interface BrandCount {
  brand: string
  count: number
}

export interface DeviceTypeCount {
  device_type: string
  count: number
}

export interface IssueCount {
  issue: string
  count: number
}

export interface CustomerAnalytics {
  total_customers: number
  new_customers: number
  repeat_customers: number
  repeat_rate: number
  avg_repairs_per_customer: number
  top_customers: TopCustomer[]
}

export interface TopCustomer {
  name: string
  phone: string
  repair_count: number
  total_spent: number
}

export interface WarrantyAnalytics {
  total_warranties: number
  active_warranties: number
  expired_warranties: number
  claims: number
  claim_rate: number
  avg_warranty_duration_days: number
  by_status: WarrantyStatusCount[]
}

export interface WarrantyStatusCount {
  status: string
  count: number
}

// ── Phase 12: Communications Types ─────────────────────────────────

export interface IncomingMessage {
  id: number
  repair_id: string | null
  customer_phone: string
  customer_name: string | null
  message: string
  channel: string
  direction: string
  status: string
  received_at: string
}

export interface ProcessIncomingInput {
  customer_phone: string
  message: string
  channel: string
  repair_id?: string
}

export interface Campaign {
  id: number
  name: string
  message: string
  channel: string
  status: string
  total_recipients: number
  sent_count: number
  failed_count: number
  created_at: string
}

export interface CampaignRecipient {
  id: number
  campaign_id: number
  customer_id: number
  customer_name: string
  customer_phone: string
  status: string
  sent_at: string | null
}

export interface CreateCampaignInput {
  name: string
  message: string
  channel: string
  customer_ids?: number[]
  send_to_all?: boolean
}

export interface SmsConfig {
  provider: string
  api_key: string
  api_url: string
  sender_id: string
}

export interface SmsResult {
  success: boolean
  message_id: string | null
  error: string | null
}

// ── Phase 13: Document Management Types ─────────────────────────────

export interface DocumentTemplate {
  id: number
  name: string
  template_type: string
  content: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface DocumentVersion {
  id: number
  document_type: string
  document_id: number
  version: number
  content: string
  changes: string | null
  created_by: number | null
  created_at: string
}

export interface Signature {
  id: number
  repair_id: string | null
  customer_name: string
  signature_data: string
  signed_at: string
}

export interface LetterheadSettings {
  id: number
  logo_path: string | null
  company_name: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  primary_color: string
  secondary_color: string
}

export interface CreateTemplateInput {
  name: string
  template_type: string
  content: string
  is_default?: boolean
}

export interface SaveSignatureInput {
  repair_id?: string
  customer_name: string
  signature_data: string
}

// Cloud Sync Types
export interface SupabaseSettings {
  url: string
  anon_key: string
  service_role_key: string
  database_password: string
  is_enabled: boolean
}

export interface SyncStatus {
  device_id: string
  last_sync: string | null
  pending_changes: number
  is_connected: boolean
}

export interface SyncRecord {
  id: string
  table_name: string
  record_id: string
  action: string
  old_value: any | null
  new_value: any | null
  synced_at: string
  sync_status: string
}

// Database Monitor Types
export interface DatabaseStats {
  total_tables: number
  total_records: Record<string, number>
  database_size: string
  last_backup: string | null
  sync_status: string | null
  cloud_status: string | null
}

export interface DatabaseHealth {
  is_healthy: boolean
  connection_count: number
  uptime_seconds: number
  warnings: string[]
  errors: string[]
}

export interface TableInfo {
  name: string
  row_count: number
  size_bytes: number
  size_human: string
  last_modified: string | null
}
