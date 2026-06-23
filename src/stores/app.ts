import { create } from 'zustand'
import { trackAction } from '../lib/intent'
import { trackScreenVisit } from '../lib/adaptive'

interface AppState {
  currentScreen: string
  selectedRepairId: string | null
  selectedCustomerId: number | null
  selectedCompanyId: number | null
  selectedEntryId: number | null
  selectedTemplateId: number | null
  navigate: (screen: string, params?: { repairId?: string; customerId?: number; companyId?: number; entryId?: number; templateId?: number }) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentScreen: 'dashboard',
  selectedRepairId: null,
  selectedCustomerId: null,
  selectedCompanyId: null,
  selectedEntryId: null,
  selectedTemplateId: null,
  navigate: (screen, params) => {
    // Track for intent prediction and adaptive layout
    trackAction(screen)
    trackScreenVisit(screen)
    
    set({
      currentScreen: screen,
      selectedRepairId: params?.repairId ?? null,
      selectedCustomerId: params?.customerId ?? null,
      selectedCompanyId: params?.companyId ?? null,
      selectedEntryId: params?.entryId ?? null,
      selectedTemplateId: params?.templateId ?? null,
    })
  },
}))
