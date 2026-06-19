import { invoke } from '@tauri-apps/api/core'
import type {
  Customer, CreateCustomerInput,
  Repair, RepairWithCustomer, CreateRepairInput, RepairFilter, RepairHistory,
  Technician,
  QuotationWithItems, CreateQuotationInput, CreateQuotationItemInput, QuotationItem,
  Payment, RecordPaymentInput,
  Photo, Notification, Warranty, WarrantyWithRepair, CreateWarrantyInput, FieldAuditEntry,
} from '../types'

export const api = {
  customers: {
    search: (phone: string) => invoke<Customer | null>('search_customer', { phone }),
    create: (input: CreateCustomerInput) => invoke<Customer>('create_customer', { input }),
    updateAddress: (customerId: number, address: string) =>
      invoke<Customer>('update_customer_address', { customerId, address }),
  },

  repairs: {
    generateId: () => invoke<string>('generate_new_repair_id'),
    create: (input: CreateRepairInput) => invoke<Repair>('create_repair', { input }),
    get: (id: string) => invoke<RepairWithCustomer | null>('get_repair', { id }),
    list: (filter: RepairFilter) => invoke<RepairWithCustomer[]>('list_repairs', { filter }),
    updateStatus: (repairId: string, newStatus: string, note?: string) =>
      invoke<void>('update_repair_status', { input: { repair_id: repairId, new_status: newStatus, note } }),
    updateTechnicianFields: (input: {
      repair_id: string
      technician_id?: number | null
      tech_findings?: string | null
      recommended_action?: string | null
      parts_required?: string | null
      estimated_cost?: number | null
      repair_notes?: string | null
      parts_used?: string | null
    }) => invoke<void>('update_technician_fields', { input }),
    history: (repairId: string) => invoke<RepairHistory[]>('get_repair_history', { repairId }),
    dashboardCounts: () => invoke<{
      open_repairs: number
      awaiting_approval: number
      repairing: number
      ready_for_collection: number
    }>('get_dashboard_counts'),
  },

  settings: {
    getAll: () => invoke<Record<string, string>>('get_all_settings'),
    save: (key: string, value: string) => invoke<void>('save_setting', { key, value }),
  },

  payments: {
    record: (input: RecordPaymentInput) => invoke<Payment>('record_payment', { input }),
    get: (repairId: string) => invoke<Payment | null>('get_payment', { repairId }),
  },

  quotations: {
    create: (input: CreateQuotationInput) => invoke<QuotationWithItems>('create_quotation', { input }),
    get: (id: number) => invoke<QuotationWithItems | null>('get_quotation', { id }),
    getByRepair: (repairId: string) => invoke<QuotationWithItems | null>('get_quotation_by_repair', { repairId }),
    approve: (id: number, responseNote?: string) =>
      invoke<QuotationWithItems>('approve_quotation', { id, responseNote: responseNote || null }),
    decline: (id: number, responseNote?: string) =>
      invoke<QuotationWithItems>('decline_quotation', { id, responseNote: responseNote || null }),
    createInvoiceItems: (repairId: string, items: CreateQuotationItemInput[]) =>
      invoke<QuotationItem[]>('create_invoice_items', { repairId, items }),
    getInvoiceItems: (repairId: string) =>
      invoke<QuotationItem[]>('get_invoice_items', { repairId }),
  },

  pdf: {
    generateIntakePdf: (repairId: string, saveAs: boolean) =>
      invoke<string>('generate_intake_pdf', { repairId, saveAs }),
    generateQuotationPdf: (repairId: string, saveAs: boolean) =>
      invoke<string>('generate_quotation_pdf_file', { repairId, saveAs }),
    generateInvoicePdf: (repairId: string, saveAs: boolean) =>
      invoke<string>('generate_invoice_pdf_file', { repairId, saveAs }),
  },

  technicians: {
    list: () => invoke<Technician[]>('list_technicians'),
    create: (name: string, phone?: string) =>
      invoke<Technician>('create_technician', { input: { name, phone: phone || null } }),
    toggleActive: (id: number) => invoke<void>('toggle_technician_active', { id }),
  },

  photos: {
    add: (repairId: string, fileNames: string[]) =>
      invoke<Photo[]>('add_photos', { repairId, fileNames }),
    get: (repairId: string) => invoke<Photo[]>('get_photos', { repairId }),
    delete: (photoId: number) => invoke<void>('delete_photo', { photoId }),
    openFolder: (repairId: string) => invoke<string>('open_photos_folder', { repairId }),
  },

  notifications: {
    sendReady: (repairId: string) => invoke<Notification>('send_ready_notification', { repairId }),
    history: (repairId: string) => invoke<Notification[]>('get_notification_history', { repairId }),
  },

  warranties: {
    create: (input: CreateWarrantyInput) => invoke<Warranty>('create_warranty', { input }),
    get: (repairId: string) => invoke<Warranty | null>('get_warranty', { repairId }),
    searchBySerial: (serialNumber: string) =>
      invoke<WarrantyWithRepair[]>('search_repair_by_serial', { serialNumber }),
    reopen: (repairId: string) => invoke<void>('reopen_warranty_claim', { repairId }),
    checkExpired: () => invoke<number>('check_expired_warranties'),
  },

  audit: {
    getLog: (repairId: string) => invoke<FieldAuditEntry[]>('get_field_audit_log', { repairId }),
  },

  reports: {
    summary: (startDate: string, endDate: string, includeInactive: boolean) =>
      invoke<import('../types').ReportsSummary>('get_reports_summary', {
        startDate, endDate, includeInactive,
      }),
  },

  ai: {
    draftMessage: (repairId: string, mode: string, goal?: string) =>
      invoke<string>('draft_notification_message', { repairId, mode, goal: goal || null }),
    sendCustom: (repairId: string, message: string) =>
      invoke<Notification>('send_custom_notification', { repairId, message }),
    summarizeHistory: (customerId: number) =>
      invoke<string>('summarize_customer_history', { customerId }),
  },
}
