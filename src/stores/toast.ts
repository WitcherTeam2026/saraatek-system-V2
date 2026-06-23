import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  variant: ToastVariant
  message: string
}

interface ToastState {
  toasts: Toast[]
  addToast: (variant: ToastVariant, message: string) => void
  removeToast: (id: string) => void
}

let toastCounter = 0

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  addToast: (variant, message) => {
    const id = `toast-${++toastCounter}`
    set((s) => ({ toasts: [...s.toasts, { id, variant, message }] }))
    if (variant !== 'error') {
      const duration = variant === 'warning' ? 5000 : 3000
      setTimeout(() => get().removeToast(id), duration)
    }
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
