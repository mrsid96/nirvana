import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Trash2, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { Card, ConfirmBar, HeroCard, SectionTitle } from '@/components/ui'
import { HealthCard } from '@/components/HealthCard'
import { MilestoneBanner, useMilestones } from '@/components/MilestoneBanner'
import { MoneyFlow, SummaryGrid } from '@/components/MoneyFlow'
import { DashboardSkeleton } from '@/components/Skeleton'
import { ChartCard, DonutChart } from '@/components/charts'
import { useAuth } from '@/contexts/AuthContext'
import { useFinance } from '@/contexts/FinanceContext'
import { calculateMonthlyCashFlow } from '@/lib/calculations/cashflow'
import { calculateFinancialHealth } from '@/lib/calculations/financialHealth'
import { weightedGoalProgress } from '@/lib/calculations/goals'
import { loanBurdenRatio, totalMonthlyEmi, totalOutstanding } from '@/lib/calculations/loans'
import {
  currentMonthKey,
  formatDisplayDate,
  formatMonthLabel,
  greetingForNow,
  monthKeyFromDate,
  shiftMonth,
  todayIsoDate,
} from '@/lib/formatters/dates'
import { formatMoney } from '@/lib/formatters/currency'
import { firstName } from '@/lib/utils'
import { ASSET_CATEGORY_LABELS } from '@/types/asset'
import type { SupportedCurrency } from '@/types/user'

function healthMessage(overall: string) {
  const lower = overall.toLowerCase()
  if (lower.includes('excellent') || lower.includes('great')) {
    return "You're building a healthy financial foundation. ✨"
  }
  if (lower.includes('good')) {
    return "Solid habits — keep the momentum going."
  }
  if (lower.includes('fair')) {
    return 'A few areas could use attention this month.'
  }
  return 'Small improvements this month can make a big difference.'
}

