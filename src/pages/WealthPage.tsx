import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ActivityTimeline, type TimelineItem } from '@/components/ActivityTimeline'
import { GoalCard } from '@/components/GoalCard'
import { GoalFormFields } from '@/components/GoalFormFields'
import { SegmentedControl } from '@/components/SegmentedControl'
import { WealthSkeleton } from '@/components/Skeleton'
import {
  Button,
  Card,
  EmptyState,
  HeroCard,
  Pill,
  SectionTitle,
} from '@/components/ui'
import { FormPanel } from '@/components/FormPanel'
import { useAuth } from '@/contexts/AuthContext'
import { useFinance } from '@/contexts/FinanceContext'
import { calculateGoalMetrics, assetGainLoss } from '@/lib/calculations/goals'
import { todayIsoDate } from '@/lib/formatters/dates'
import { formatMoney } from '@/lib/formatters/currency'
import { toMinorUnits } from '@/lib/money'
import type { GoalPriority } from '@/types/goal'
import { AllocationList, ChartCard, DonutChart } from '@/components/charts'
import {
  allocationByCategory,
  allocationByGoal,
  allocationBySource,
} from '@/lib/calculations/analytics'
import {
  ASSET_CATEGORY_LABELS,
  ASSET_SOURCE_LABELS,
  type Asset,
} from '@/types/asset'
import type { SupportedCurrency } from '@/types/user'

type WealthTab = 'goals' | 'assets' | 'activity'

