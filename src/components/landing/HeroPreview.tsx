import {
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  Target,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const cashFlow = [
  { label: 'Income', value: '₹1.8L', tone: 'from-mint to-emerald-400', width: 'w-full' },
  { label: 'Spend', value: '₹64k', tone: 'from-peach to-orange-400', width: 'w-[62%]' },
  { label: 'Invest', value: '₹45k', tone: 'from-accent to-violet-500', width: 'w-[48%]' },
  { label: 'Left', value: '₹43k', tone: 'from-success to-green-500', width: 'w-[38%]' },
] as const

const allocation = [
  { label: 'Mutual funds', value: '₹14.5L', pct: 24, tone: 'bg-accent' },
  { label: 'Stocks', value: '₹6.2L', pct: 10, tone: 'bg-sky' },
  { label: 'EPF', value: '₹8.1L', pct: 13, tone: 'bg-mint' },
  { label: 'Cash', value: '₹2.0L', pct: 3, tone: 'bg-yellow' },
] as const

const insights = [
  { icon: PiggyBank, label: 'Savings rate', value: '24%', tone: 'text-mint bg-mint/12' },
  { icon: TrendingUp, label: 'Wealth growth', value: '+12%', tone: 'text-success bg-success/12' },
  { icon: Target, label: 'Goal progress', value: 'Ahead', tone: 'text-accent bg-accent/12' },
] as const

export function HeroPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-[420px] overflow-hidden rounded-[28px] border border-accent/15 bg-surface p-5 shadow-[0_28px_90px_rgba(102,87,232,0.22)] dark:border-accent/25 dark:bg-surface-dark',
        className,
      )}
      aria-hidden
    >
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-accent/20 via-mint/10 to-yellow/10" />
      <div className="landing-money-chip landing-money-chip-b absolute -left-1 bottom-24 rounded-full bg-mint/20 px-3 py-1 text-xs font-bold text-mint dark:text-mint">
        +12%
      </div>

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
            Net worth
          </p>
          <p className="font-display mt-3 text-[2.5rem] font-semibold leading-none tracking-tight text-ink dark:text-white">
            <span className="hero-shimmer-text">₹42.8L</span>
          </p>
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-mint/12 px-2.5 py-1 text-sm font-semibold text-mint">
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} />
            Up from ₹38.2L
          </p>
        </div>
        <div className="rounded-[18px] border border-mint/20 bg-gradient-to-br from-mint/15 to-success/10 px-3 py-2.5 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-mint">Retirement</p>
          <p className="text-sm font-bold text-ink dark:text-white">68% · Ahead</p>
          <p className="mt-0.5 text-[11px] font-medium text-success">₹22.6L saved</p>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-2">
        <div className="rounded-[16px] border border-accent/10 bg-accent/8 px-3 py-2.5 dark:bg-accent/12">
          <p className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">Assets</p>
          <p className="font-display text-lg font-bold text-accent">₹60.8L</p>
        </div>
        <div className="rounded-[16px] border border-peach/15 bg-peach/10 px-3 py-2.5 dark:bg-peach/12">
          <p className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">Loans</p>
          <p className="font-display text-lg font-bold text-peach">₹18L</p>
        </div>
      </div>

      <div className="relative mt-5 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Monthly cash flow
        </p>
        {cashFlow.map((item, index) => (
          <div key={item.label} className="grid grid-cols-[68px_1fr_auto] items-center gap-3">
            <span className="text-[11px] font-medium text-ink-muted">{item.label}</span>
            <div className="h-2.5 overflow-hidden rounded-full bg-ink/6 dark:bg-white/8">
              <div
                className={cn(
                  'h-full rounded-full bg-gradient-to-r',
                  item.tone,
                  item.width,
                  'hero-bar',
                  index === 0 && 'hero-bar-delay-1',
                  index === 1 && 'hero-bar-delay-2',
                  index === 2 && 'hero-bar-delay-3',
                  index === 3 && 'hero-bar-delay-4',
                )}
              />
            </div>
            <span className="text-xs font-bold tabular-nums text-ink dark:text-white">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="relative mt-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Asset mix
        </p>
        <div className="flex h-2.5 overflow-hidden rounded-full">
          {allocation.map((item) => (
            <div
              key={item.label}
              className={cn('h-full first:rounded-l-full last:rounded-r-full', item.tone)}
              style={{ width: `${item.pct}%` }}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {allocation.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-[11px]">
              <span className={cn('h-2 w-2 rounded-full', item.tone)} />
              <span className="text-ink-muted">{item.label}</span>
              <span className="ml-auto font-semibold tabular-nums text-ink dark:text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-3 gap-2">
        {insights.map((item) => (
          <div
            key={item.label}
            className={cn('rounded-[16px] px-2 py-3 text-center', item.tone)}
          >
            <item.icon className="mx-auto h-4 w-4" strokeWidth={2.2} />
            <p className="mt-2 text-[10px] font-medium opacity-80">{item.label}</p>
            <p className="mt-0.5 text-xs font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-4 flex items-center justify-between rounded-[16px] border border-peach/15 bg-gradient-to-r from-peach/10 to-orange-400/5 px-3 py-2.5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-peach">Home loan</p>
          <p className="text-sm font-bold text-ink dark:text-white">₹18L remaining</p>
        </div>
        <p className="inline-flex items-center gap-1 rounded-full bg-peach/15 px-2 py-1 text-xs font-bold text-peach">
          <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={2.2} />
          EMI ₹10.3k
        </p>
      </div>
    </div>
  )
}
