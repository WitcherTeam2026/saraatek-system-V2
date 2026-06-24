import { create } from 'zustand'
import { trackNavigation } from '../lib/tracking'
import type { Screen } from '../types'

interface AppState {
  currentScreen: Screen
  selectedRepairId: string | null
  selectedCustomerId: number | null
  selectedCompanyId: number | null
  selectedEntryId: number | null
  selectedTemplateId: number | null
  navigate: (screen: Screen, params?: { repairId?: string; customerId?: number; companyId?: number; entryId?: number; templateId?: number }) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentScreen: 'dashboard',
  selectedRepairId: null,
  selectedCustomerId: null,
  selectedCompanyId: null,
  selectedEntryId: null,
  selectedTemplateId: null,
  navigate: (screen, params) => {
    trackNavigation(screen)

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