export function WealthPage() {
  const { profile } = useAuth()
  const finance = useFinance()
  const currency = profile?.currency ?? 'INR'
  const asOf = todayIsoDate()
  const [tab, setTab] = useState<WealthTab>('goals')
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [targetDate, setTargetDate] = useState('2045-01-01')
  const [priority, setPriority] = useState<GoalPriority>('medium')
  const [busy, setBusy] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const allAssets = useMemo(
    () => finance.assets.filter((asset) => !asset.isDeleted),
    [finance.assets],
  )

  const cards = useMemo(
    () =>
      finance.goals.map((goal) => ({
        goal,
        metrics: calculateGoalMetrics(goal, finance.assets, asOf),
      })),
    [finance.assets, finance.goals, asOf],
  )

  const filterAssets = useMemo(() => {
    if (filterCategory === 'all') return allAssets
    return allAssets.filter((asset) => asset.category === filterCategory)
  }, [allAssets, filterCategory])

  const totalWealth = allAssets.reduce((sum, asset) => sum + asset.currentValue, 0)
  const totalTarget = finance.goals
    .filter((goal) => !goal.isDeleted)
    .reduce((sum, goal) => sum + goal.targetAmount, 0)

  const byGoal = useMemo(
    () => allocationByGoal(finance.goals, allAssets),
    [allAssets, finance.goals],
  )
  const byCategory = useMemo(
    () =>
      allocationByCategory(allAssets).map((item) => ({
        name:
          ASSET_CATEGORY_LABELS[item.name as keyof typeof ASSET_CATEGORY_LABELS] ??
          item.name,
        value: item.value,
      })),
    [allAssets],
  )
  const bySource = useMemo(
    () =>
      allocationBySource(allAssets).map((item) => ({
        name:
          ASSET_SOURCE_LABELS[item.name as keyof typeof ASSET_SOURCE_LABELS] ?? item.name,
        value: item.value,
      })),
    [allAssets],
  )

  const activityItems = useMemo((): TimelineItem[] => {
    return finance.transactions
      .filter((transaction) => !transaction.isDeleted)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30)
      .map((item) => {
        const asset = finance.assets.find((entry) => entry.id === item.assetId)
        const goal = finance.goals.find((entry) => entry.id === item.goalId)
        return {
          id: item.id,
          date: item.date,
          title:
            item.type === 'INVESTMENT'
              ? 'Invested'
              : item.type === 'WITHDRAWAL'
                ? 'Withdrawn'
                : 'Value updated',
          subtitle: [asset?.name, goal?.name].filter(Boolean).join(' · '),
          amount: item.amount,
          type:
            item.type === 'INVESTMENT'
              ? 'investment'
              : item.type === 'WITHDRAWAL'
                ? 'withdrawal'
                : 'update',
        }
      })
  }, [finance.transactions, finance.assets, finance.goals])

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      await finance.addGoal({
        name,
        targetAmount: toMinorUnits(Number(target), currency),
        startDate: asOf,
        targetDate,
        priority,
        status: 'active',
      })
      toast.success('Goal created. Let\'s build something. ✨')
      setOpen(false)
      setName('')
      setTarget('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  if (finance.loading) return <WealthSkeleton />

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink dark:text-white lg:text-3xl">
            Your <span className="font-serif font-medium text-accent">wealth</span>
          </h1>
          <p className="mt-1 text-sm text-ink-muted">Building something meaningful.</p>
        </div>
        {tab === 'goals' ? (
          <Button onClick={() => setOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add goal</span>
          </Button>
        ) : null}
      </header>

      <section
        className={
          byGoal.length > 0
            ? 'grid gap-4 lg:grid-cols-2 lg:items-stretch'
            : 'space-y-4'
        }
      >
        <HeroCard gradient="mint" className="flex flex-col justify-between lg:h-[200px] lg:py-4">
          <p className="text-sm font-medium text-white/80">Current wealth</p>
          <p className="font-display mt-0.5 text-[32px] font-semibold leading-none tracking-tight lg:text-[36px]">
            {formatMoney(totalWealth, currency, { compact: true })}
          </p>
          {totalTarget > 0 ? (
            <p className="mt-1.5 text-sm text-white/75">
              Target wealth {formatMoney(totalTarget, currency, { compact: true })}
            </p>
          ) : (
            <p className="mt-1.5 text-sm text-white/75">✦ Set a goal to start tracking progress</p>
          )}
        </HeroCard>

        {byGoal.length > 0 ? (
          <ChartCard className="flex flex-col justify-center rounded-[24px] py-3 lg:h-[200px]">
            <DonutChart
              compact
              data={byGoal}
              centerLabel="Total wealth"
              centerValue={formatMoney(totalWealth, currency, { compact: true })}
              formatValue={(value) => formatMoney(value, currency, { compact: true })}
            />
          </ChartCard>
        ) : null}
      </section>

      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: 'goals', label: 'Goals' },
          { value: 'assets', label: 'Assets' },
          { value: 'activity', label: 'Activity' },
        ]}
      />

      {tab === 'goals' ? (
        <GoalsTab cards={cards} currency={currency} onCreate={() => setOpen(true)} />
      ) : null}

      {tab === 'assets' ? (
        <AssetsTab
          assets={filterAssets}
          goals={finance.goals}
          currency={currency}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          byCategory={byCategory}
          bySource={bySource}
          totalWealth={totalWealth}
        />
      ) : null}

      {tab === 'activity' ? (
        <section className="space-y-3">
          <SectionTitle title="Recent activity" subtitle="Investments and withdrawals across goals" />
          <Card variant="flat">
            <ActivityTimeline
              items={activityItems}
              currency={currency}
              emptyMessage="Nothing here yet. Add an investment to see activity."
            />
          </Card>
        </section>
      ) : null}

      <FormPanel open={open} onOpenChange={setOpen} title="New goal">
        <form className="space-y-4" onSubmit={onCreate}>
          <GoalFormFields
            name={name}
            setName={setName}
            target={target}
            setTarget={setTarget}
            targetDate={targetDate}
            setTargetDate={setTargetDate}
            priority={priority}
            setPriority={setPriority}
          />
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? 'Saving…' : 'Create goal'}
          </Button>
        </form>
      </FormPanel>
    </div>
  )
}

