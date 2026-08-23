import { useMemo, type ReactNode } from 'react'
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { chartColors } from '@/lib/design-tokens'
import { cn } from '@/lib/utils'

const CHART_COLORS = [...chartColors]

export interface ChartDatum {
  name: string
  value: number
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  className,
  formatValue,
  size = 'default',
  compact = false,
}: {
  data: ChartDatum[]
  centerLabel?: string
  centerValue?: string
  className?: string
  formatValue?: (value: number) => string
  size?: 'default' | 'large'
  compact?: boolean
}) {
  const { chartData, total } = useMemo(() => {
    const filtered = data.filter((item) => item.value > 0)
    return {
      chartData: filtered.map((item, index) => ({
        ...item,
        color: CHART_COLORS[index % CHART_COLORS.length],
      })),
      total: filtered.reduce((sum, item) => sum + item.value, 0),
    }
  }, [data])

  if (chartData.length === 0) {
    return (
      <div
        className={cn(
          'grid h-44 place-items-center text-sm text-stone-400 dark:text-stone-500',
          className,
        )}
      >
        No data yet
      </div>
    )
  }

  const chartSize = compact ? 'h-36 w-36' : size === 'large' ? 'h-48 w-48' : 'h-44 w-44'
  const innerRadius = compact ? 48 : size === 'large' ? 62 : 58
  const outerRadius = compact ? 66 : size === 'large' ? 86 : 82

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4',
        compact && 'h-full',
        className,
      )}
    >
      <div className={cn('relative shrink-0 outline-none [&_*]:outline-none', chartSize)}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart style={{ outline: 'none' }}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              strokeWidth={0}
              isAnimationActive={false}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip
              trigger="hover"
              formatter={(value) =>
                formatValue
                  ? formatValue(Number(value ?? 0))
                  : Number(value ?? 0).toLocaleString()
              }
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #e7e5e4',
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            {centerValue ? (
              <p className={cn('font-semibold', compact ? 'text-base' : 'text-lg')}>{centerValue}</p>
            ) : null}
            {centerLabel ? (
              <p className="text-xs text-stone-400 dark:text-stone-500">{centerLabel}</p>
            ) : null}
          </div>
        </div>
      </div>
      <ul className={cn('w-full space-y-1', compact ? 'text-xs' : 'space-y-1.5 text-sm')}>
        {chartData.map((item) => (
          <li key={item.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="font-medium">
              {formatValue ? formatValue(item.value) : item.value.toLocaleString()}
              <span className="ml-1 text-xs text-stone-400">
                {total > 0 ? `${((item.value / total) * 100).toFixed(0)}%` : ''}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AllocationList({
  data,
  formatValue,
  empty = 'No data yet',
}: {
  data: ChartDatum[]
  formatValue?: (value: number) => string
  empty?: string
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  if (data.length === 0 || total <= 0) {
    return <p className="py-6 text-center text-sm text-stone-400">{empty}</p>
  }
  return (
    <ul className="space-y-2.5 text-sm">
      {data.map((item, index) => {
        const color = CHART_COLORS[index % CHART_COLORS.length]
        const percent = total > 0 ? (item.value / total) * 100 : 0
        return (
          <li key={item.name}>
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="font-medium">
                {formatValue ? formatValue(item.value) : item.value.toLocaleString()}
                <span className="ml-1 text-xs text-stone-400">{percent.toFixed(0)}%</span>
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, percent)}%`, backgroundColor: color }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function CashFlowBars({
  items,
}: {
  items: { label: string; value: number; positive?: boolean; max: number }[]
}) {
  return (
    <ul className="space-y-2.5 text-sm">
      {items.map((item) => {
        const width =
          item.max > 0 ? Math.max(4, (Math.abs(item.value) / item.max) * 100) : 0
        return (
          <li key={item.label}>
            <div className="flex items-center justify-between">
              <span className="text-stone-500 dark:text-stone-400">{item.label}</span>
              <span className="font-semibold">{item.value.toLocaleString()}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
              <div
                className={cn(
                  'h-full rounded-full',
                  item.positive
                    ? 'bg-emerald-600'
                    : item.value < 0
                      ? 'bg-red-600'
                      : 'bg-accent',
                )}
                style={{ width: `${Math.min(100, width)}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function ChartCard({
  title,
  subtitle,
  children,
  action,
  className,
}: {
  title?: string
  subtitle?: string
  children: ReactNode
  action?: ReactNode
  className?: string
}) {
  const hasHeader = title || subtitle || action

  return (
    <section
      className={cn(
        'rounded-[20px] border border-ink/5 bg-surface p-4 shadow-[var(--shadow-soft)] dark:border-white/5 dark:bg-surface-dark',
        className,
      )}
    >
      {hasHeader ? (
        <div className="mb-3 flex shrink-0 items-start justify-between gap-3">
          <div>
            {title ? <h3 className="font-semibold text-ink dark:text-white">{title}</h3> : null}
            {subtitle ? <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      <div>{children}</div>
    </section>
  )
}

export function GoalProgressBars({
  items,
  formatValue,
}: {
  items: { name: string; current: number; target: number }[]
  formatValue?: (value: number) => string
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-stone-400">No goals yet</p>
  }
  return (
    <ul className="space-y-3 text-sm">
      {items.map((item) => {
        const percent = item.target > 0 ? Math.min(100, (item.current / item.target) * 100) : 0
        return (
          <li key={item.name}>
            <div className="flex items-center justify-between gap-3">
              <span className="truncate font-medium">{item.name}</span>
              <span className="shrink-0 text-xs text-stone-500">
                {formatValue ? formatValue(item.current) : item.current} /{' '}
                {formatValue ? formatValue(item.target) : item.target}
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
              <div
                className="h-full rounded-full bg-teal-600"
                style={{ width: `${percent}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function WealthGrowthChart({
  data,
  formatValue,
  showTarget = true,
}: {
  data: { label: string; wealth: number; target: number }[]
  formatValue?: (value: number) => string
  showTarget?: boolean
}) {
  if (data.length === 0) {
    return (
      <div className="grid h-44 place-items-center text-sm text-stone-400">No projection data</div>
    )
  }
  const hasTarget = showTarget && data.some((point) => point.target > 0)
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-stone-200 dark:stroke-stone-800" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(value) =>
              formatValue ? formatValue(Number(value)) : Number(value).toLocaleString()
            }
            width={56}
          />
          <RechartsTooltip
            formatter={(value) =>
              formatValue ? formatValue(Number(value ?? 0)) : Number(value ?? 0).toLocaleString()
            }
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #e7e5e4',
              fontSize: 13,
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="wealth"
            name={hasTarget ? 'Projected wealth' : 'Wealth'}
            stroke="#0f766e"
            strokeWidth={2}
            dot={false}
          />
          {hasTarget ? (
            <Line
              type="monotone"
              dataKey="target"
              name="Target path"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          ) : null}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
