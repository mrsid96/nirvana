import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useSetPageTitle } from '@/contexts/PageTitleContext'
import { ActivityTimeline, type TimelineItem } from '@/components/ActivityTimeline'
import { CircularProgress } from '@/components/CircularProgress'
import { GoalJourney } from '@/components/GoalJourney'
import { GoalDetailSkeleton } from '@/components/Skeleton'
import {
  Button,
  Card,
  ConfirmBar,
  EmptyState,
  Field,
  Input,
  SectionTitle,
  Select,
  Sheet,
} from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useFinance } from '@/contexts/FinanceContext'
import {
  calculateGoalMetrics,
  assetGainLoss,
  assetNetInvested,
} from '@/lib/calculations/goals'
import { buildGoalProjection } from '@/lib/calculations/projections'
import { todayIsoDate } from '@/lib/formatters/dates'
import { formatMoney, formatPercent } from '@/lib/formatters/currency'
import { getGoalTheme } from '@/lib/goal-theme'
import { toMajorUnits, toMinorUnits } from '@/lib/money'
import {
  ASSET_CATEGORY_LABELS,
  ASSET_SOURCE_LABELS,
  type Asset,
  type AssetCategory,
  type AssetSource,
  type InvestmentType,
} from '@/types/asset'
import type { SupportedCurrency } from '@/types/user'
import type { AssetTransaction } from '@/types/transaction'
import { ChartCard, DonutChart } from '@/components/charts'
import { allocationByCategory } from '@/lib/calculations/analytics'
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

