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
