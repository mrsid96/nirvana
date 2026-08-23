import { createContext, useContext, useState, type ReactNode } from 'react'
import type { QuickSheet } from '@/lib/quick-actions'

type QuickActionContextValue = {
  open: QuickSheet
  setOpen: (value: QuickSheet) => void
}

const QuickActionContext = createContext<QuickActionContextValue | null>(null)

export function QuickActionProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<QuickSheet>(null)
  return (
    <QuickActionContext.Provider value={{ open, setOpen }}>
      {children}
    </QuickActionContext.Provider>
  )
}

export function useQuickAction() {
  const ctx = useContext(QuickActionContext)
  if (!ctx) throw new Error('useQuickAction must be used within QuickActionProvider')
  return ctx
}
