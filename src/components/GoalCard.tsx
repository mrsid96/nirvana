import { Link } from 'react-router-dom'
import { Progress } from '@/components/ui'
import { formatMoney, formatPercent } from '@/lib/formatters/currency'
import type { SupportedCurrency } from '@/types/user'
import { getGoalTheme } from '@/lib/goal-theme'
import { cn } from '@/lib/utils'

export function GoalCard({
  goalId,
  name,
  current,
  target,
  progress,
  monthly,
  trackStatus,
  currency,
  index = 0,
}: {
  goalId: string
  name: string
  current: number
  target: number
  progress: number
  monthly: number
  trackStatus: string
  currency: SupportedCurrency
  index?: number
}) {
  const theme = getGoalTheme(name, index)
  const Icon = theme.icon

  return (
    <Link to={`/wealth/${goalId}`} className="block active:scale-[0.99] transition-transform">
      <article
        className={cn(
          'relative overflow-hidden rounded-[20px] bg-gradient-to-br p-4 text-white shadow-[var(--shadow-soft)]',
          theme.gradient,
        )}
      >
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
        <div className="relative flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold leading-tight">{name}</h3>
              <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium">
                {trackStatus}
              </span>
            </div>
            <p className="font-display mt-2 text-2xl font-semibold tracking-tight">
              {formatMoney(current, currency, { compact: true })}
            </p>
            <p className="mt-0.5 text-sm text-white/75">
              of {formatMoney(target, currency, { compact: true })}
            </p>
          </div>
        </div>
        <div className="relative mt-4">
          <Progress value={progress} color="rgba(255,255,255,0.9)" />
          <div className="mt-2 flex justify-between text-xs text-white/80">
            <span>{formatPercent(progress)} complete</span>
            <span>{formatMoney(monthly, currency, { compact: true })} / month</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
