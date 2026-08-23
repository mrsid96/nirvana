import { formatMoney } from '@/lib/formatters/currency'
import type { SupportedCurrency } from '@/types/user'
import { cn } from '@/lib/utils'

type JourneyStop = {
  label: string
  value: number
  position: number
}

export function GoalJourney({
  current,
  target,
  currency,
  color = '#6657E8',
  embedded = false,
}: {
  current: number
  target: number
  currency: SupportedCurrency
  color?: string
  embedded?: boolean
}) {
  const stops: JourneyStop[] = [
    { label: 'Start', value: 0, position: 0 },
    { label: formatMoney(target * 0.25, currency, { compact: true }), value: target * 0.25, position: 25 },
    { label: formatMoney(target * 0.5, currency, { compact: true }), value: target * 0.5, position: 50 },
    { label: formatMoney(target * 0.75, currency, { compact: true }), value: target * 0.75, position: 75 },
    { label: formatMoney(target, currency, { compact: true }), value: target, position: 100 },
  ]

  const currentPercent = target > 0 ? Math.min(100, (current / target) * 100) : 0
  const markerLeft = Math.max(14, Math.min(86, currentPercent))
  const pinAtStart = currentPercent < 14

  const content = (
    <>
      <div className="relative mx-1 pb-1 pt-8">
        <div
          className={cn(
            'absolute top-0 whitespace-nowrap',
            pinAtStart ? 'left-0' : '-translate-x-1/2',
          )}
          style={pinAtStart ? undefined : { left: `${markerLeft}%` }}
        >
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-white">
            You are here
          </span>
        </div>

        <div className="relative h-1.5">
          <div className="absolute inset-0 rounded-full bg-ink/8 dark:bg-white/10" />
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${currentPercent}%`, backgroundColor: color }}
          />

          {stops.map((stop) => (
            <div
              key={stop.position}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${stop.position}%` }}
            >
              <div
                className={cn(
                  'h-3 w-3 rounded-full border-2 border-surface bg-ink/20 dark:border-surface-dark',
                  currentPercent >= stop.position && 'border-accent bg-accent',
                )}
                style={
                  currentPercent >= stop.position
                    ? { backgroundColor: color, borderColor: color }
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1 text-center">
        {stops.map((stop) => (
          <div key={stop.position}>
            <p className="text-[10px] text-ink-muted">{stop.label}</p>
          </div>
        ))}
      </div>
    </>
  )

  if (embedded) return content

  return (
    <div className="rounded-[20px] bg-surface p-4 shadow-[var(--shadow-soft)] dark:bg-surface-dark">
      {content}
    </div>
  )
}