export function DashboardPage() {
  const { profile, settings, saveSettings } = useAuth()
  const finance = useFinance()
  const [deletingExpense, setDeletingExpense] = useState<string | null>(null)
  const [deletingIncome, setDeletingIncome] = useState<string | null>(null)
  const currency = profile?.currency ?? 'INR'
  const month = settings?.dashboardMonth ?? currentMonthKey()
  const asOf = todayIsoDate()

  const cashflow = useMemo(
    () =>
      calculateMonthlyCashFlow({
        income: finance.income,
        expenses: finance.expenses,
        transactions: finance.transactions,
        loans: finance.loans,
        month,
        includeScheduledEmi: true,
      }),
    [finance, month],
  )

  const allocation = useMemo(() => {
    const map = new Map<string, number>()
    for (const asset of finance.assets) {
      if (asset.isDeleted) continue
      map.set(asset.category, (map.get(asset.category) ?? 0) + asset.currentValue)
    }
    return [...map.entries()].map(([category, value]) => ({
      name:
        ASSET_CATEGORY_LABELS[category as keyof typeof ASSET_CATEGORY_LABELS] ?? category,
      value,
    }))
  }, [finance.assets])

  const assetsTotal = finance.assets.reduce((sum, asset) => sum + asset.currentValue, 0)
  const loansTotal = totalOutstanding(finance.loans)
  const net = assetsTotal - loansTotal
  const emi = totalMonthlyEmi(finance.loans)
  const goalProgress = weightedGoalProgress(finance.goals, finance.assets, asOf)
  const health = calculateFinancialHealth({
    income: cashflow.income,
    expenses: cashflow.expenses,
    investments: cashflow.investments,
    emis: cashflow.loanPayments,
    wealthGoalProgress: goalProgress,
  })

  const monthExpenses = useMemo(
    () =>
      finance.expenses
        .filter((item) => item.month === month || monthKeyFromDate(item.date) === month)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [finance.expenses, month],
  )

  const monthIncome = useMemo(
    () =>
      finance.income
        .filter((item) => item.month === month || monthKeyFromDate(item.date) === month)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [finance.income, month],
  )

  const name = firstName(profile?.displayName)
  const milestones = useMilestones(currency as SupportedCurrency)

  if (finance.loading) return <DashboardSkeleton />

  return (
    <div className="space-y-7">
      <MilestoneBanner milestones={milestones} />
      {/* Greeting */}
      <header className="pt-1">
        <p className="text-sm font-medium text-ink-muted">
          {greetingForNow()}, {name} 👋
        </p>
        <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-ink dark:text-white lg:text-[32px]">
          You&apos;re building a stronger{' '}
          <span className="font-serif font-medium text-accent">financial future</span>.
        </h1>
      </header>

      {/* Wealth overview — net worth left, allocation right on desktop */}
      <section
        className={
          allocation.length > 0
            ? 'grid gap-4 lg:grid-cols-2 lg:items-stretch'
            : 'space-y-4'
        }
      >
        <HeroCard gradient="violet" className="flex flex-col justify-between lg:h-[200px] lg:py-4">
          <p className="text-sm font-medium text-white/80">Your net worth</p>
          <p className="font-display mt-0.5 text-[32px] font-semibold leading-none tracking-tight lg:text-[36px]">
            {formatMoney(net, currency, { compact: true })}
          </p>
          {cashflow.freeCashFlow > 0 ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/85">
              <TrendingUp className="h-4 w-4" />
              {formatMoney(cashflow.freeCashFlow, currency, { compact: true })} free this month
            </p>
          ) : (
            <p className="mt-1.5 text-sm text-white/75">✦ Keep going — progress compounds</p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-[14px] bg-white/12 px-3 py-1.5 backdrop-blur-sm">
              <p className="text-xs text-white/70">Assets</p>
              <p className="font-display mt-0.5 text-sm font-semibold lg:text-base">
                {formatMoney(assetsTotal, currency, { compact: true })}
              </p>
            </div>
            <div className="rounded-[14px] bg-white/12 px-3 py-1.5 backdrop-blur-sm">
              <p className="text-xs text-white/70">Loans</p>
              <p className="font-display mt-0.5 text-sm font-semibold lg:text-base">
                {formatMoney(loansTotal, currency, { compact: true })}
              </p>
            </div>
          </div>
        </HeroCard>

        {allocation.length > 0 ? (
          <ChartCard className="flex flex-col justify-center rounded-[24px] py-3 lg:h-[200px]">
            <DonutChart
              compact
              data={allocation}
              centerLabel="Total wealth"
              centerValue={formatMoney(assetsTotal, currency, { compact: true })}
              formatValue={(value) => formatMoney(value, currency, { compact: true })}
            />
          </ChartCard>
        ) : null}
      </section>

      {/* This month */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionTitle title="This month" />
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex min-h-9 min-w-9 items-center justify-center rounded-full text-ink-muted active:bg-ink/5"
              onClick={() => void saveSettings({ dashboardMonth: shiftMonth(month, -1) })}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-[7rem] text-center text-sm font-semibold text-ink dark:text-white">
              {formatMonthLabel(month)}
            </span>
            <button
              type="button"
              className="flex min-h-9 min-w-9 items-center justify-center rounded-full text-ink-muted active:bg-ink/5"
              onClick={() => void saveSettings({ dashboardMonth: shiftMonth(month, 1) })}
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <SummaryGrid
          currency={currency}
          items={[
            { label: 'Income', value: cashflow.income, tint: 'mint' },
            { label: 'Spending', value: cashflow.expenses, tint: 'peach' },
            { label: 'Investing', value: cashflow.investments, tint: 'accent' },
            { label: 'Loans', value: cashflow.loanPayments, tint: 'sky' },
          ]}
        />

        <Card variant="flat">
          <MoneyFlow
            income={cashflow.income}
            remaining={cashflow.freeCashFlow}
            currency={currency}
            items={[
              { label: 'Spend', value: cashflow.expenses, color: '#FF9B7A' },
              { label: 'Invest', value: cashflow.investments, color: '#6657E8' },
              { label: 'Loans', value: cashflow.loanPayments, color: '#6BB8E8' },
            ]}
          />
        </Card>
      </section>

      {/* Recent activity */}
      {(monthIncome.length > 0 || monthExpenses.length > 0) && (
        <section className="space-y-3">
          <SectionTitle title="Recent activity" subtitle="This month's entries" />
          <div className="space-y-2">
            {monthIncome.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-[16px] bg-surface px-4 py-3 shadow-[var(--shadow-soft)] dark:bg-surface-dark"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink dark:text-white">{item.source}</p>
                  <p className="text-xs text-ink-muted">
                    {formatDisplayDate(item.date)}
                    {item.description ? ` · ${item.description}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-semibold text-success">
                    +{formatMoney(item.amount, currency, { compact: true })}
                  </span>
                  <button
                    type="button"
                    className="min-h-9 min-w-9 rounded-full text-ink-faint active:bg-ink/5"
                    aria-label="Delete income"
                    onClick={() => setDeletingIncome(item.id)}
                  >
                    <Trash2 className="mx-auto h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {monthExpenses.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-[16px] bg-surface px-4 py-3 shadow-[var(--shadow-soft)] dark:bg-surface-dark"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink dark:text-white">{item.category}</p>
                  <p className="text-xs text-ink-muted">
                    {formatDisplayDate(item.date)}
                    {item.description ? ` · ${item.description}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-semibold text-ink dark:text-white">
                    {formatMoney(item.amount, currency, { compact: true })}
                  </span>
                  <button
                    type="button"
                    className="min-h-9 min-w-9 rounded-full text-ink-faint active:bg-ink/5"
                    aria-label="Delete expense"
                    onClick={() => setDeletingExpense(item.id)}
                  >
                    <Trash2 className="mx-auto h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <HealthCard
        health={{
          ...health,
          loanBurden: loanBurdenRatio(emi, cashflow.income),
        }}
        message={healthMessage(health.overallLabel)}
      />

      <ConfirmBar
        open={deletingExpense !== null}
        title="Delete expense?"
        body="This will remove the expense from your monthly cash flow."
        onCancel={() => setDeletingExpense(null)}
        onConfirm={() => {
          if (!deletingExpense) return
          void finance
            .removeExpense(deletingExpense)
            .then(() => {
              toast.success('Expense removed')
              setDeletingExpense(null)
            })
            .catch((error) => {
              toast.error(error instanceof Error ? error.message : 'Could not delete')
            })
        }}
      />

      <ConfirmBar
        open={deletingIncome !== null}
        title="Delete income?"
        body="This will remove the income from your monthly cash flow."
        onCancel={() => setDeletingIncome(null)}
        onConfirm={() => {
          if (!deletingIncome) return
          void finance
            .removeIncome(deletingIncome)
            .then(() => {
              toast.success('Income removed')
              setDeletingIncome(null)
            })
            .catch((error) => {
              toast.error(error instanceof Error ? error.message : 'Could not delete')
            })
        }}
      />
    </div>
  )
}
