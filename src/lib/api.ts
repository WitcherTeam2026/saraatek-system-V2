import { invoke } from '@tauri-apps/api/core'
import { getAuthToken, clearAuth } from './secureStore'
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
  ReportsSummary, RevenueAnalytics, RepairAnalytics, CustomerAnalytics, WarrantyAnalytics,
  ProcessIncomingInput, IncomingMessage,
  CreateCampaignInput, Campaign, CampaignRecipient,
  SmsResult, SmsConfig,
  DocumentTemplate, CreateTemplateInput, SaveSignatureInput, Signature,
  LetterheadSettings, DocumentVersion,
  DashboardCounts, RecentActivity,
} from '../types'

function isAuthError(msg: string): boolean {
  return msg.includes('Session expired') ||
    msg.includes('Invalid or expired session') ||
    msg.includes('Authentication required')
}

async function invokeAuth<T>(cmd: string, args: Record<string, unknown>): Promise<T> {
  try {
    const token = await getAuthToken()
    return await invoke<T>(cmd, { ...args, token })
  } catch (e) {
    if (isAuthError(String(e))) {
      await clearAuth()
      window.location.reload()
    }
    throw e
  }
}

export const api = {
  customers: {
    search: (phone: string) => invokeAuth<Customer | null>('search_customer', { phone }),
    create: (input: CreateCustomerInput) => invokeAuth<Customer>('create_customer', { input }),
    updateAddress: (customerId: number, address: string) =>
      invokeAuth<Customer>('update_customer_address', { customerId, address }),
  },

  repairs: {
    generateId: () => invokeAuth<string>('generate_new_repair_id', {}),
    create: (input: CreateRepairInput) => invokeAuth<Repair>('create_repair', { input }),
    get: (id: string) => invokeAuth<RepairWithCustomer | null>('get_repair', { id }),
    list: (filter: RepairFilter) => invokeAuth<RepairWithCustomer[]>('list_repairs', { filter }),
    updateStatus: (repairId: string, newStatus: string, note?: string) =>
      invokeAuth<void>('update_repair_status', { input: { repair_id: repairId, new_status: newStatus, note } }),
    updateTechnicianFields: (input: {
      repair_id: string
      technician_id?: number | null
      tech_findings?: string | null
      recommended_action?: string | null
      parts_required?: string | null
      estimated_cost?: number | null
      repair_notes?: string | null
      parts_used?: string | null
    }) => invokeAuth<void>('update_technician_fields', { input }),
    history: (repairId: string) => invokeAuth<RepairHistory[]>('get_repair_history', { repairId }),
    dashboardCounts: () => invokeAuth<DashboardCounts>('get_dashboard_counts', {}),
  },

  settings: {
    getAll: () => invokeAuth<Record<string, string>>('get_all_settings', {}),
    save: (key: string, value: string) => invokeAuth<void>('save_setting', { key, value }),
  },

  payments: {
    record: (input: RecordPaymentInput) => invokeAuth<Payment>('record_payment', { input }),
    get: (repairId: string) => invokeAuth<Payment | null>('get_payment', { repairId }),
  },

  quotations: {
    create: (input: CreateQuotationInput) => invokeAuth<QuotationWithItems>('create_quotation', { input }),
    get: (id: number) => invokeAuth<QuotationWithItems | null>('get_quotation', { id }),
    getByRepair: (repairId: string) => invokeAuth<QuotationWithItems | null>('get_quotation_by_repair', { repairId }),
    approve: (id: number, responseNote?: string) =>
      invokeAuth<QuotationWithItems>('approve_quotation', { id, responseNote: responseNote || null }),
    decline: (id: number, responseNote?: string) =>
      invokeAuth<QuotationWithItems>('decline_quotation', { id, responseNote: responseNote || null }),
    createInvoiceItems: (repairId: string, items: CreateQuotationItemInput[]) =>
      invokeAuth<QuotationItem[]>('create_invoice_items', { repairId, items }),
    getInvoiceItems: (repairId: string) =>
      invokeAuth<QuotationItem[]>('get_invoice_items', { repairId }),
  },

  pdf: {
    generateIntakePdf: (repairId: string, saveAs: boolean) =>
      invokeAuth<string>('generate_intake_pdf', { repairId, saveAs }),
    generateQuotationPdf: (repairId: string, saveAs: boolean) =>
      invokeAuth<string>('generate_quotation_pdf_file', { repairId, saveAs }),
    generateInvoicePdf: (repairId: string, saveAs: boolean) =>
      invokeAuth<string>('generate_invoice_pdf_file', { repairId, saveAs }),
    generateQuotationPdfHtml: (repairId: string, saveAs: boolean) =>
      invokeAuth<string>('generate_quotation_pdf_html', { repairId, saveAs }),
    generateInvoicePdfHtml: (repairId: string, saveAs: boolean) =>
      invokeAuth<string>('generate_invoice_pdf_html', { repairId, saveAs }),
    openFile: (path: string) => invokeAuth<void>('open_file_path', { path }),
  },

  technicians: {
    list: () => invokeAuth<Technician[]>('list_technicians', {}),
    create: (name: string, phone?: string) =>
      invokeAuth<Technician>('create_technician', { input: { name, phone: phone || null } }),
    toggleActive: (id: number) => invokeAuth<void>('toggle_technician_active', { id }),
  },

  photos: {
    add: (repairId: string, fileNames: string[]) =>
      invokeAuth<Photo[]>('add_photos', { repairId, fileNames }),
    get: (repairId: string) => invokeAuth<Photo[]>('get_photos', { repairId }),
    delete: (photoId: number) => invokeAuth<void>('delete_photo', { photoId }),
    openFolder: (repairId: string) => invokeAuth<string>('open_photos_folder', { repairId }),
  },

  notifications: {
    sendReady: (repairId: string) => invokeAuth<Notification>('send_ready_notification', { repairId }),
    sendReadyEmail: (repairId: string) => invokeAuth<Notification>('send_ready_email_notification', { repairId }),
    history: (repairId: string) => invokeAuth<Notification[]>('get_notification_history', { repairId }),
  },

  warranties: {
    create: (input: CreateWarrantyInput) => invokeAuth<Warranty>('create_warranty', { input }),
    get: (repairId: string) => invokeAuth<Warranty | null>('get_warranty', { repairId }),
    searchBySerial: (serialNumber: string) =>
      invokeAuth<WarrantyWithRepair[]>('search_repair_by_serial', { serialNumber }),
    reopen: (repairId: string) => invokeAuth<void>('reopen_warranty_claim', { repairId }),
    checkExpired: () => invokeAuth<number>('check_expired_warranties', {}),
  },

  audit: {
    getLog: (repairId: string) => invokeAuth<FieldAuditEntry[]>('get_field_audit_log', { repairId }),
  },

  reports: {
    summary: (startDate: string, endDate: string, includeInactive: boolean) =>
      invokeAuth<ReportsSummary>('get_reports_summary', {
        startDate, endDate, includeInactive,
      }),
    revenueAnalytics: (startDate: string, endDate: string) =>
      invokeAuth<RevenueAnalytics>('get_revenue_analytics', { startDate, endDate }),
    repairAnalytics: (startDate: string, endDate: string) =>
      invokeAuth<RepairAnalytics>('get_repair_analytics', { startDate, endDate }),
    customerAnalytics: (startDate: string, endDate: string) =>
      invokeAuth<CustomerAnalytics>('get_customer_analytics', { startDate, endDate }),
    warrantyAnalytics: (startDate: string, endDate: string) =>
      invokeAuth<WarrantyAnalytics>('get_warranty_analytics', { startDate, endDate }),
  },

  ai: {
    draftMessage: (repairId: string, mode: string, channel: 'whatsapp' | 'email', goal?: string) =>
      invokeAuth<string>('draft_notification_message', { repairId, mode, goal: goal || null, channel }),
    sendCustom: (repairId: string, message: string) =>
      invokeAuth<Notification>('send_custom_notification', { repairId, message }),
    sendCustomEmail: (repairId: string, subject: string, message: string) =>
      invokeAuth<Notification>('send_custom_email', { repairId, subject, message }),
    summarizeHistory: (customerId: number) =>
      invokeAuth<string>('summarize_customer_history', { customerId }),
  },

  companies: {
    create: (input: CreateCompanyInput) => invokeAuth<Company>('create_company', { input }),
    update: (input: { id: number } & Partial<CreateCompanyInput>) =>
      invokeAuth<Company>('update_company', { input }),
    list: (filter: CompanyFilter) => invokeAuth<Company[]>('list_companies', { filter }),
    get: (id: number) => invokeAuth<Company | null>('get_company', { id }),
    searchByPhone: (phone: string) => invokeAuth<Company | null>('search_company_by_phone', { phone }),
    delete: (id: number) => invokeAuth<void>('delete_company', { id }),
  },

  contacts: {
    create: (input: CreateContactInput) => invokeAuth<Contact>('create_contact', { input }),
    list: (companyId: number) => invokeAuth<Contact[]>('list_contacts', { companyId }),
    update: (id: number, data: Partial<CreateContactInput>) =>
      invokeAuth<Contact>('update_contact', { id, ...data }),
    delete: (id: number) => invokeAuth<void>('delete_contact', { id }),
  },

  communications: {
    log: (input: LogCommunicationInput) => invokeAuth<Communication>('log_communication', { input }),
    list: (companyId: number) => invokeAuth<Communication[]>('get_communications', { companyId }),
    listForRepair: (repairId: string) =>
      invokeAuth<Communication[]>('get_communications_for_repair', { repairId }),
  },

  auth: {
    login: (input: LoginInput) => invoke<LoginResult>('login', { input }),
    logout: (token: string) => invoke<void>('logout', { token }),
    createUser: (input: CreateUserInput) => invokeAuth<User>('create_user', { input }),
    listUsers: () => invokeAuth<User[]>('list_users', {}),
    updateUser: (id: number, data: { name?: string; role?: string; is_active?: boolean }) =>
      invokeAuth<User>('update_user', { id, ...data }),
    deleteUser: (id: number) => invokeAuth<void>('delete_user', { id }),
    changePassword: (input: { old_password: string; new_password: string }) =>
      invokeAuth<void>('change_password', { input }),
  },

  backup: {
    backup: (backupPath?: string) => invokeAuth<{ path: string; size: number; created_at: string }>('backup_database', { backupPath: backupPath || null }),
    restore: (backupPath: string) => invokeAuth<void>('restore_database', { backupPath }),
    list: () => invokeAuth<Array<{ path: string; size: number; created_at: string }>>('list_backups', {}),
    getDbPath: () => invokeAuth<string>('get_database_path', {}),
  },

  twoWay: {
    processIncoming: (input: ProcessIncomingInput) =>
      invokeAuth<IncomingMessage>('process_incoming_message', { input }),
    getIncoming: (repairId?: string, limit?: number) =>
      invokeAuth<IncomingMessage[]>('get_incoming_messages', { repairId: repairId || null, limit: limit || null }),
    getConversation: (customerPhone: string, limit?: number) =>
      invokeAuth<IncomingMessage[]>('get_conversation', { customerPhone, limit: limit || null }),
  },

  campaigns: {
    create: (input: CreateCampaignInput) =>
      invokeAuth<Campaign>('create_campaign', { input }),
    list: () => invokeAuth<Campaign[]>('list_campaigns', {}),
    getRecipients: (campaignId: number) =>
      invokeAuth<CampaignRecipient[]>('get_campaign_recipients', { campaignId }),
    send: (campaignId: number) => invokeAuth<Campaign>('send_campaign', { campaignId }),
  },

  sms: {
    send: (toPhone: string, message: string) =>
      invokeAuth<SmsResult>('send_sms', { toPhone, message }),
    getConfig: () => invokeAuth<SmsConfig>('get_sms_config', {}),
    saveConfig: (provider: string, apiKey: string, apiUrl: string, senderId: string) =>
      invokeAuth<void>('save_sms_config', { provider, apiKey, apiUrl, senderId }),
  },

  documents: {
    listTemplates: () => invokeAuth<DocumentTemplate[]>('list_templates', {}),
    createTemplate: (input: CreateTemplateInput) =>
      invokeAuth<DocumentTemplate>('create_template', { input }),
    updateTemplate: (id: number, name: string, content: string) =>
      invokeAuth<void>('update_template', { id, name, content }),
    deleteTemplate: (id: number) => invokeAuth<void>('delete_template', { id }),
    saveSignature: (input: SaveSignatureInput) =>
      invokeAuth<Signature>('save_signature', { input }),
    getSignature: (repairId: string) =>
      invokeAuth<Signature | null>('get_signature', { repairId }),
    getLetterhead: () => invokeAuth<LetterheadSettings>('get_letterhead', {}),
    saveLetterhead: (settings: Partial<LetterheadSettings>) =>
      invokeAuth<void>('save_letterhead', {
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
      invokeAuth<DocumentVersion>('save_document_version', {
        documentType, documentId, content, changes: changes || null,
      }),
    getVersions: (documentType: string, documentId: number) =>
      invokeAuth<DocumentVersion[]>('get_document_versions', { documentType, documentId }),
  },

  accounting: {
    listAccounts: () => invokeAuth<Account[]>('list_accounts', {}),
    getBalances: (asOfDate?: string) => invokeAuth<AccountBalance[]>('get_account_balances', { asOfDate: asOfDate || null }),
    getLedger: (accountId: number, startDate?: string, endDate?: string) =>
      invokeAuth<LedgerEntry[]>('get_account_ledger', { accountId, startDate: startDate || null, endDate: endDate || null }),
    createJournalEntry: (input: CreateJournalEntryInput) => invokeAuth<JournalEntry>('create_journal_entry', { input }),
    getJournalEntry: (entryId: number) => invokeAuth<JournalEntryWithItems | null>('get_journal_entry', { entryId }),
    listJournalEntries: (startDate?: string, endDate?: string, limit?: number) =>
      invokeAuth<JournalEntry[]>('list_journal_entries', { startDate: startDate || null, endDate: endDate || null, limit: limit || null }),
    getProfitLoss: (startDate: string, endDate: string) =>
      invokeAuth<ProfitLossReport>('get_profit_loss', { startDate, endDate }),
    getBalanceSheet: (asOfDate: string) =>
      invokeAuth<BalanceSheetReport>('get_balance_sheet', { asOfDate }),
    saveOpeningBalances: (balances: OpeningBalanceInput[], entryDate: string) =>
      invokeAuth<JournalEntry>('save_opening_balances', { balances, entryDate }),
    hasOpeningBalances: () => invokeAuth<boolean>('has_opening_balances', {}),
    deleteOpeningBalances: () => invokeAuth<void>('delete_opening_balances', {}),
  },

  pdfSettings: {
    getAll: () => invokeAuth<Record<string, string>>('get_pdf_template_settings', {}),
    save: (key: string, value: string) =>
      invokeAuth<void>('save_pdf_template_setting', { key, value }),
    saveAll: (settings: Array<{ setting_key: string; setting_value: string }>) =>
      invokeAuth<void>('save_pdf_template_settings', { settings }),
    reset: () => invokeAuth<void>('reset_pdf_template_settings', {}),
  },

  cloudSync: {
    getSettings: () => invokeAuth<SupabaseSettings>('get_supabase_settings', {}),
    saveSettings: (settings: SupabaseSettings) =>
      invokeAuth<void>('save_supabase_settings', { settings }),
    testConnection: (settings: SupabaseSettings) =>
      invokeAuth<boolean>('test_supabase_connection', { settings }),
    syncToCloud: (settings: SupabaseSettings, tableName: string, records: any[]) =>
      invokeAuth<SyncStatus>('sync_to_cloud', { settings, tableName, records }),
    syncFromCloud: (settings: SupabaseSettings, tableName: string) =>
      invokeAuth<any[]>('sync_from_cloud', { settings, tableName }),
    backupToCloud: (settings: SupabaseSettings, dbPath: string) =>
      invokeAuth<string>('backup_to_cloud', { settings, dbPath }),
    getSyncStatus: () => invokeAuth<SyncStatus>('get_sync_status', {}),
  },

  databaseMonitor: {
    getStats: () => invokeAuth<DatabaseStats>('get_database_stats', {}),
    getTableInfo: (tableName: string) => invokeAuth<TableInfo>('get_table_info', { tableName }),
    getHealth: () => invokeAuth<DatabaseHealth>('get_database_health', {}),
    getAllTables: () => invokeAuth<string[]>('get_all_tables', {}),
    getTableColumns: (tableName: string) => invokeAuth<string[]>('get_table_columns', { tableName }),
    getRecentActivity: (limit: number) => invokeAuth<RecentActivity[]>('get_recent_activity', { limit }),
  },
}
