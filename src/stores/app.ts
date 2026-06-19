import { create } from 'zustand'

interface AppState {
  currentScreen: string
  selectedRepairId: string | null
  selectedCustomerId: number | null
  navigate: (screen: string, params?: { repairId?: string; customerId?: number }) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentScreen: 'dashboard',
  selectedRepairId: null,
  selectedCustomerId: null,
  navigate: (screen, params) => set({
    currentScreen: screen,
    selectedRepairId: params?.repairId ?? null,
    selectedCustomerId: params?.customerId ?? null,
  }),
}))
