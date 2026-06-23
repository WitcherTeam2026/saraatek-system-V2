import { invoke } from '@tauri-apps/api/core'
import type {
  Customer, CreateCustomerInput,
  Repair, RepairWithCustomer, CreateRepairInput, RepairFilter, RepairHistory,
  Technician,
  QuotationWithItems, CreateQuotationInput, CreateQuotationItemInput, QuotationItem,
  Payment, RecordPaymentInput,
  Photo, Notification, Warranty, WarrantyWithRepair, CreateWarrantyInput, FieldAuditEntry,
  Company, CreateCompanyInput, CompanyFilter,
  Contact, CreateContactInput,
  Communication, LogCommunicationInput,
  User, LoginInput, LoginResult, CreateUserInput,
  Account, AccountBalance, JournalEntry, JournalEntryWithItems, LedgerEntry,
  ProfitLossReport, BalanceSheetReport, CreateJournalEntryInput, OpeningBalanceInput,
  SupabaseSettings, SyncStatus, DatabaseStats, TableInfo, DatabaseHealth,
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
    generateQuotationPdfHtml: (repairId: string, saveAs: boolean) =>
      invoke<string>('generate_quotation_pdf_html', { repairId, saveAs }),
    generateInvoicePdfHtml: (repairId: string, saveAs: boolean) =>
      invoke<string>('generate_invoice_pdf_html', { repairId, saveAs }),
    openFile: (path: string) => invoke<void>('open_file_path', { path }),
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
    sendReadyEmail: (repairId: string) => invoke<Notification>('send_ready_email_notification', { repairId }),
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
    revenueAnalytics: (startDate: string, endDate: string) =>
      invoke<import('../types').RevenueAnalytics>('get_revenue_analytics', { startDate, endDate }),
    repairAnalytics: (startDate: string, endDate: string) =>
      invoke<import('../types').RepairAnalytics>('get_repair_analytics', { startDate, endDate }),
    customerAnalytics: (startDate: string, endDate: string) =>
      invoke<import('../types').CustomerAnalytics>('get_customer_analytics', { startDate, endDate }),
    warrantyAnalytics: (startDate: string, endDate: string) =>
      invoke<import('../types').WarrantyAnalytics>('get_warranty_analytics', { startDate, endDate }),
  },

  ai: {
    draftMessage: (repairId: string, mode: string, channel: 'whatsapp' | 'email', goal?: string) =>
      invoke<string>('draft_notification_message', { repairId, mode, goal: goal || null, channel }),
    sendCustom: (repairId: string, message: string) =>
      invoke<Notification>('send_custom_notification', { repairId, message }),
    sendCustomEmail: (repairId: string, subject: string, message: string) =>
      invoke<Notification>('send_custom_email', { repairId, subject, message }),
    summarizeHistory: (customerId: number) =>
      invoke<string>('summarize_customer_history', { customerId }),
  },

  companies: {
    create: (input: CreateCompanyInput) => invoke<Company>('create_company', { input }),
    update: (input: { id: number } & Partial<CreateCompanyInput>) =>
      invoke<Company>('update_company', { input }),
    list: (filter: CompanyFilter) => invoke<Company[]>('list_companies', { filter }),
    get: (id: number) => invoke<Company | null>('get_company', { id }),
    searchByPhone: (phone: string) => invoke<Company | null>('search_company_by_phone', { phone }),
    delete: (id: number) => invoke<void>('delete_company', { id }),
  },

  contacts: {
    create: (input: CreateContactInput) => invoke<Contact>('create_contact', { input }),
    list: (companyId: number) => invoke<Contact[]>('list_contacts', { companyId }),
    update: (id: number, data: Partial<CreateContactInput>) =>
      invoke<Contact>('update_contact', { id, ...data }),
    delete: (id: number) => invoke<void>('delete_contact', { id }),
  },

  communications: {
    log: (input: LogCommunicationInput) => invoke<Communication>('log_communication', { input }),
    list: (companyId: number) => invoke<Communication[]>('get_communications', { companyId }),
    listForRepair: (repairId: string) =>
      invoke<Communication[]>('get_communications_for_repair', { repairId }),
  },

  auth: {
    login: (input: LoginInput) => invoke<LoginResult>('login', { input }),
    logout: (token: string) => invoke<void>('logout', { token }),
    createUser: (input: CreateUserInput) => invoke<User>('create_user', { input }),
    listUsers: () => invoke<User[]>('list_users'),
    updateUser: (id: number, data: { name?: string; role?: string; is_active?: boolean }) =>
      invoke<User>('update_user', { id, ...data }),
    deleteUser: (id: number) => invoke<void>('delete_user', { id }),
  },

  backup: {
    backup: (backupPath?: string) => invoke<{ path: string; size: number; created_at: string }>('backup_database', { backupPath: backupPath || null }),
    restore: (backupPath: string) => invoke<void>('restore_database', { backupPath }),
    list: () => invoke<Array<{ path: string; size: number; created_at: string }>>('list_backups'),
    getDbPath: () => invoke<string>('get_database_path'),
  },

  twoWay: {
    processIncoming: (input: import('../types').ProcessIncomingInput) =>
      invoke<import('../types').IncomingMessage>('process_incoming_message', { input }),
    getIncoming: (repairId?: string, limit?: number) =>
      invoke<import('../types').IncomingMessage[]>('get_incoming_messages', { repairId: repairId || null, limit: limit || null }),
    getConversation: (customerPhone: string, limit?: number) =>
      invoke<import('../types').IncomingMessage[]>('get_conversation', { customerPhone, limit: limit || null }),
  },

  campaigns: {
    create: (input: import('../types').CreateCampaignInput) =>
      invoke<import('../types').Campaign>('create_campaign', { input }),
    list: () => invoke<import('../types').Campaign[]>('list_campaigns'),
    getRecipients: (campaignId: number) =>
      invoke<import('../types').CampaignRecipient[]>('get_campaign_recipients', { campaignId }),
    send: (campaignId: number) => invoke<import('../types').Campaign>('send_campaign', { campaignId }),
  },

  sms: {
    send: (toPhone: string, message: string) =>
      invoke<import('../types').SmsResult>('send_sms', { toPhone, message }),
    getConfig: () => invoke<import('../types').SmsConfig>('get_sms_config'),
    saveConfig: (provider: string, apiKey: string, apiUrl: string, senderId: string) =>
      invoke<void>('save_sms_config', { provider, apiKey, apiUrl, senderId }),
  },

  documents: {
    listTemplates: () => invoke<import('../types').DocumentTemplate[]>('list_templates'),
    createTemplate: (input: import('../types').CreateTemplateInput) =>
      invoke<import('../types').DocumentTemplate>('create_template', { input }),
    updateTemplate: (id: number, name: string, content: string) =>
      invoke<void>('update_template', { id, name, content }),
    deleteTemplate: (id: number) => invoke<void>('delete_template', { id }),
    saveSignature: (input: import('../types').SaveSignatureInput) =>
      invoke<import('../types').Signature>('save_signature', { input }),
    getSignature: (repairId: string) =>
      invoke<import('../types').Signature | null>('get_signature', { repairId }),
    getLetterhead: () => invoke<import('../types').LetterheadSettings>('get_letterhead'),
    saveLetterhead: (settings: Partial<import('../types').LetterheadSettings>) =>
      invoke<void>('save_letterhead', {
        logoPath: settings.logo_path || null,
        companyName: settings.company_name || null,
        address: settings.address || null,
        phone: settings.phone || null,
        email: settings.email || null,
        website: settings.website || null,
        primaryColor: settings.primary_color || null,
        secondaryColor: settings.secondary_color || null,
      }),
    saveVersion: (documentType: string, documentId: number, content: string, changes?: string) =>
      invoke<import('../types').DocumentVersion>('save_document_version', {
        documentType, documentId, content, changes: changes || null,
      }),
    getVersions: (documentType: string, documentId: number) =>
      invoke<import('../types').DocumentVersion[]>('get_document_versions', { documentType, documentId }),
  },

  accounting: {
    listAccounts: () => invoke<Account[]>('list_accounts'),
    getBalances: (asOfDate?: string) => invoke<AccountBalance[]>('get_account_balances', { asOfDate: asOfDate || null }),
    getLedger: (accountId: number, startDate?: string, endDate?: string) =>
      invoke<LedgerEntry[]>('get_account_ledger', { accountId, startDate: startDate || null, endDate: endDate || null }),
    createJournalEntry: (input: CreateJournalEntryInput) => invoke<JournalEntry>('create_journal_entry', { input }),
    getJournalEntry: (entryId: number) => invoke<JournalEntryWithItems | null>('get_journal_entry', { entryId }),
    listJournalEntries: (startDate?: string, endDate?: string, limit?: number) =>
      invoke<JournalEntry[]>('list_journal_entries', { startDate: startDate || null, endDate: endDate || null, limit: limit || null }),
    getProfitLoss: (startDate: string, endDate: string) =>
      invoke<ProfitLossReport>('get_profit_loss', { startDate, endDate }),
    getBalanceSheet: (asOfDate: string) =>
      invoke<BalanceSheetReport>('get_balance_sheet', { asOfDate }),
    saveOpeningBalances: (balances: OpeningBalanceInput[], entryDate: string) =>
      invoke<JournalEntry>('save_opening_balances', { balances, entryDate }),
    hasOpeningBalances: () => invoke<boolean>('has_opening_balances'),
    deleteOpeningBalances: () => invoke<void>('delete_opening_balances'),
  },

  pdfSettings: {
    getAll: () => invoke<Record<string, string>>('get_pdf_template_settings'),
    save: (key: string, value: string) =>
      invoke<void>('save_pdf_template_setting', { key, value }),
    saveAll: (settings: Array<{ setting_key: string; setting_value: string }>) =>
      invoke<void>('save_pdf_template_settings', { settings }),
    reset: () => invoke<void>('reset_pdf_template_settings'),
  },

  cloudSync: {
    getSettings: () => invoke<SupabaseSettings>('get_supabase_settings'),
    saveSettings: (settings: SupabaseSettings) =>
      invoke<void>('save_supabase_settings', { settings }),
    testConnection: (settings: SupabaseSettings) =>
      invoke<boolean>('test_supabase_connection', { settings }),
    syncToCloud: (settings: SupabaseSettings, tableName: string, records: any[]) =>
      invoke<SyncStatus>('sync_to_cloud', { settings, tableName, records }),
    syncFromCloud: (settings: SupabaseSettings, tableName: string) =>
      invoke<any[]>('sync_from_cloud', { settings, tableName }),
    backupToCloud: (settings: SupabaseSettings, dbPath: string) =>
      invoke<string>('backup_to_cloud', { settings, dbPath }),
    getSyncStatus: () => invoke<SyncStatus>('get_sync_status'),
  },

  databaseMonitor: {
    getStats: () => invoke<DatabaseStats>('get_database_stats'),
    getTableInfo: (tableName: string) => invoke<TableInfo>('get_table_info', { tableName }),
    getHealth: () => invoke<DatabaseHealth>('get_database_health'),
    getAllTables: () => invoke<string[]>('get_all_tables'),
    getTableColumns: (tableName: string) => invoke<string[]>('get_table_columns', { tableName }),
    getRecentActivity: (limit: number) => invoke<any[]>('get_recent_activity', { limit }),
  },
}
