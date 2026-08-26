import {
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  Target,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const cashFlow = [
  { label: 'Income', value: '₹1.8L', tone: 'bg-mint', width: 'w-full' },
  { label: 'Spend', value: '₹64k', tone: 'bg-peach', width: 'w-[62%]' },
  { label: 'Invest', value: '₹45k', tone: 'bg-accent', width: 'w-[48%]' },
  { label: 'Left', value: '₹43k', tone: 'bg-success', width: 'w-[38%]' },
] as const

const insights = [
  { icon: PiggyBank, label: 'Savings rate', value: '24%' },
  { icon: TrendingUp, label: 'Wealth growth', value: '+12%' },
  { icon: Target, label: 'Goal progress', value: 'On track' },
] as const

export function HeroPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-[420px] overflow-hidden rounded-[28px] border border-ink/6 bg-surface/95 p-5 shadow-[0_24px_80px_rgba(102,87,232,0.14)] backdrop-blur-sm dark:border-white/10 dark:bg-surface-dark/95',
        className,
      )}
      aria-hidden
    >
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-accent/10 to-transparent dark:from-accent/15" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
            Net position
          </p>
          <p className="font-display mt-1 text-[2.35rem] font-semibold leading-none tracking-tight text-ink dark:text-white">
            ₹42.8L
          </p>
          <p className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-mint">
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} />
            Wealth up · loans down
          </p>
        </div>
        <div className="rounded-[16px] border border-accent/10 bg-accent/8 px-3 py-2 text-right dark:border-accent/20 dark:bg-accent/15">
          <p className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">Retirement</p>
          <p className="text-sm font-semibold text-ink dark:text-white">68% · Ahead</p>
        </div>
      </div>

      <div className="relative mt-6 space-y-3">
        {cashFlow.map((item, index) => (
          <div key={item.label} className="grid grid-cols-[72px_1fr_auto] items-center gap-3">
            <span className="text-[11px] font-medium text-ink-muted">{item.label}</span>
            <div className="h-2 overflow-hidden rounded-full bg-ink/6 dark:bg-white/8">
              <div
                className={cn(
                  'h-full rounded-full',
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
            <span className="text-xs font-semibold tabular-nums text-ink dark:text-white">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="relative mt-5 grid grid-cols-3 gap-2">
        {insights.map((item) => (
          <div
            key={item.label}
            className="rounded-[16px] border border-ink/5 bg-canvas/80 px-2.5 py-3 text-center dark:border-white/8 dark:bg-white/5"
          >
            <item.icon className="mx-auto h-4 w-4 text-accent" strokeWidth={2.2} />
            <p className="mt-2 text-[10px] font-medium text-ink-muted">{item.label}</p>
            <p className="mt-0.5 text-xs font-semibold text-ink dark:text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-4 flex items-center justify-between rounded-[16px] border border-ink/5 bg-canvas/70 px-3 py-2.5 dark:border-white/8 dark:bg-white/5">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">Home loan</p>
          <p className="text-sm font-semibold text-ink dark:text-white">₹18L remaining</p>
        </div>
        <p className="inline-flex items-center gap-1 text-xs font-medium text-peach">
          <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={2.2} />
          EMI ₹10.3k
        </p>
      </div>
    </div>
  )
}
