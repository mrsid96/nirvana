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
  compact = false,
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
  compact?: boolean
}) {
  const theme = getGoalTheme(name, index)
  const Icon = theme.icon

  return (
    <Link to={`/wealth/${goalId}`} className="block active:scale-[0.99] transition-transform">
      <article
        className={cn(
          'relative flex h-full flex-col overflow-hidden rounded-[18px] bg-gradient-to-br text-white shadow-[var(--shadow-soft)]',
          compact ? 'aspect-square p-3 lg:aspect-auto lg:rounded-[20px] lg:p-4' : 'p-4',
          theme.gradient,
        )}
      >
        <div className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/10 lg:-right-6 lg:-top-6 lg:h-24 lg:w-24" />
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className={cn('flex items-start gap-2', compact ? 'lg:gap-3' : 'gap-3')}>
            <div
              className={cn(
                'grid shrink-0 place-items-center rounded-xl bg-white/20 backdrop-blur-sm',
                compact ? 'h-8 w-8 lg:h-10 lg:w-10' : 'h-10 w-10',
              )}
            >
              <Icon className={cn(compact ? 'h-4 w-4 lg:h-5 lg:w-5' : 'h-5 w-5')} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-1">
                <h3
                  className={cn(
                    'font-semibold leading-tight',
                    compact ? 'text-sm lg:text-base' : 'text-base',
                  )}
                >
                  {name}
                </h3>
                <span
                  className={cn(
                    'shrink-0 rounded-full bg-white/20 font-medium',
                    compact ? 'px-1.5 py-0.5 text-[9px] lg:px-2 lg:text-[10px]' : 'px-2 py-0.5 text-[10px]',
                  )}
                >
                  {trackStatus}
                </span>
              </div>
              <p
                className={cn(
                  'font-display font-semibold tracking-tight',
                  compact ? 'mt-1.5 text-lg lg:mt-2 lg:text-2xl' : 'mt-2 text-2xl',
                )}
              >
                {formatMoney(current, currency, { compact: true })}
              </p>
              <p className={cn('text-white/75', compact ? 'mt-0.5 text-[11px] lg:text-sm' : 'mt-0.5 text-sm')}>
                of {formatMoney(target, currency, { compact: true })}
              </p>
            </div>
          </div>
          <div className={cn('relative mt-auto', compact ? 'pt-2 lg:pt-4' : 'mt-4')}>
            <Progress value={progress} color="rgba(255,255,255,0.9)" />
            <div
              className={cn(
                'mt-1.5 flex justify-between text-white/80',
                compact ? 'text-[10px] lg:mt-2 lg:text-xs' : 'mt-2 text-xs',
              )}
            >
              <span>{formatPercent(progress)}</span>
              <span className="truncate pl-1">
                {formatMoney(monthly, currency, { compact: true })}/mo
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
