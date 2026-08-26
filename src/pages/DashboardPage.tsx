import { useEffect, useMemo, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { Card, EmptyState, HeroCard } from '@/components/ui'
import { PageHeader } from '@/components/PageHeader'
import { HealthCard } from '@/components/HealthCard'
import { MilestoneBanner, useMilestones } from '@/components/MilestoneBanner'
import { MoneyFlow, SummaryGrid } from '@/components/MoneyFlow'
import { NotificationsTab, useNotificationCount } from '@/components/NotificationsTab'
import { ProfileAvatar } from '@/components/ProfileAvatar'
import { SegmentedControl } from '@/components/SegmentedControl'
import { DashboardSkeleton } from '@/components/Skeleton'
import { CommandBar } from '@/components/CommandBar'
import { ChartCard, DonutChart, WealthGrowthChart } from '@/components/charts'
import { useEffectiveAuth } from '@/contexts/DemoContext'
import { useOptionalAppTour } from '@/contexts/AppTourContext'
import { useFinance } from '@/contexts/FinanceContext'
import { calculateMonthlyCashFlow, cashFlowFromMonthlySummary } from '@/lib/calculations/cashflow'
import { calculateFinancialHealth } from '@/lib/calculations/financialHealth'
import { weightedGoalProgress } from '@/lib/calculations/goals'
import { loanBurdenRatio, totalMonthlyEmi, totalOutstanding } from '@/lib/calculations/loans'
import { currentMonthKey, formatMonthLabel, greetingForNow, todayIsoDate } from '@/lib/formatters/dates'
import { formatMoney } from '@/lib/formatters/currency'
import { firstName } from '@/lib/utils'
import { buildHistoricalWealthSeries } from '@/lib/calculations/wealthHistory'
import { ASSET_CATEGORY_LABELS } from '@/types/asset'
import type { SupportedCurrency } from '@/types/user'

function healthMessage(overall: string) {
  const lower = overall.toLowerCase()
  if (lower.includes('excellent') || lower.includes('great')) {
    return "You're building a healthy financial foundation."
  }
  if (lower.includes('good')) {
    return "Solid habits — keep the momentum going."
  }
  if (lower.includes('fair')) {
    return 'A few areas could use attention this month.'
  }
  return 'Small improvements this month can make a big difference.'
}

type HomeTab = 'month' | 'notifications'

export function DashboardPage() {
  const { profile } = useEffectiveAuth()
  const appTour = useOptionalAppTour()
  const finance = useFinance()
  const { ensureWealthHistory } = finance
  const [tab, setTab] = useState<HomeTab>('month')
  const currency = profile?.currency ?? 'INR'
  const month = currentMonthKey()
  const asOf = todayIsoDate()

  useEffect(() => {
    const requestedTab = appTour?.requestedDashboardTab
    const clearRequest = appTour?.clearDashboardTabRequest
    if (!requestedTab || !clearRequest) return
    setTab(requestedTab)
    clearRequest()
  }, [appTour?.requestedDashboardTab, appTour?.clearDashboardTabRequest])

  const cashflow = useMemo(() => {
    const fromSummary = cashFlowFromMonthlySummary(
      finance.currentMonthlySummary,
      finance.loans,
      true,
    )
    if (fromSummary) return fromSummary
    return calculateMonthlyCashFlow({
      income: finance.income,
      expenses: finance.expenses,
      transactions: finance.transactions,
      loans: finance.loans,
      loanPayments: finance.loanPayments,
      month,
      includeScheduledEmi: true,
    })
  }, [finance, month])

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

  const name = firstName(profile?.displayName)
  const milestones = useMilestones(currency as SupportedCurrency)
  const notificationCount = useNotificationCount()

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void ensureWealthHistory()
    }, 1500)
    return () => window.clearTimeout(timer)
  }, [ensureWealthHistory])

  const wealthHistory = useMemo(
    () =>
      buildHistoricalWealthSeries(finance.assets, finance.transactions, asOf, 12).map((point) => ({
        label: point.label,
        wealth: point.wealth,
        target: 0,
      })),
    [finance.assets, finance.transactions, asOf],
  )

  if (finance.loading) return <DashboardSkeleton />

  return (
    <div className="space-y-7">
      <MilestoneBanner milestones={milestones} />
      <PageHeader
        greeting={`${greetingForNow()}, ${name}`}
        title="You're building a stronger"
        accent="financial future."
        trailing={<ProfileAvatar className="mt-1" />}
      />

      <CommandBar contextKey="home" />

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
            <p className="mt-1.5 text-sm text-white/75">Keep going — progress compounds</p>
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

      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: 'month', label: 'This month' },
          {
            value: 'notifications',
            label: notificationCount > 0 ? 'Notifications' : 'All caught up',
            badge: notificationCount > 0 ? notificationCount : undefined,
            tourId: 'notifications',
          },
        ]}
      />

      {tab === 'month' ? (
        <section className="space-y-4">
          <p className="text-sm text-ink-muted">{formatMonthLabel(month)}</p>
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
          <HealthCard
            health={{
              ...health,
              loanBurden: loanBurdenRatio(emi, cashflow.income),
            }}
            message={healthMessage(health.overallLabel)}
          />
          <ChartCard
            title="Wealth over time"
            subtitle="Total assets month by month, built from the values you track"
          >
            {wealthHistory.length >= 2 ? (
              <WealthGrowthChart
                data={wealthHistory}
                showTarget={false}
                formatValue={(value) => formatMoney(value, currency, { compact: true })}
              />
            ) : (
              <EmptyState
                icon={TrendingUp}
                title="Not enough history yet"
                body="This chart shows how your total tracked wealth changes each month. Keep logging asset values and it will fill in over time."
              />
            )}
          </ChartCard>
        </section>
      ) : null}

      {tab === 'notifications' ? <NotificationsTab currency={currency} /> : null}
    </div>
  )
}
