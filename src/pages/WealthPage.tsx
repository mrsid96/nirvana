import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Progress,
  Select,
  Sheet,
} from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useFinance } from '@/contexts/FinanceContext'
import { calculateGoalMetrics } from '@/lib/calculations/goals'
import { todayIsoDate } from '@/lib/formatters/dates'
import { formatMoney, formatPercent } from '@/lib/formatters/currency'
import { toMinorUnits } from '@/lib/money'
import type { GoalPriority } from '@/types/goal'
import { AllocationList, ChartCard, DonutChart } from '@/components/charts'
import {
  allocationByCategory,
  allocationByGoal,
  allocationBySource,
  withdrawalsByGoalMap,
  withdrawalsByMonth,
} from '@/lib/calculations/analytics'
import { ASSET_CATEGORY_LABELS, ASSET_SOURCE_LABELS } from '@/types/asset'

export function WealthPage() {
  const { profile } = useAuth()
  const finance = useFinance()
  const currency = profile?.currency ?? 'INR'
  const asOf = todayIsoDate()
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
    if (filterCategory === 'all') return finance.assets
    return finance.assets.filter((asset) => asset.category === filterCategory)
  }, [finance.assets, filterCategory])

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
      allocationByCategory(filterAssets).map((item: { name: string; value: number }) => ({
        name:
          ASSET_CATEGORY_LABELS[item.name as keyof typeof ASSET_CATEGORY_LABELS] ??
          item.name,
        value: item.value,
      })),
    [filterAssets],
  )
  const bySource = useMemo(
    () =>
      allocationBySource(filterAssets).map((item: { name: string; value: number }) => ({
        name:
          ASSET_SOURCE_LABELS[item.name as keyof typeof ASSET_SOURCE_LABELS] ?? item.name,
        value: item.value,
      })),
    [filterAssets],
  )
  const withdrawalByMonth = useMemo(
    () =>
      withdrawalsByMonth(finance.transactions).map(
        (item: { month: string; value: number }) => ({
          name: item.month,
          value: item.value,
        }),
      ),
    [finance.transactions],
  )
  const withdrawalByGoal = useMemo(
    () => withdrawalsByGoalMap(finance.goals, finance.transactions),
    [finance.goals, finance.transactions],
  )

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
      target: String(goalTarget / (currency === 'INR' ? 100 : 100)),
      targetDate: goalTargetDate,
      priority: goalPriority,
    })
    setName(goalName)
    setTarget(String(goalTarget / (currency === 'INR' ? 100 : 100)))
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
      toast.success('Goal created')
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Wealth</h1>
          <p className="mt-1 text-sm text-stone-500">
            Goals, assets and progress toward the life you want.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Add goal</Button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${filterCategory === 'all' ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'}`}
          onClick={() => setFilterCategory('all')}
        >
          All
        </button>
        {Object.entries(ASSET_CATEGORY_LABELS).map(([value, label]) => (
          <button
            key={value}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${filterCategory === value ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'}`}
            onClick={() => setFilterCategory(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {cards.length === 0 ? (
        <EmptyState
          title="Build your first wealth goal"
          body="Create a goal like Retirement, Emergency Fund or Child Education."
          action={<Button onClick={() => setOpen(true)}>Create goal</Button>}
        />
      ) : (
        <div className="space-y-3">
          {cards.map(({ goal, metrics }) => (
            <Card key={goal.id}>
              <Link to={`/wealth/${goal.id}`} className="block">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{goal.name}</h2>
                    <p className="mt-1 text-sm text-stone-500">
                      {formatMoney(metrics.currentValue, currency, { compact: true })} /{' '}
                      {formatMoney(metrics.targetAmount, currency, { compact: true })}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-stone-500">
                    {metrics.trackStatus}
                  </span>
                </div>
                <div className="mt-3">
                  <Progress value={metrics.displayProgressPercent} />
                  <p className="mt-2 text-xs text-stone-500">
                    {formatPercent(metrics.displayProgressPercent)} · Monthly plan{' '}
                    {formatMoney(metrics.monthlyPlannedInvestment, currency, {
                      compact: true,
                    })}
                  </p>
                </div>
              </Link>
              <div className="mt-3 border-t border-stone-100 pt-3 dark:border-stone-800">
                <Button
                  variant="ghost"
                  className="min-h-9 px-2 text-xs"
                  onClick={() =>
                    openEdit(
                      goal.id,
                      goal.name,
                      goal.targetAmount,
                      goal.targetDate,
                      goal.priority,
                    )
                  }
                >
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ChartCard title="Goal allocation" subtitle="Share of your target wealth by goal">
        <DonutChart
          data={byGoalTarget}
          formatValue={(value) => formatMoney(value, currency, { compact: true })}
        />
      </ChartCard>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ChartCard title="Current allocation" subtitle="Where wealth is working now">
          <DonutChart
            data={byGoal}
            formatValue={(value) => formatMoney(value, currency, { compact: true })}
          />
        </ChartCard>
        <ChartCard title="By category" subtitle="Asset mix across all goals">
          <DonutChart
            data={byCategory}
            formatValue={(value) => formatMoney(value, currency, { compact: true })}
          />
        </ChartCard>
      </div>

      <ChartCard title="By source" subtitle="Where the money is held">
        <AllocationList
          data={bySource}
          formatValue={(value) => formatMoney(value, currency, { compact: true })}
          empty="Add assets to see source allocation"
        />
      </ChartCard>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ChartCard title="Withdrawals" subtitle="Cumulative by month">
          <AllocationList
            data={withdrawalByMonth}
            formatValue={(value) => formatMoney(value, currency, { compact: true })}
            empty="No withdrawals yet"
          />
        </ChartCard>
        <ChartCard title="By goal" subtitle="Cumulative withdrawals per goal">
          <AllocationList
            data={withdrawalByGoal}
            formatValue={(value) => formatMoney(value, currency, { compact: true })}
            empty="No withdrawals yet"
          />
        </ChartCard>
      </div>

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
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Saving…' : 'Save goal'}
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
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Sheet>
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
