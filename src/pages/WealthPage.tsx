import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ActivityTimeline, type TimelineItem } from '@/components/ActivityTimeline'
import { GoalCard } from '@/components/GoalCard'
import { GoalFormFields } from '@/components/GoalFormFields'
import { CommandBar } from '@/components/CommandBar'
import { SegmentedControl } from '@/components/SegmentedControl'
import { WealthSkeleton } from '@/components/Skeleton'
import { Button, Card, EmptyState, HeroCard, SectionTitle } from '@/components/ui'
import { FormPanel } from '@/components/FormPanel'
import { AllocationList, ChartCard, DonutChart } from '@/components/charts'
import { useAuth } from '@/contexts/AuthContext'
import { useFinance } from '@/contexts/FinanceContext'
import { calculateGoalMetrics } from '@/lib/calculations/goals'
import { allocationByGoal, totalWithdrawals, withdrawalsByAssetMap, withdrawalsByGoalMap, withdrawalsByMonth } from '@/lib/calculations/analytics'
import { todayIsoDate } from '@/lib/formatters/dates'
import { formatMoney } from '@/lib/formatters/currency'
import { parseAmountInput } from '@/lib/validation/parse'
import type { GoalPriority } from '@/types/goal'
import type { SupportedCurrency } from '@/types/user'

type WealthTab = 'goals' | 'activity'

export function WealthPage() {
  const { profile } = useAuth()
  const finance = useFinance()
  const { ensureRecentActivity } = finance
  const currency = profile?.currency ?? 'INR'
  const asOf = todayIsoDate()
  const [tab, setTab] = useState<WealthTab>('goals')
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [target, setTarget] = useState('')
  const [targetDate, setTargetDate] = useState('2045-01-01')
  const [priority, setPriority] = useState<GoalPriority>('medium')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (tab === 'activity') void ensureRecentActivity()
  }, [tab, ensureRecentActivity])

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

  const totalWealth = allAssets.reduce((sum, asset) => sum + asset.currentValue, 0)
  const totalTarget = finance.goals
    .filter((goal) => !goal.isDeleted)
    .reduce((sum, goal) => sum + goal.targetAmount, 0)

  const byGoal = useMemo(
    () => allocationByGoal(finance.goals, allAssets),
    [allAssets, finance.goals],
  )

  const withdrawalTotal = useMemo(
    () => totalWithdrawals(finance.transactions),
    [finance.transactions],
  )
  const withdrawalsByGoal = useMemo(
    () => withdrawalsByGoalMap(finance.goals, finance.transactions),
    [finance.goals, finance.transactions],
  )
  const withdrawalsByAsset = useMemo(
    () => withdrawalsByAssetMap(allAssets, finance.transactions),
    [allAssets, finance.transactions],
  )
  const withdrawalsMonthly = useMemo(
    () => withdrawalsByMonth(finance.transactions),
    [finance.transactions],
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
    if (!name.trim()) {
      toast.error('Enter a goal name')
      return
    }
    const targetParsed = parseAmountInput(target, currency)
    if (!targetParsed.ok) {
      toast.error(targetParsed.message)
      return
    }
    setBusy(true)
    try {
      await finance.addGoal({
        name,
        description: description.trim() || undefined,
        targetAmount: targetParsed.minor,
        startDate: asOf,
        targetDate,
        priority,
        status: 'active',
      })
      toast.success('Goal created. Let\'s build something. ✨')
      setOpen(false)
      setName('')
      setDescription('')
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

      <CommandBar contextKey="wealth" />

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
          { value: 'activity', label: 'Activity' },
        ]}
      />

      {tab === 'goals' ? (
        <GoalsTab cards={cards} currency={currency} onCreate={() => setOpen(true)} />
      ) : null}

      {tab === 'activity' ? (
        <section className="space-y-6">
          <div className="space-y-3">
            <SectionTitle title="Recent activity" subtitle="Investments and withdrawals across goals" />
            <Card variant="flat">
              <ActivityTimeline
                items={activityItems}
                currency={currency}
                emptyMessage="Nothing here yet. Add an investment to see activity."
              />
            </Card>
          </div>

          {withdrawalTotal > 0 ? (
            <div className="space-y-3">
              <SectionTitle title="Withdrawal analytics" subtitle="Where money left your portfolio" />
              <ChartCard>
                <p className="text-sm text-ink-muted">Total withdrawals</p>
                <p className="font-display mt-1 text-2xl font-semibold text-ink dark:text-white">
                  {formatMoney(withdrawalTotal, currency, { compact: true })}
                </p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {withdrawalsByGoal.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-semibold text-ink dark:text-white">By goal</h4>
                      <div className="mt-2">
                        <AllocationList
                          data={withdrawalsByGoal}
                          formatValue={(value) => formatMoney(value, currency, { compact: true })}
                          empty="No withdrawals by goal"
                        />
                      </div>
                    </div>
                  ) : null}
                  {withdrawalsByAsset.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-semibold text-ink dark:text-white">By asset</h4>
                      <div className="mt-2">
                        <AllocationList
                          data={withdrawalsByAsset}
                          formatValue={(value) => formatMoney(value, currency, { compact: true })}
                          empty="No withdrawals by asset"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
                {withdrawalsMonthly.length > 0 ? (
                  <div className="mt-4 border-t border-ink/5 pt-4 dark:border-white/5">
                    <h4 className="text-sm font-semibold text-ink dark:text-white">By month</h4>
                    <div className="mt-2">
                      <AllocationList
                        data={withdrawalsMonthly.map((item) => ({
                          name: item.month,
                          value: item.value,
                        }))}
                        formatValue={(value) => formatMoney(value, currency, { compact: true })}
                      />
                    </div>
                  </div>
                ) : null}
              </ChartCard>
            </div>
          ) : null}
        </section>
      ) : null}

      <FormPanel open={open} onOpenChange={setOpen} title="New goal">
        <form className="space-y-4" onSubmit={onCreate}>
          <GoalFormFields
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
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
