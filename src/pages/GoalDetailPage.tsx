import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useSetPageTitle } from '@/contexts/PageTitleContext'
import { ActivityTimeline, type TimelineItem } from '@/components/ActivityTimeline'
import { CircularProgress } from '@/components/CircularProgress'
import { CommandBar } from '@/components/CommandBar'
import { GoalFormFields } from '@/components/GoalFormFields'
import { GoalJourney } from '@/components/GoalJourney'
import { GoalDetailSkeleton } from '@/components/Skeleton'
import { SegmentedControl } from '@/components/SegmentedControl'
import {
  Button,
  Card,
  ConfirmBar,
  EmptyState,
  Field,
  Input,
  Pill,
  Select,
} from '@/components/ui'
import { FormPanel } from '@/components/FormPanel'
import { AllocationList, DonutChart } from '@/components/charts'
import { useEffectiveAuth } from '@/contexts/DemoContext'
import { useFinance } from '@/contexts/FinanceContext'
import {
  calculateGoalMetrics,
  assetGainLoss,
  assetNetInvested,
} from '@/lib/calculations/goals'
import {
  allocationByCategory,
  allocationBySource,
} from '@/lib/calculations/analytics'
import { buildGoalProjection } from '@/lib/calculations/projections'
import { todayIsoDate } from '@/lib/formatters/dates'
import { formatMoney, formatPercent } from '@/lib/formatters/currency'
import { getGoalTheme, type GoalTheme } from '@/lib/goal-theme'
import { toMajorUnits } from '@/lib/money'
import {
  parseAmountInput,
  parseDayOfMonth,
  parseRatePercent,
} from '@/lib/validation/parse'
import {
  ASSET_CATEGORY_LABELS,
  ASSET_SOURCE_LABELS,
  type Asset,
  type AssetCategory,
  type AssetSource,
  type InvestmentType,
} from '@/types/asset'
import type { SupportedCurrency } from '@/types/user'
import type { Goal, GoalPriority } from '@/types/goal'
import type { AssetTransaction } from '@/types/transaction'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'

type GoalTab = 'overview' | 'assets' | 'activity'

