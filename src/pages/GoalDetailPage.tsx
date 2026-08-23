import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Button,
  Card,
  ConfirmBar,
  EmptyState,
  Field,
  Input,
  Progress,
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
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 8),
    [finance.transactions, goalId],
  )

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

  if (!goal || !metrics) {
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
      toast.success('Asset added')
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

  return (
    <div className="space-y-5">
      <Link to="/wealth" className="text-sm font-medium text-teal-700">
        Back to wealth
      </Link>
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{goal.name}</h1>
          <p className="mt-1 text-stone-500">{metrics.trackStatus}</p>
        </div>
        <Button variant="ghost" onClick={() => setConfirm(true)}>
          Delete
        </Button>
      </header>

      <Card>
        <p className="text-sm text-stone-500">Progress</p>
        <p className="mt-1 text-3xl font-semibold">
          {formatMoney(metrics.currentValue, currency, { compact: true })}
          <span className="text-lg font-medium text-stone-400">
            {' '}
            / {formatMoney(metrics.targetAmount, currency, { compact: true })}
          </span>
        </p>
        <div className="mt-3">
          <Progress value={metrics.displayProgressPercent} />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-stone-500">Money invested</dt>
            <dd className="font-semibold">
              {formatMoney(metrics.investedAmount, currency, { compact: true })}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Money withdrawn</dt>
            <dd className="font-semibold">
              {formatMoney(metrics.totalWithdrawals, currency, { compact: true })}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Net invested</dt>
            <dd className="font-semibold">
              {formatMoney(metrics.netInvestedAmount, currency, { compact: true })}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Monthly plan</dt>
            <dd className="font-semibold">
              {formatMoney(metrics.monthlyPlannedInvestment, currency, { compact: true })}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Needed monthly</dt>
            <dd className="font-semibold">
              {formatMoney(metrics.requiredMonthlyInvestment, currency, {
                compact: true,
              })}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Expected CAGR</dt>
            <dd className="font-semibold">{formatPercent(metrics.expectedCagr)}</dd>
          </div>
        </dl>
        <div className="mt-4 rounded-2xl bg-stone-50 p-3 text-sm dark:bg-stone-800">
          <p className="text-stone-500">Projection</p>
          <p className="mt-1 font-semibold">
            {formatMoney(projection?.projected ?? 0, currency, { compact: true })}{' '}
            <span className="text-stone-400">by {goal.targetDate}</span>
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {projection?.onTrack
              ? 'Projected to meet your target.'
              : `Approximately ${formatMoney(projection?.shortfall ?? 0, currency, { compact: true })} may be needed to reach your target.`}
          </p>
        </div>
      </Card>

      {projectionData.length > 0 ? (
        <ChartCard
          title="Projected growth"
          subtitle="Straight-line target vs projected value"
        >
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={projectionData}
                margin={{ top: 5, right: 8, bottom: 0, left: -18 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
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
                    border: '1px solid #e7e5e4',
                    fontSize: 13,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="projected"
                  name="Projected"
                  stroke="#0f766e"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Target"
                  stroke="#f59e0b"
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
          <h2 className="text-lg font-semibold">Assets</h2>
          <Button onClick={() => setAssetOpen(true)}>Add asset</Button>
        </div>
        {assets.length === 0 ? (
          <EmptyState
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
        <h2 className="text-lg font-semibold">Recent activity</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-stone-500">No investments or withdrawals yet.</p>
        ) : (
          recent.map((item) => {
            const asset = finance.assets.find((a) => a.id === item.assetId)
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-stone-100 p-3 text-sm dark:border-stone-800"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {item.type === 'INVESTMENT'
                      ? 'Invested'
                      : item.type === 'WITHDRAWAL'
                        ? 'Withdrawn'
                        : 'Value updated'}{' '}
                    · {asset?.name ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-stone-500">{item.date}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-medium">
                    {formatMoney(item.amount, currency, { compact: true })}
                  </span>
                  <Button
                    variant="ghost"
                    className="min-h-8 px-2 text-xs text-red-600"
                    onClick={() => setDeletingTx(item)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </section>

      <Sheet open={assetOpen} onOpenChange={setAssetOpen} title="Add asset">
        <form className="space-y-4" onSubmit={onAddAsset}>
          <Field label="Name">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </Field>
          <Field label="Category">
            <Select
              value={category}
              onChange={(event) => setCategory(event.target.value as AssetCategory)}
            >
              {Object.entries(ASSET_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Source">
            <Select
              value={source}
              onChange={(event) => setSource(event.target.value as AssetSource)}
            >
              {Object.entries(ASSET_SOURCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Type">
            <Select
              value={investmentType}
              onChange={(event) =>
                setInvestmentType(event.target.value as InvestmentType)
              }
            >
              <option value="SIP">SIP</option>
              <option value="LUMP_SUM">One-time</option>
              <option value="BOTH">Both</option>
            </Select>
          </Field>
          <Field label="Current value">
            <Input
              inputMode="decimal"
              value={currentValue}
              onChange={(event) => setCurrentValue(event.target.value)}
            />
          </Field>
          <Field label="Monthly SIP">
            <Input
              inputMode="decimal"
              value={monthly}
              onChange={(event) => setMonthly(event.target.value)}
            />
          </Field>
          <Field label="Expected CAGR %">
            <Input
              inputMode="decimal"
              value={cagr}
              onChange={(event) => setCagr(event.target.value)}
            />
          </Field>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Saving…' : 'Save asset'}
          </Button>
        </form>
      </Sheet>

      <Sheet open={editAssetOpen} onOpenChange={setEditAssetOpen} title="Edit asset">
        <form className="space-y-4" onSubmit={onEditAsset}>
          <Field label="Name">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </Field>
          <Field label="Category">
            <Select
              value={category}
              onChange={(event) => setCategory(event.target.value as AssetCategory)}
            >
              {Object.entries(ASSET_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Source">
            <Select
              value={source}
              onChange={(event) => setSource(event.target.value as AssetSource)}
            >
              {Object.entries(ASSET_SOURCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Type">
            <Select
              value={investmentType}
              onChange={(event) =>
                setInvestmentType(event.target.value as InvestmentType)
              }
            >
              <option value="SIP">SIP</option>
              <option value="LUMP_SUM">One-time</option>
              <option value="BOTH">Both</option>
            </Select>
          </Field>
          <Field label="Monthly SIP">
            <Input
              inputMode="decimal"
              value={monthly}
              onChange={(event) => setMonthly(event.target.value)}
            />
          </Field>
          <Field label="Expected CAGR %">
            <Input
              inputMode="decimal"
              value={cagr}
              onChange={(event) => setCagr(event.target.value)}
            />
          </Field>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
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
        body="This will remove the transaction and adjust the asset's invested/withdrawn amounts."
        onCancel={() => setDeletingTx(null)}
        onConfirm={() => {
          if (deletingTx) {
            const asset = finance.assets.find((a) => a.id === deletingTx.assetId)
            if (asset) {
              void finance.removeTransaction(deletingTx, asset)
            }
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
        <div>
          <h3 className="font-semibold">{asset.name}</h3>
          <p className="mt-1 text-sm text-stone-500">
            {ASSET_CATEGORY_LABELS[asset.category]} · {ASSET_SOURCE_LABELS[asset.source]}
          </p>
        </div>
        <span
          className={
            gain >= 0
              ? 'text-xs font-semibold text-emerald-700'
              : 'text-xs font-semibold text-red-700'
          }
        >
          {gain >= 0 ? '+' : ''}
          {formatMoney(gain, currency, { compact: true })}
          <span className="ml-1">({formatPercent(gainPercent, 1)})</span>
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" className="min-h-9 px-3 text-xs" onClick={onEdit}>
          Edit
        </Button>
        <Button
          variant="ghost"
          className="min-h-9 px-3 text-xs text-red-600"
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div>
          <dt className="text-stone-500">Invested</dt>
          <dd className="font-semibold">
            {formatMoney(asset.investedAmount, currency, { compact: true })}
          </dd>
        </div>
        <div>
          <dt className="text-stone-500">Current</dt>
          <dd className="font-semibold">
            {formatMoney(asset.currentValue, currency, { compact: true })}
          </dd>
        </div>
        {asset.totalWithdrawals > 0 ? (
          <div>
            <dt className="text-stone-500">Withdrawn</dt>
            <dd className="font-semibold">
              {formatMoney(asset.totalWithdrawals, currency, { compact: true })}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-stone-500">Net invested</dt>
          <dd className="font-semibold">
            {formatMoney(net, currency, { compact: true })}
          </dd>
        </div>
        {asset.monthlyInvestment ? (
          <div>
            <dt className="text-stone-500">Monthly SIP</dt>
            <dd className="font-semibold">
              {formatMoney(asset.monthlyInvestment, currency, { compact: true })}
            </dd>
          </div>
        ) : null}
        {asset.expectedCagr != null ? (
          <div>
            <dt className="text-stone-500">Expected CAGR</dt>
            <dd className="font-semibold">{formatPercent(asset.expectedCagr)}</dd>
          </div>
        ) : null}
      </dl>
    </Card>
  )
}
