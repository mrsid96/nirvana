import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { ActivityTimeline, type TimelineItem } from '@/components/ActivityTimeline'
import { GoalCard } from '@/components/GoalCard'
import { SegmentedControl } from '@/components/SegmentedControl'
import { WealthSkeleton } from '@/components/Skeleton'
import {
  Button,
  Card,
  EmptyState,
  Field,
  HeroCard,
  Input,
  Pill,
  SectionTitle,
  Select,
  Sheet,
} from '@/components/ui'
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
  const [editOpen, setEditOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<{
    id: string
    name: string
    target: string
    targetDate: string
    priority: GoalPriority
  } | null>(null)
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [targetDate, setTargetDate] = useState('2045-01-01')
  const [priority, setPriority] = useState<GoalPriority>('medium')
  const [busy, setBusy] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const cards = useMemo(
    () =>
      finance.goals.map((goal) => ({
        goal,
        metrics: calculateGoalMetrics(goal, finance.assets, asOf),
      })),
    [finance.assets, finance.goals, asOf],
  )

  const filterAssets = useMemo(() => {
    const active = finance.assets.filter((a) => !a.isDeleted)
    if (filterCategory === 'all') return active
    return active.filter((asset) => asset.category === filterCategory)
  }, [finance.assets, filterCategory])

  const totalWealth = filterAssets.reduce((s, a) => s + a.currentValue, 0)
  const totalTarget = finance.goals
    .filter((g) => !g.isDeleted)
    .reduce((s, g) => s + g.targetAmount, 0)

  const byGoal = useMemo(
    () => allocationByGoal(finance.goals, filterAssets),
    [filterAssets, finance.goals],
  )
  const byGoalTarget = useMemo(
    () =>
      finance.goals
        .filter((goal) => !goal.isDeleted)
        .map((goal) => ({ name: goal.name, value: goal.targetAmount }))
        .sort((a, b) => b.value - a.value),
    [finance.goals],
  )
  const byCategory = useMemo(
    () =>
      allocationByCategory(filterAssets).map((item) => ({
        name:
          ASSET_CATEGORY_LABELS[item.name as keyof typeof ASSET_CATEGORY_LABELS] ??
          item.name,
        value: item.value,
      })),
    [filterAssets],
  )
  const bySource = useMemo(
    () =>
      allocationBySource(filterAssets).map((item) => ({
        name:
          ASSET_SOURCE_LABELS[item.name as keyof typeof ASSET_SOURCE_LABELS] ?? item.name,
        value: item.value,
      })),
    [filterAssets],
  )

  const activityItems = useMemo((): TimelineItem[] => {
    return finance.transactions
      .filter((t) => !t.isDeleted)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30)
      .map((item) => {
        const asset = finance.assets.find((a) => a.id === item.assetId)
        const goal = finance.goals.find((g) => g.id === item.goalId)
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

  function openEdit(
    goalId: string,
    goalName: string,
    goalTarget: number,
    goalTargetDate: string,
    goalPriority: GoalPriority,
  ) {
    setEditingGoal({
      id: goalId,
      name: goalName,
      target: String(goalTarget / 100),
      targetDate: goalTargetDate,
      priority: goalPriority,
    })
    setName(goalName)
    setTarget(String(goalTarget / 100))
    setTargetDate(goalTargetDate)
    setPriority(goalPriority)
    setEditOpen(true)
  }

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

  async function onEdit(event: FormEvent) {
    event.preventDefault()
    if (!editingGoal) return
    setBusy(true)
    try {
      await finance.editGoal(editingGoal.id, {
        name,
        targetAmount: toMinorUnits(Number(target), currency),
        targetDate,
        priority,
      })
      toast.success('Goal updated')
      setEditOpen(false)
      setEditingGoal(null)
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
          <Button variant="soft" onClick={() => setOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add goal</span>
          </Button>
        ) : null}
      </header>

      <HeroCard gradient="mint">
        <p className="text-sm font-medium text-white/80">Current wealth</p>
        <p className="font-display mt-1 text-[36px] font-semibold leading-none">
          {formatMoney(totalWealth, currency, { compact: true })}
        </p>
        {totalTarget > 0 ? (
          <p className="mt-2 text-sm text-white/75">
            Target wealth {formatMoney(totalTarget, currency, { compact: true })}
          </p>
        ) : null}
      </HeroCard>

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
        <GoalsTab
          cards={cards}
          currency={currency}
          byGoalTarget={byGoalTarget}
          onCreate={() => setOpen(true)}
          onEdit={openEdit}
        />
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
          byGoal={byGoal}
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

      <Sheet open={open} onOpenChange={setOpen} title="New goal">
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
      </Sheet>

      <Sheet open={editOpen} onOpenChange={setEditOpen} title="Edit goal">
        <form className="space-y-4" onSubmit={onEdit}>
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
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Sheet>
    </div>
  )
}

function GoalsTab({
  cards,
  currency,
  byGoalTarget,
  onCreate,
  onEdit,
}: {
  cards: { goal: { id: string; name: string; targetAmount: number; targetDate: string; priority: GoalPriority }; metrics: ReturnType<typeof calculateGoalMetrics> }[]
  currency: SupportedCurrency
  byGoalTarget: { name: string; value: number }[]
  onCreate: () => void
  onEdit: (id: string, name: string, target: number, date: string, priority: GoalPriority) => void
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
    <div className="space-y-6">
      <div className="space-y-3">
        <SectionTitle title="Your goals ✨" subtitle="Small steps become big milestones." />
        {cards.map(({ goal, metrics }, index) => (
          <div key={goal.id} className="space-y-2">
            <GoalCard
              goalId={goal.id}
              name={goal.name}
              current={metrics.currentValue}
              target={metrics.targetAmount}
              progress={metrics.displayProgressPercent}
              monthly={metrics.monthlyPlannedInvestment}
              trackStatus={metrics.trackStatus}
              currency={currency}
              index={index}
            />
            <Button
              variant="ghost"
              className="min-h-9 px-2 text-xs"
              onClick={() =>
                onEdit(goal.id, goal.name, goal.targetAmount, goal.targetDate, goal.priority)
              }
            >
              Edit goal
            </Button>
          </div>
        ))}
      </div>
      {byGoalTarget.length > 0 ? (
        <ChartCard title="Goal allocation" subtitle="Share of your target wealth by goal">
          <DonutChart
            data={byGoalTarget}
            formatValue={(value) => formatMoney(value, currency, { compact: true })}
          />
        </ChartCard>
      ) : null}
    </div>
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
  byGoal,
  totalWealth,
}: {
  assets: Asset[]
  goals: { id: string; name: string }[]
  currency: SupportedCurrency
  filterCategory: string
  setFilterCategory: (v: string) => void
  byCategory: { name: string; value: number }[]
  bySource: { name: string; value: number }[]
  byGoal: { name: string; value: number }[]
  totalWealth: number
}) {
  return (
    <div className="space-y-6">
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
          title="No assets yet"
          body="Add assets to a goal to see them here."
        />
      ) : (
        <div className="space-y-3">
          {assets.map((asset) => {
            const goal = goals.find((g) => g.id === asset.goalId)
            const gain = assetGainLoss(asset)
            return (
              <Link key={asset.id} to={`/wealth/${asset.goalId}`}>
                <Card className="active:scale-[0.99] transition-transform">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-ink dark:text-white">{asset.name}</h3>
                      <p className="mt-0.5 text-sm text-ink-muted">
                        {ASSET_CATEGORY_LABELS[asset.category]} · {ASSET_SOURCE_LABELS[asset.source]}
                      </p>
                      {goal ? (
                        <p className="mt-1 text-xs text-accent">{goal.name}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg font-semibold text-ink dark:text-white">
                        {formatMoney(asset.currentValue, currency, { compact: true })}
                      </p>
                      <p className={`text-xs font-medium ${gain >= 0 ? 'text-success' : 'text-danger'}`}>
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

      {byCategory.length > 0 ? (
        <ChartCard title="By category" subtitle="Tap segments to explore">
          <DonutChart
            data={byCategory}
            centerLabel="Total wealth"
            centerValue={formatMoney(totalWealth, currency, { compact: true })}
            formatValue={(value) => formatMoney(value, currency, { compact: true })}
          />
        </ChartCard>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ChartCard title="By goal" subtitle="Where wealth is working">
          <DonutChart
            data={byGoal}
            formatValue={(value) => formatMoney(value, currency, { compact: true })}
          />
        </ChartCard>
        <ChartCard title="By source" subtitle="Where money is held">
          <AllocationList
            data={bySource}
            formatValue={(value) => formatMoney(value, currency, { compact: true })}
            empty="Add assets to see source allocation"
          />
        </ChartCard>
      </div>
    </div>
  )
}

function GoalFormFields({
  name,
  setName,
  target,
  setTarget,
  targetDate,
  setTargetDate,
  priority,
  setPriority,
}: {
  name: string
  setName: (value: string) => void
  target: string
  setTarget: (value: string) => void
  targetDate: string
  setTargetDate: (value: string) => void
  priority: GoalPriority
  setPriority: (value: GoalPriority) => void
}) {
  return (
    <>
      <Field label="Name">
        <Input value={name} onChange={(event) => setName(event.target.value)} required />
      </Field>
      <Field label="Target amount">
        <Input
          inputMode="decimal"
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          required
        />
      </Field>
      <Field label="Target date">
        <Input
          type="date"
          value={targetDate}
          onChange={(event) => setTargetDate(event.target.value)}
          required
        />
      </Field>
      <Field label="Priority">
        <Select
          value={priority}
          onChange={(event) => setPriority(event.target.value as GoalPriority)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Select>
      </Field>
    </>
  )
}