export function GoalDetailPage() {
  const { goalId } = useParams()
  const navigate = useNavigate()
  const { profile } = useEffectiveAuth()
  const finance = useFinance()
  const { ensureGoalDetail } = finance
  const currency = profile?.currency ?? 'INR'
  const asOf = todayIsoDate()
  const goal = finance.goals.find((item) => item.id === goalId)
  const goalAssets = useMemo(
    () => finance.assets.filter((item) => item.goalId === goalId && !item.isDeleted),
    [finance.assets, goalId],
  )
  const metrics = goal ? calculateGoalMetrics(goal, finance.assets, asOf) : null
  const theme = goal ? getGoalTheme(goal.name) : null
  useSetPageTitle(goal?.name ?? null)

  useEffect(() => {
    if (goalId) void ensureGoalDetail(goalId)
  }, [ensureGoalDetail, goalId, finance.loading])

  const [tab, setTab] = useState<GoalTab>('overview')
  const [filterCategory, setFilterCategory] = useState('all')
  const [assetOpen, setAssetOpen] = useState(false)
  const [editAssetOpen, setEditAssetOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null)
  const [withdrawingAsset, setWithdrawingAsset] = useState<Asset | null>(null)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawDate, setWithdrawDate] = useState(asOf)
  const [withdrawNote, setWithdrawNote] = useState('')
  const [deletingTx, setDeletingTx] = useState<AssetTransaction | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [editGoalOpen, setEditGoalOpen] = useState(false)
  const [goalName, setGoalName] = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalTargetDate, setGoalTargetDate] = useState('')
  const [goalPriority, setGoalPriority] = useState<GoalPriority>('medium')
  const [name, setName] = useState('')
  const [category, setCategory] = useState<AssetCategory>('MF')
  const [source, setSource] = useState<AssetSource>('ZERODHA')
  const [investmentType, setInvestmentType] = useState<InvestmentType>('SIP')
  const [currentValue, setCurrentValue] = useState('')
  const [monthly, setMonthly] = useState('')
  const [plannedDay, setPlannedDay] = useState('5')
  const [cagr, setCagr] = useState('12')
  const [valueUpdateAsset, setValueUpdateAsset] = useState<Asset | null>(null)
  const [newValue, setNewValue] = useState('')
  const [valueUpdateDate, setValueUpdateDate] = useState(asOf)
  const [busy, setBusy] = useState(false)

  const filterAssets = useMemo(() => {
    if (filterCategory === 'all') return goalAssets
    return goalAssets.filter((asset) => asset.category === filterCategory)
  }, [goalAssets, filterCategory])

  const goalTotal = goalAssets.reduce((sum, asset) => sum + asset.currentValue, 0)

  const byCategory = useMemo(
    () =>
      allocationByCategory(goalAssets).map((item) => ({
        name:
          ASSET_CATEGORY_LABELS[item.name as keyof typeof ASSET_CATEGORY_LABELS] ??
          item.name,
        value: item.value,
      })),
    [goalAssets],
  )

  const bySource = useMemo(
    () =>
      allocationBySource(goalAssets).map((item) => ({
        name:
          ASSET_SOURCE_LABELS[item.name as keyof typeof ASSET_SOURCE_LABELS] ?? item.name,
        value: item.value,
      })),
    [goalAssets],
  )

  const recent = useMemo(
    () =>
      finance.transactions
        .filter((item) => item.goalId === goalId && !item.isDeleted)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [finance.transactions, goalId],
  )

  const timelineItems = useMemo((): TimelineItem[] => {
    return recent.map((item) => {
      const asset = finance.assets.find((entry) => entry.id === item.assetId)
      return {
        id: item.id,
        date: item.date,
        title:
          item.type === 'INVESTMENT'
            ? 'Invested'
            : item.type === 'WITHDRAWAL'
              ? 'Withdrawn'
              : 'Value updated',
        subtitle: asset?.name ?? 'Unknown asset',
        amount: item.amount,
        type:
          item.type === 'INVESTMENT'
            ? 'investment'
            : item.type === 'WITHDRAWAL'
              ? 'withdrawal'
              : 'update',
      }
    })
  }, [recent, finance.assets])

  const projection = useMemo(
    () =>
      goal
        ? buildGoalProjection(goal, finance.assets, asOf, metrics?.expectedCagr ?? 0)
        : null,
    [goal, finance.assets, asOf, metrics?.expectedCagr],
  )

  const projectionData = projection?.points ?? []

  if (finance.loading) return <GoalDetailSkeleton />

  if (!goal || !metrics || !theme) {
    return <EmptyState title="Goal not found" body="It may have been removed." />
  }

  async function onAddAsset(event: FormEvent) {
    event.preventDefault()
    const valueParsed = parseAmountInput(currentValue, currency, { allowZero: true })
    if (!valueParsed.ok) {
      toast.error(valueParsed.message)
      return
    }
    let monthlyMinor: number | undefined
    if (monthly.trim()) {
      const monthlyParsed = parseAmountInput(monthly, currency)
      if (!monthlyParsed.ok) {
        toast.error(monthlyParsed.message)
        return
      }
      monthlyMinor = monthlyParsed.minor
    }
    let plannedDayNum = 1
    if (monthlyMinor) {
      const dayParsed = parseDayOfMonth(plannedDay)
      if (!dayParsed.ok) {
        toast.error(dayParsed.message)
        return
      }
      plannedDayNum = dayParsed.day
    }
    const cagrParsed = cagr.trim() ? parseRatePercent(cagr) : null
    if (cagrParsed && !cagrParsed.ok) {
      toast.error(cagrParsed.message)
      return
    }
    setBusy(true)
    try {
      const value = valueParsed.minor
      await finance.addAsset({
        goalId: goalId!,
        name,
        category,
        source,
        investmentType,
        investedAmount: value,
        currentValue: value,
        totalWithdrawals: 0,
        expectedCagr: cagrParsed?.ok ? cagrParsed.rate : undefined,
        monthlyInvestment: monthlyMinor,
        plannedInvestmentDay: monthlyMinor ? plannedDayNum : undefined,
        isActive: true,
      })
      toast.success('Asset added. Nice move. ✨')
      setAssetOpen(false)
      setName('')
      setCurrentValue('')
      setMonthly('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  function openEditAsset(asset: Asset) {
    setEditingAsset(asset)
    setName(asset.name)
    setCategory(asset.category)
    setSource(asset.source)
    setInvestmentType(asset.investmentType)
    setCurrentValue(String(toMajorUnits(asset.currentValue, currency)))
    setMonthly(
      asset.monthlyInvestment
        ? String(toMajorUnits(asset.monthlyInvestment, currency))
        : '',
    )
    setPlannedDay(String(asset.plannedInvestmentDay ?? 5))
    setCagr(asset.expectedCagr != null ? String(asset.expectedCagr) : '12')
    setEditAssetOpen(true)
  }

  async function onEditAsset(event: FormEvent) {
    event.preventDefault()
    if (!editingAsset) return
    let monthlyMinor: number | undefined
    if (monthly.trim()) {
      const monthlyParsed = parseAmountInput(monthly, currency)
      if (!monthlyParsed.ok) {
        toast.error(monthlyParsed.message)
        return
      }
      monthlyMinor = monthlyParsed.minor
    }
    let plannedDayNum = 1
    if (monthlyMinor) {
      const dayParsed = parseDayOfMonth(plannedDay)
      if (!dayParsed.ok) {
        toast.error(dayParsed.message)
        return
      }
      plannedDayNum = dayParsed.day
    }
    const cagrParsed = cagr.trim() ? parseRatePercent(cagr) : null
    if (cagrParsed && !cagrParsed.ok) {
      toast.error(cagrParsed.message)
      return
    }
    setBusy(true)
    try {
      await finance.editAsset(goalId!, editingAsset.id, {
        name,
        category,
        source,
        investmentType,
        expectedCagr: cagrParsed?.ok ? cagrParsed.rate : undefined,
        monthlyInvestment: monthlyMinor,
        plannedInvestmentDay: monthlyMinor ? plannedDayNum : undefined,
      })
      toast.success('Asset updated')
      setEditAssetOpen(false)
      setEditingAsset(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  function openWithdraw(asset: Asset) {
    setWithdrawingAsset(asset)
    setWithdrawAmount('')
    setWithdrawDate(asOf)
    setWithdrawNote('')
  }

  async function onWithdraw(event: FormEvent) {
    event.preventDefault()
    if (!withdrawingAsset) return
    const parsed = parseAmountInput(withdrawAmount, currency)
    if (!parsed.ok) {
      toast.error(parsed.message)
      return
    }
    const minor = parsed.minor
    if (minor > withdrawingAsset.currentValue) {
      toast.error('Cannot withdraw more than the current value')
      return
    }
    setBusy(true)
    try {
      await finance.addTransaction(
        {
          assetId: withdrawingAsset.id,
          goalId: goalId!,
          type: 'WITHDRAWAL',
          amount: minor,
          date: withdrawDate,
          note: withdrawNote || undefined,
        },
        withdrawingAsset,
      )
      toast.success('Withdrawal recorded')
      setWithdrawingAsset(null)
      setWithdrawAmount('')
      setWithdrawNote('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  async function onEditGoal(event: FormEvent) {
    event.preventDefault()
    if (!goal) return
    const targetParsed = parseAmountInput(goalTarget, currency)
    if (!targetParsed.ok) {
      toast.error(targetParsed.message)
      return
    }
    setBusy(true)
    try {
      await finance.editGoal(goal.id, {
        name: goalName,
        description: goalDescription.trim() || undefined,
        targetAmount: targetParsed.minor,
        targetDate: goalTargetDate,
        priority: goalPriority,
      })
      toast.success('Goal updated')
      setEditGoalOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  function openEditGoal() {
    if (!goal) return
    setGoalName(goal.name)
    setGoalDescription(goal.description ?? '')
    setGoalTarget(String(toMajorUnits(goal.targetAmount, currency)))
    setGoalTargetDate(goal.targetDate)
    setGoalPriority(goal.priority)
    setEditGoalOpen(true)
  }

  function openValueUpdate(asset: Asset) {
    setValueUpdateAsset(asset)
    setNewValue(String(toMajorUnits(asset.currentValue, currency)))
    setValueUpdateDate(asOf)
  }

  async function onValueUpdate(event: FormEvent) {
    event.preventDefault()
    if (!valueUpdateAsset) return
    const parsed = parseAmountInput(newValue, currency, { allowZero: true })
    if (!parsed.ok) {
      toast.error(parsed.message)
      return
    }
    setBusy(true)
    try {
      await finance.addTransaction(
        {
          assetId: valueUpdateAsset.id,
          goalId: goalId!,
          type: 'VALUE_UPDATE',
          amount: parsed.minor,
          date: valueUpdateDate,
        },
        valueUpdateAsset,
      )
      toast.success('Value updated')
      setValueUpdateAsset(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update')
    } finally {
      setBusy(false)
    }
  }

  const trackMessage =
    metrics.trackStatus === 'On Track'
      ? "You're on track ✨"
      : metrics.trackStatus === 'Ahead'
        ? "You're ahead of schedule 🚀"
        : metrics.trackStatus === 'Completed'
          ? 'Goal complete — well done! 🏆'
          : 'This goal needs a little more love.'

  return (
    <div className="space-y-6">
      <Link to="/wealth" className="hidden text-sm font-medium text-accent lg:inline">
        ← Back to wealth
      </Link>

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="hidden text-3xl font-semibold tracking-tight text-ink dark:text-white lg:block">
            {goal.name}
          </h1>
          <p className="text-sm text-ink-muted lg:mt-1">{trackMessage}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={openEditGoal}>
            Edit
          </Button>
          <Button variant="ghost" className="min-h-9 px-3 text-xs" onClick={() => setConfirm(true)}>
            Delete
          </Button>
        </div>
      </header>

      <CommandBar contextKey="goal" goalId={goalId} />

      <SegmentedControl
        value={tab}
        onChange={setTab}
        options={[
          { value: 'overview', label: 'Overview' },
          { value: 'assets', label: 'Assets' },
          { value: 'activity', label: 'Activity' },
        ]}
      />

      {tab === 'overview' ? (
        <GoalOverviewTab
          goal={goal}
          metrics={metrics}
          theme={theme}
          projectionData={projectionData}
          byCategory={byCategory}
          bySource={bySource}
          goalTotal={goalTotal}
          currency={currency}
        />
      ) : null}

      {tab === 'assets' ? (
        <GoalAssetsTab
          assets={filterAssets}
          allAssets={goalAssets}
          currency={currency}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          onAdd={() => setAssetOpen(true)}
          onEdit={openEditAsset}
          onWithdraw={openWithdraw}
          onValueUpdate={openValueUpdate}
          onDelete={setDeletingAsset}
        />
      ) : null}

      {tab === 'activity' ? (
        <Card variant="flat">
          <ActivityTimeline
            items={timelineItems}
            currency={currency}
            emptyMessage="No investments or withdrawals yet."
          />
        </Card>
      ) : null}

      <FormPanel
        open={withdrawingAsset !== null}
        onOpenChange={(open) => {
          if (!open) setWithdrawingAsset(null)
        }}
        title={`Withdraw from ${withdrawingAsset?.name ?? 'asset'}`}
      >
        <form className="space-y-4" onSubmit={onWithdraw}>
          <Field label="Amount">
            <Input
              inputMode="decimal"
              value={withdrawAmount}
              onChange={(event) => setWithdrawAmount(event.target.value)}
              placeholder={
                withdrawingAsset
                  ? `Max ${formatMoney(withdrawingAsset.currentValue, currency, { compact: true })}`
                  : undefined
              }
              required
            />
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={withdrawDate}
              onChange={(event) => setWithdrawDate(event.target.value)}
              required
            />
          </Field>
          <Field label="Note">
            <Input
              value={withdrawNote}
              onChange={(event) => setWithdrawNote(event.target.value)}
              placeholder="Optional"
            />
          </Field>
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? 'Saving…' : 'Record withdrawal'}
          </Button>
        </form>
      </FormPanel>

      <FormPanel open={editGoalOpen} onOpenChange={setEditGoalOpen} title="Edit goal">
        <form className="space-y-4" onSubmit={onEditGoal}>
          <GoalFormFields
            name={goalName}
            setName={setGoalName}
            description={goalDescription}
            setDescription={setGoalDescription}
            target={goalTarget}
            setTarget={setGoalTarget}
            targetDate={goalTargetDate}
            setTargetDate={setGoalTargetDate}
            priority={goalPriority}
            setPriority={setGoalPriority}
          />
          <Button type="submit" className="w-full" size="lg" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </FormPanel>

      <FormPanel open={assetOpen} onOpenChange={setAssetOpen} title="Add asset" wide>
        <AssetForm
          name={name}
          setName={setName}
          category={category}
          setCategory={setCategory}
          source={source}
          setSource={setSource}
          investmentType={investmentType}
          setInvestmentType={setInvestmentType}
          currentValue={currentValue}
          setCurrentValue={setCurrentValue}
          monthly={monthly}
          setMonthly={setMonthly}
          plannedDay={plannedDay}
          setPlannedDay={setPlannedDay}
          cagr={cagr}
          setCagr={setCagr}
          busy={busy}
          submitLabel="Save asset"
          onSubmit={onAddAsset}
        />
      </FormPanel>

      <FormPanel open={editAssetOpen} onOpenChange={setEditAssetOpen} title="Edit asset" wide>
        <AssetForm
          name={name}
          setName={setName}
          category={category}
          setCategory={setCategory}
          source={source}
          setSource={setSource}
          investmentType={investmentType}
          setInvestmentType={setInvestmentType}
          monthly={monthly}
          setMonthly={setMonthly}
          plannedDay={plannedDay}
          setPlannedDay={setPlannedDay}
          cagr={cagr}
          setCagr={setCagr}
          busy={busy}
          submitLabel="Save changes"
          onSubmit={onEditAsset}
          hideValue
        />
      </FormPanel>

      <FormPanel
        open={valueUpdateAsset !== null}
        onOpenChange={(open) => {
          if (!open) setValueUpdateAsset(null)
        }}
        title={`Update value — ${valueUpdateAsset?.name ?? 'asset'}`}
      >
        {valueUpdateAsset ? (
          <form className="space-y-4" onSubmit={onValueUpdate}>
            <div className="rounded-[16px] bg-surface px-4 py-4 dark:bg-surface-dark">
              <p className="text-sm text-ink-muted">Previous value</p>
              <p className="font-display mt-1 text-xl font-semibold text-ink dark:text-white">
                {formatMoney(valueUpdateAsset.currentValue, currency)}
              </p>
            </div>
            <Field label="New current value">
              <Input
                inputMode="decimal"
                value={newValue}
                onChange={(event) => setNewValue(event.target.value)}
                required
              />
            </Field>
            <Field label="Date">
              <Input
                type="date"
                value={valueUpdateDate}
                onChange={(event) => setValueUpdateDate(event.target.value)}
                required
              />
            </Field>
            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {busy ? 'Updating…' : 'Update value'}
            </Button>
          </form>
        ) : null}
      </FormPanel>

      <ConfirmBar
        open={deletingAsset !== null}
        title={`Delete ${deletingAsset?.name ?? 'asset'}?`}
        body="This will hide the asset and its transaction history from your goal."
        onCancel={() => setDeletingAsset(null)}
        onConfirm={() => {
          if (deletingAsset) {
            void finance.removeAsset(goalId!, deletingAsset.id)
            setDeletingAsset(null)
          }
        }}
      />

      <ConfirmBar
        open={deletingTx !== null}
        title="Delete this activity?"
        body="This will remove the transaction and adjust the asset amounts."
        onCancel={() => setDeletingTx(null)}
        onConfirm={() => {
          if (deletingTx) {
            const asset = finance.assets.find((entry) => entry.id === deletingTx.assetId)
            if (asset) void finance.removeTransaction(deletingTx, asset)
            setDeletingTx(null)
          }
        }}
      />

      <ConfirmBar
        open={confirm}
        title={`Delete ${goal.name}?`}
        body="This will hide the goal and its investment tracking from your dashboard."
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          void finance.removeGoal(goal.id).then(() => navigate('/wealth'))
        }}
      />
    </div>
  )
}

function GoalOverviewTab({
  goal,
  metrics,
  theme,
  projectionData,
  byCategory,
  bySource,
  goalTotal,
  currency,
}: {
  goal: Goal
  metrics: ReturnType<typeof calculateGoalMetrics>
  theme: GoalTheme
  projectionData: { label: string; projected: number; target: number }[]
  byCategory: { name: string; value: number }[]
  bySource: { name: string; value: number }[]
  goalTotal: number
  currency: SupportedCurrency
}) {
  const hasProjection = projectionData.length > 0
  const hasAllocation = byCategory.length > 0 || bySource.length > 0
  const twoColumns = hasProjection || hasAllocation

  return (
    <section
      className={
        twoColumns
          ? 'grid gap-4 lg:grid-cols-2 lg:items-stretch'
          : 'space-y-4'
      }
    >
      <Card className="flex h-full flex-col space-y-5">
        <div className="flex flex-col items-center text-center">
          <CircularProgress
            value={metrics.displayProgressPercent}
            size={168}
            strokeWidth={11}
            color={theme.accent}
            trackColor="rgba(102, 87, 232, 0.12)"
          >
            <p className="font-display text-2xl font-semibold text-ink dark:text-white">
              {formatPercent(metrics.displayProgressPercent, 1)}
            </p>
            <p className="mt-0.5 text-[10px] text-ink-muted">complete</p>
          </CircularProgress>
          <p className="font-display mt-4 text-2xl font-semibold text-ink dark:text-white">
            {formatMoney(metrics.currentValue, currency, { compact: true })}
          </p>
          <p className="text-sm text-ink-muted">
            of {formatMoney(metrics.targetAmount, currency, { compact: true })}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-[14px] bg-mint/10 p-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">Monthly</p>
            <p className="font-display mt-1 text-sm font-semibold text-ink dark:text-white">
              {formatMoney(metrics.monthlyPlannedInvestment, currency, { compact: true })}
            </p>
          </div>
          <div className="rounded-[14px] bg-accent/10 p-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">Target</p>
            <p className="font-display mt-1 text-sm font-semibold text-ink dark:text-white">
              {goal.targetDate.slice(0, 4)}
            </p>
          </div>
          <div className="rounded-[14px] bg-yellow/15 p-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">Expected</p>
            <p className="font-display mt-1 text-sm font-semibold text-ink dark:text-white">
              {formatPercent(metrics.expectedCagr)}
            </p>
          </div>
        </div>

        <GoalJourney
          embedded
          current={metrics.currentValue}
          target={metrics.targetAmount}
          currency={currency}
          color={theme.accent}
        />

        <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-ink/5 pt-4 text-sm dark:border-white/5">
          <div>
            <dt className="text-ink-muted">Invested</dt>
            <dd className="font-semibold text-ink dark:text-white">
              {formatMoney(metrics.investedAmount, currency, { compact: true })}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Withdrawn</dt>
            <dd className="font-semibold text-ink dark:text-white">
              {formatMoney(metrics.totalWithdrawals, currency, { compact: true })}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Net invested</dt>
            <dd className="font-semibold text-ink dark:text-white">
              {formatMoney(metrics.netInvestedAmount, currency, { compact: true })}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Needed monthly</dt>
            <dd className="font-semibold text-ink dark:text-white">
              {formatMoney(metrics.requiredMonthlyInvestment, currency, { compact: true })}
            </dd>
          </div>
        </dl>
      </Card>

      {twoColumns ? (
        <Card className="flex h-full flex-col gap-5">
          {hasProjection ? (
            <div>
              <h3 className="text-sm font-semibold text-ink dark:text-white">Projected growth</h3>
              <p className="mt-0.5 text-xs text-ink-muted">Target path vs projected value</p>
              <div className="mt-3 h-44 shrink-0 lg:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={projectionData} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-ink/10" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value: number) =>
                        formatMoney(value, currency, { compact: true })
                      }
                    />
                    <Tooltip
                      formatter={(value) =>
                        formatMoney(Number(value ?? 0), currency, { compact: true })
                      }
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid rgba(0,0,0,0.08)',
                        fontSize: 13,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="projected" name="Projected" stroke="#6657E8" dot={false} />
                    <Line
                      type="monotone"
                      dataKey="target"
                      name="Target"
                      stroke="#F4C95D"
                      dot={false}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}

          {hasAllocation ? (
            <div
              className={
                hasProjection
                  ? 'mt-auto space-y-5 border-t border-ink/5 pt-5 dark:border-white/5'
                  : 'mt-auto space-y-5'
              }
            >
              {byCategory.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-ink dark:text-white">By category</h3>
                  <div className="mt-3">
                    <DonutChart
                      compact
                      data={byCategory}
                      centerLabel="Total"
                      centerValue={formatMoney(goalTotal, currency, { compact: true })}
                      formatValue={(value) => formatMoney(value, currency, { compact: true })}
                    />
                  </div>
                </div>
              ) : null}
              {bySource.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-ink dark:text-white">By source</h3>
                  <div className="mt-3">
                    <AllocationList
                      data={bySource}
                      formatValue={(value) => formatMoney(value, currency, { compact: true })}
                      empty="Add assets to see source allocation"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </Card>
      ) : null}
    </section>
  )
}

function GoalAssetsTab({
  assets,
  allAssets,
  currency,
  filterCategory,
  setFilterCategory,
  onAdd,
  onEdit,
  onWithdraw,
  onValueUpdate,
  onDelete,
}: {
  assets: Asset[]
  allAssets: Asset[]
  currency: SupportedCurrency
  filterCategory: string
  setFilterCategory: (value: string) => void
  onAdd: () => void
  onEdit: (asset: Asset) => void
  onWithdraw: (asset: Asset) => void
  onValueUpdate: (asset: Asset) => void
  onDelete: (asset: Asset) => void
}) {
  return (
    <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink-muted">
            {filterCategory === 'all'
              ? `${allAssets.length} asset${allAssets.length === 1 ? '' : 's'} in this goal`
              : `Showing ${ASSET_CATEGORY_LABELS[filterCategory as keyof typeof ASSET_CATEGORY_LABELS] ?? filterCategory}`}
          </p>
          <Button onClick={onAdd} className="shrink-0">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add asset</span>
          </Button>
        </div>

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
            emoji="📈"
            title={allAssets.length === 0 ? 'No assets yet' : 'No assets in this view'}
            body={
              allAssets.length === 0
                ? 'Add a mutual fund, FD, ETF or other asset to this goal.'
                : 'Try another category or add a matching asset.'
            }
            action={
              allAssets.length === 0 ? <Button onClick={onAdd}>Add asset</Button> : undefined
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {assets.map((asset) => (
              <AssetRow
                key={asset.id}
                asset={asset}
                currency={currency}
                onEdit={() => onEdit(asset)}
                onWithdraw={() => onWithdraw(asset)}
                onValueUpdate={() => onValueUpdate(asset)}
                onDelete={() => onDelete(asset)}
              />
            ))}
          </div>
        )}
    </div>
  )
}

function AssetForm({
  name,
  setName,
  category,
  setCategory,
  source,
  setSource,
  investmentType,
  setInvestmentType,
  currentValue,
  setCurrentValue,
  monthly,
  setMonthly,
  plannedDay,
  setPlannedDay,
  cagr,
  setCagr,
  busy,
  submitLabel,
  onSubmit,
  hideValue,
}: {
  name: string
  setName: (v: string) => void
  category: AssetCategory
  setCategory: (v: AssetCategory) => void
  source: AssetSource
  setSource: (v: AssetSource) => void
  investmentType: InvestmentType
  setInvestmentType: (v: InvestmentType) => void
  currentValue?: string
  setCurrentValue?: (v: string) => void
  monthly: string
  setMonthly: (v: string) => void
  plannedDay: string
  setPlannedDay: (v: string) => void
  cagr: string
  setCagr: (v: string) => void
  busy: boolean
  submitLabel: string
  onSubmit: (e: FormEvent) => void
  hideValue?: boolean
}) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value as AssetCategory)}>
            {Object.entries(ASSET_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Source">
          <Select value={source} onChange={(e) => setSource(e.target.value as AssetSource)}>
            {Object.entries(ASSET_SOURCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Type">
          <Select value={investmentType} onChange={(e) => setInvestmentType(e.target.value as InvestmentType)}>
            <option value="SIP">SIP</option>
            <option value="LUMP_SUM">One-time</option>
            <option value="BOTH">Both</option>
          </Select>
        </Field>
        {!hideValue && currentValue !== undefined && setCurrentValue ? (
          <Field label="Current value">
            <Input inputMode="decimal" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />
          </Field>
        ) : null}
        <Field label="Monthly SIP">
          <Input inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value)} />
        </Field>
        {monthly ? (
          <Field label="SIP day of month">
            <Input
              inputMode="numeric"
              value={plannedDay}
              onChange={(e) => setPlannedDay(e.target.value)}
              placeholder="1–31"
            />
          </Field>
        ) : null}
        <Field label="Expected CAGR %">
          <Input inputMode="decimal" value={cagr} onChange={(e) => setCagr(e.target.value)} />
        </Field>
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={busy}>
        {busy ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}

function AssetRow({
  asset,
  currency,
  onEdit,
  onWithdraw,
  onValueUpdate,
  onDelete,
}: {
  asset: Asset
  currency: SupportedCurrency
  onEdit: () => void
  onWithdraw: () => void
  onValueUpdate: () => void
  onDelete: () => void
}) {
  const gain = assetGainLoss(asset)
  const net = assetNetInvested(asset)
  const gainPercent = net > 0 ? (gain / net) * 100 : 0
  const isGain = gain >= 0

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-ink dark:text-white">{asset.name}</h3>
          <p className="mt-0.5 text-sm text-ink-muted">
            {ASSET_CATEGORY_LABELS[asset.category]} · {ASSET_SOURCE_LABELS[asset.source]}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-semibold text-ink dark:text-white">
            {formatMoney(asset.currentValue, currency, { compact: true })}
          </p>
          {net > 0 ? (
            <p
              className={`text-xs font-medium ${isGain ? 'text-success' : 'text-danger'}`}
              title="Return on net invested (current value minus withdrawals, vs amount put in)"
            >
              {isGain ? '↑' : '↓'} {formatMoney(Math.abs(gain), currency, { compact: true })}
              <span className="ml-1">({formatPercent(Math.abs(gainPercent), 1)} return)</span>
            </p>
          ) : (
            <p className="text-xs text-ink-muted">No cost basis yet</p>
          )}
        </div>
      </div>
      {asset.monthlyInvestment ? (
        <p className="mt-2 text-xs text-ink-muted">
          SIP {formatMoney(asset.monthlyInvestment, currency, { compact: true })} / month
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={onValueUpdate}>
          Update value
        </Button>
        <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={onWithdraw}>
          Withdraw
        </Button>
        <Button variant="ghost" className="min-h-9 px-3 text-xs text-danger" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </Card>
  )
}
