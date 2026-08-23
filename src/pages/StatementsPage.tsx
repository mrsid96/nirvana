import { useAuth } from '@/contexts/AuthContext'
import { MonthlyStatement } from '@/components/MonthlyStatement'
import { DashboardSkeleton } from '@/components/Skeleton'
import { useFinance } from '@/contexts/FinanceContext'
import { currentMonthKey } from '@/lib/formatters/dates'

export function StatementsPage() {
  const { profile, settings, saveSettings } = useAuth()
  const finance = useFinance()
  const currency = profile?.currency ?? 'INR'
  const month = settings?.dashboardMonth ?? currentMonthKey()

  if (finance.loading) return <DashboardSkeleton />

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[28px] font-semibold tracking-tight text-ink dark:text-white lg:text-3xl">
          Statements
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Month-by-month view of income, spending, and cash flow.
        </p>
      </header>

      <MonthlyStatement
        month={month}
        currency={currency}
        onMonthChange={(next) => void saveSettings({ dashboardMonth: next })}
      />
    </div>
  )
}