function GoalsTab({
  cards,
  currency,
  onCreate,
}: {
  cards: {
    goal: {
      id: string
      name: string
      targetAmount: number
      targetDate: string
      priority: GoalPriority
    }
    metrics: ReturnType<typeof calculateGoalMetrics>
  }[]
  currency: SupportedCurrency
  onCreate: () => void
}) {
  if (cards.length === 0) {
    return (
      <EmptyState
        emoji="✨"
        title="Your wealth journey starts here"
        body="Create your first goal and start turning plans into progress."
        action={<Button onClick={onCreate}>Create a goal</Button>}
      />
    )
  }

  return (
    <section className="space-y-3">
      <SectionTitle title="Your goals ✨" subtitle="Small steps become big milestones." />
      <div className="grid grid-cols-2 gap-2.5 lg:gap-4">
        {cards.map(({ goal, metrics }, index) => (
          <GoalCard
            key={goal.id}
            goalId={goal.id}
            name={goal.name}
            current={metrics.currentValue}
            target={metrics.targetAmount}
            progress={metrics.displayProgressPercent}
            monthly={metrics.monthlyPlannedInvestment}
            trackStatus={metrics.trackStatus}
            currency={currency}
            index={index}
            compact
          />
        ))}
      </div>
    </section>
  )
}

function AssetsTab({
  assets,
  goals,
  currency,
  filterCategory,
  setFilterCategory,
  byCategory,
  bySource,
  totalWealth,
}: {
  assets: Asset[]
  goals: { id: string; name: string }[]
  currency: SupportedCurrency
  filterCategory: string
  setFilterCategory: (value: string) => void
  byCategory: { name: string; value: number }[]
  bySource: { name: string; value: number }[]
  totalWealth: number
}) {
  const hasCharts = byCategory.length > 0 || bySource.length > 0

  return (
    <div className="space-y-6">
      {hasCharts ? (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {byCategory.length > 0 ? (
            <ChartCard title="By category" className="flex flex-col justify-center py-3">
              <DonutChart
                compact
                data={byCategory}
                centerLabel="Total"
                centerValue={formatMoney(totalWealth, currency, { compact: true })}
                formatValue={(value) => formatMoney(value, currency, { compact: true })}
              />
            </ChartCard>
          ) : null}
          {bySource.length > 0 ? (
            <ChartCard title="By source" className="py-3">
              <AllocationList
                data={bySource}
                formatValue={(value) => formatMoney(value, currency, { compact: true })}
                empty="Add assets to see source allocation"
              />
            </ChartCard>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-3">
        <SectionTitle
          title="All assets"
          subtitle={
            filterCategory === 'all'
              ? 'Across your portfolio'
              : `Showing ${ASSET_CATEGORY_LABELS[filterCategory as keyof typeof ASSET_CATEGORY_LABELS] ?? filterCategory}`
          }
        />
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          <Pill active={filterCategory === 'all'} onClick={() => setFilterCategory('all')}>
            All
          </Pill>
          {Object.entries(ASSET_CATEGORY_LABELS).map(([value, label]) => (
            <Pill
              key={value}
              active={filterCategory === value}
              onClick={() => setFilterCategory(value)}
            >
              {label}
            </Pill>
          ))}
        </div>

        {assets.length === 0 ? (
          <EmptyState
            title="No assets in this view"
            body={
              filterCategory === 'all'
                ? 'Add assets to a goal to see them here.'
                : 'Try another category or add a matching asset.'
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {assets.map((asset) => {
              const goal = goals.find((entry) => entry.id === asset.goalId)
              const gain = assetGainLoss(asset)
              return (
                <Link key={asset.id} to={`/wealth/${asset.goalId}`} className="block">
                  <Card className="transition-transform active:scale-[0.99]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-ink dark:text-white">{asset.name}</h3>
                        <p className="mt-0.5 text-sm text-ink-muted">
                          {ASSET_CATEGORY_LABELS[asset.category]} · {ASSET_SOURCE_LABELS[asset.source]}
                        </p>
                        {goal ? <p className="mt-1 text-xs text-accent">{goal.name}</p> : null}
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg font-semibold text-ink dark:text-white">
                          {formatMoney(asset.currentValue, currency, { compact: true })}
                        </p>
                        <p
                          className={`text-xs font-medium ${gain >= 0 ? 'text-success' : 'text-danger'}`}
                        >
                          {gain >= 0 ? '↑' : '↓'}{' '}
                          {formatMoney(Math.abs(gain), currency, { compact: true })}
                        </p>
                      </div>
                    </div>
                    {asset.monthlyInvestment ? (
                      <p className="mt-2 text-xs text-ink-muted">
                        SIP {formatMoney(asset.monthlyInvestment, currency, { compact: true })} / month
                      </p>
                    ) : null}
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
