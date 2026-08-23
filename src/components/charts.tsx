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
import { cn } from '@/lib/utils'

const CHART_COLORS = [
  '#0f766e',
  '#0d9488',
  '#14b8a6',
  '#f59e0b',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#22c55e',
  '#ef4444',
  '#64748b',
]

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
}: {
  data: ChartDatum[]
  centerLabel?: string
  centerValue?: string
  className?: string
  formatValue?: (value: number) => string
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

  return (
    <div
      className={cn('flex flex-col items-center gap-4 sm:flex-row sm:gap-6', className)}
    >
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={2}
              strokeWidth={0}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip
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
            {centerValue ? <p className="text-lg font-semibold">{centerValue}</p> : null}
            {centerLabel ? (
              <p className="text-xs text-stone-400 dark:text-stone-500">{centerLabel}</p>
            ) : null}
          </div>
        </div>
      </div>
      <ul className="w-full space-y-1.5 text-sm">
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
                      : 'bg-teal-600',
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
}: {
  title: string
  subtitle?: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="rounded-3xl border border-stone-200/80 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-stone-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
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
}: {
  data: { label: string; wealth: number; target: number }[]
  formatValue?: (value: number) => string
}) {
  if (data.length === 0) {
    return (
      <div className="grid h-44 place-items-center text-sm text-stone-400">No projection data</div>
    )
  }
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
            name="Projected wealth"
            stroke="#0f766e"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="target"
            name="Target path"
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