export function GoalDetailPage() {
  const { goalId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const finance = useFinance()
  const currency = profile?.currency ?? 'INR'
  const asOf = todayIsoDate()
  const goal = finance.goals.find((item) => item.id === goalId)
  const assets = finance.assets.filter((item) => item.goalId === goalId)
  const metrics = goal ? calculateGoalMetrics(goal, finance.assets, asOf) : null
  const theme = goal ? getGoalTheme(goal.name) : null
  useSetPageTitle(goal?.name ?? null)

  const [assetOpen, setAssetOpen] = useState(false)
  const [editAssetOpen, setEditAssetOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null)
  const [deletingTx, setDeletingTx] = useState<AssetTransaction | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<AssetCategory>('MF')
  const [source, setSource] = useState<AssetSource>('ZERODHA')
  const [investmentType, setInvestmentType] = useState<InvestmentType>('SIP')
  const [currentValue, setCurrentValue] = useState('')
  const [monthly, setMonthly] = useState('')
  const [cagr, setCagr] = useState('12')
  const [busy, setBusy] = useState(false)

  const recent = useMemo(
    () =>
      finance.transactions
        .filter((item) => item.goalId === goalId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [finance.transactions, goalId],
  )

  const timelineItems = useMemo((): TimelineItem[] => {
    return recent.map((item) => {
      const asset = finance.assets.find((a) => a.id === item.assetId)
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

  const categoryAllocation = useMemo(() => {
    const data = allocationByCategory(
      finance.assets.filter((item) => item.goalId === goalId),
    )
    return data.map((item) => ({
      name:
        ASSET_CATEGORY_LABELS[item.name as keyof typeof ASSET_CATEGORY_LABELS] ??
        item.name,
      value: item.value,
    }))
  }, [finance.assets, goalId])

  const projectionData = projection?.points ?? []

  if (finance.loading) return <GoalDetailSkeleton />

  if (!goal || !metrics || !theme) {
    return <EmptyState title="Goal not found" body="It may have been removed." />
  }

  async function onAddAsset(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      const value = toMinorUnits(Number(currentValue || 0), currency)
      await finance.addAsset({
        goalId: goalId!,
        name,
        category,
        source,
        investmentType,
        investedAmount: value,
        currentValue: value,
        totalWithdrawals: 0,
        expectedCagr: Number(cagr) || undefined,
        monthlyInvestment: monthly ? toMinorUnits(Number(monthly), currency) : undefined,
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
    setCagr(asset.expectedCagr != null ? String(asset.expectedCagr) : '12')
    setEditAssetOpen(true)
  }

  async function onEditAsset(event: FormEvent) {
    event.preventDefault()
    if (!editingAsset) return
    setBusy(true)
    try {
      await finance.editAsset(goalId!, editingAsset.id, {
        name,
        category,
        source,
        investmentType,
        expectedCagr: Number(cagr) || undefined,
        monthlyInvestment: monthly ? toMinorUnits(Number(monthly), currency) : undefined,
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
        Back to wealth
      </Link>

      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="hidden text-3xl font-semibold tracking-tight text-ink dark:text-white lg:block">
            {goal.name}
          </h1>
          <p className="font-serif text-sm italic text-ink-muted lg:mt-1">
            Your future, one step at a time.
          </p>
        </div>
        <Button variant="ghost" onClick={() => setConfirm(true)}>
          Delete
        </Button>
      </header>

      <div className="flex flex-col items-center py-2">
        <CircularProgress
          value={metrics.displayProgressPercent}
          size={220}
          strokeWidth={12}
          color={theme.accent}
          trackColor="rgba(102, 87, 232, 0.12)"
        >
          <p className="font-display text-3xl font-semibold text-ink dark:text-white">
            {formatPercent(metrics.displayProgressPercent, 1)}
          </p>
          <p className="mt-1 text-xs text-ink-muted">complete</p>
        </CircularProgress>
        <p className="font-display mt-4 text-2xl font-semibold text-ink dark:text-white">
          {formatMoney(metrics.currentValue, currency, { compact: true })}
        </p>
        <p className="text-sm text-ink-muted">
          of {formatMoney(metrics.targetAmount, currency, { compact: true })}
        </p>
        <p className="mt-2 rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
          {trackMessage}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-[14px] bg-mint/10 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">Monthly</p>
          <p className="font-display mt-1 text-sm font-semibold text-ink dark:text-white">
            {formatMoney(metrics.monthlyPlannedInvestment, currency, { compact: true })}
          </p>
        </div>
        <div className="rounded-[14px] bg-accent/10 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">Target</p>
          <p className="font-display mt-1 text-sm font-semibold text-ink dark:text-white">
            {goal.targetDate.slice(0, 4)}
          </p>
        </div>
        <div className="rounded-[14px] bg-yellow/15 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">Expected</p>
          <p className="font-display mt-1 text-sm font-semibold text-ink dark:text-white">
            {formatPercent(metrics.expectedCagr)}
          </p>
        </div>
      </div>

      <GoalJourney
        current={metrics.currentValue}
        target={metrics.targetAmount}
        currency={currency}
        color={theme.accent}
      />

      <Card variant="flat">
        <dl className="grid grid-cols-2 gap-3 text-sm">
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
        <div className="mt-4 rounded-[14px] bg-accent/5 p-3 text-sm">
          <p className="text-ink-muted">Projection by {goal.targetDate}</p>
          <p className="mt-1 font-semibold text-ink dark:text-white">
            {formatMoney(projection?.projected ?? 0, currency, { compact: true })}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {projection?.onTrack
              ? 'Projected to meet your target.'
              : `~${formatMoney(projection?.shortfall ?? 0, currency, { compact: true })} gap to close.`}
          </p>
        </div>
      </Card>

      {projectionData.length > 0 ? (
        <ChartCard title="Projected growth" subtitle="Target path vs projected value">
          <div className="h-48">
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
                  contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', fontSize: 13 }}
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
        </ChartCard>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionTitle title="Assets" />
          <Button variant="soft" onClick={() => setAssetOpen(true)}>
            Add asset
          </Button>
        </div>
        {assets.length === 0 ? (
          <EmptyState
            emoji="📈"
            title="No assets yet"
            body="Add a mutual fund, FD, ETF or other asset to this goal."
          />
        ) : (
          assets.map((asset) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              currency={currency}
              onEdit={() => openEditAsset(asset)}
              onDelete={() => setDeletingAsset(asset)}
            />
          ))
        )}
      </section>

      {categoryAllocation.length > 0 ? (
        <ChartCard title="Asset allocation" subtitle="Mix within this goal">
          <DonutChart
            data={categoryAllocation}
            formatValue={(value) => formatMoney(value, currency, { compact: true })}
          />
        </ChartCard>
      ) : null}

      <section className="space-y-3">
        <SectionTitle title="Activity" subtitle="Recent investments and withdrawals" />
        <ActivityTimeline
          items={timelineItems}
          currency={currency}
          emptyMessage="No investments or withdrawals yet."
        />
      </section>

      <Sheet open={assetOpen} onOpenChange={setAssetOpen} title="Add asset">
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
          cagr={cagr}
          setCagr={setCagr}
          busy={busy}
          submitLabel="Save asset"
          onSubmit={onAddAsset}
        />
      </Sheet>

      <Sheet open={editAssetOpen} onOpenChange={setEditAssetOpen} title="Edit asset">
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
          cagr={cagr}
          setCagr={setCagr}
          busy={busy}
          submitLabel="Save changes"
          onSubmit={onEditAsset}
          hideValue
        />
      </Sheet>

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
            const asset = finance.assets.find((a) => a.id === deletingTx.assetId)
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
  cagr: string
  setCagr: (v: string) => void
  busy: boolean
  submitLabel: string
  onSubmit: (e: FormEvent) => void
  hideValue?: boolean
}) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
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
      <Field label="Expected CAGR %">
        <Input inputMode="decimal" value={cagr} onChange={(e) => setCagr(e.target.value)} />
      </Field>
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
  onDelete,
}: {
  asset: Asset
  currency: SupportedCurrency
  onEdit: () => void
  onDelete: () => void
}) {
  const gain = assetGainLoss(asset)
  const net = assetNetInvested(asset)
  const gainPercent = net > 0 ? (gain / net) * 100 : 0

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
          <p className={`text-xs font-medium ${gain >= 0 ? 'text-success' : 'text-danger'}`}>
            {gain >= 0 ? '↑' : '↓'} {formatMoney(Math.abs(gain), currency, { compact: true })}
            <span className="ml-1">({formatPercent(Math.abs(gainPercent), 1)})</span>
          </p>
        </div>
      </div>
      {asset.monthlyInvestment ? (
        <p className="mt-2 text-xs text-ink-muted">
          SIP {formatMoney(asset.monthlyInvestment, currency, { compact: true })} / month
        </p>
      ) : null}
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="ghost" className="min-h-9 px-3 text-xs text-danger" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </Card>
  )
}
