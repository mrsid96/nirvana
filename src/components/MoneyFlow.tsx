import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/formatters/currency'
import type { SupportedCurrency } from '@/types/user'

type FlowItem = {
  label: string
  value: number
  color: string
}

export function MoneyFlow({
  income,
  items,
  remaining,
  currency,
  className,
}: {
  income: number
  items: FlowItem[]
  remaining: number
  currency: SupportedCurrency
  className?: string
}) {
  const max = Math.max(income, 1)

  return (
    <div className={cn('space-y-4', className)}>
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">Income</p>
        <p className="font-display mt-1 text-2xl font-semibold text-ink dark:text-white">
          {formatMoney(income, currency, { compact: true })}
        </p>
      </div>

      <div className="flex justify-center">
        <div className="h-6 w-px bg-ink/15 dark:bg-white/15" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div className="mx-auto mb-2 h-1.5 w-full max-w-[72px] overflow-hidden rounded-full bg-ink/8 dark:bg-white/10">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (item.value / max) * 100)}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
            <p className="text-xs text-ink-muted">{item.label}</p>
            <p className="mt-0.5 text-sm font-semibold text-ink dark:text-white">
              {formatMoney(item.value, currency, { compact: true })}
            </p>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <div className="h-6 w-px bg-ink/15 dark:bg-white/15" />
      </div>

      <div
        className={cn(
          'rounded-[16px] px-4 py-3 text-center',
          remaining >= 0 ? 'bg-mint/10' : 'bg-danger/10',
        )}
      >
        <p className="text-xs font-medium text-ink-muted">Remaining</p>
        <p
          className={cn(
            'font-display mt-0.5 text-xl font-semibold',
            remaining >= 0 ? 'text-success' : 'text-danger',
          )}
        >
          {formatMoney(remaining, currency, { compact: true })}
        </p>
      </div>
    </div>
  )
}

export function SummaryGrid({
  items,
  currency,
}: {
  items: { label: string; value: number; tint?: 'mint' | 'peach' | 'accent' | 'sky' }[]
  currency: SupportedCurrency
}) {
  const tints = {
    mint: 'bg-mint/8 dark:bg-mint/10',
    peach: 'bg-peach/10 dark:bg-peach/10',
    accent: 'bg-accent/8 dark:bg-accent/10',
    sky: 'bg-sky/10 dark:bg-sky/10',
  }

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            'rounded-[16px] p-3.5',
            item.tint ? tints[item.tint] : 'bg-surface shadow-[var(--shadow-soft)] dark:bg-surface-dark',
          )}
        >
          <p className="text-xs font-medium text-ink-muted">{item.label}</p>
          <p className="font-display mt-1 text-lg font-semibold text-ink dark:text-white">
            {formatMoney(item.value, currency, { compact: true })}
          </p>
        </div>
      ))}
    </div>
  )
}
