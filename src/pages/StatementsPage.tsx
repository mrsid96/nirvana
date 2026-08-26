import { useState } from 'react'
import { useEffectiveAuth } from '@/contexts/DemoContext'
import { MonthlyStatement } from '@/components/MonthlyStatement'
import { PageHeader } from '@/components/PageHeader'
import { DashboardSkeleton } from '@/components/Skeleton'
import { useFinance } from '@/contexts/FinanceContext'
import { currentMonthKey } from '@/lib/formatters/dates'

export function StatementsPage() {
  const { profile, settings, saveSettings, isDemoMode } = useEffectiveAuth()
  const finance = useFinance()
  const [demoMonth, setDemoMonth] = useState(settings?.dashboardMonth ?? currentMonthKey())
  const currency = profile?.currency ?? 'INR'
  const month = isDemoMode ? demoMonth : (settings?.dashboardMonth ?? currentMonthKey())

  if (finance.loading) return <DashboardSkeleton />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your"
        accent="statements"
        subtitle="Month-by-month view of income, spending, and cash flow."
      />

      <MonthlyStatement
        month={month}
        currency={currency}
        onMonthChange={(next) => {
          if (isDemoMode) {
            setDemoMonth(next)
            return
          }
          void saveSettings({ dashboardMonth: next })
        }}
      />
    </div>
  )
}
