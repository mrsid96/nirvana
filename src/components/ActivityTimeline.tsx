import { ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react'
import { formatDisplayDate } from '@/lib/formatters/dates'
import { formatMoney } from '@/lib/formatters/currency'
import type { SupportedCurrency } from '@/types/user'
import { cn } from '@/lib/utils'

export type TimelineItem = {
  id: string
  date: string
  title: string
  subtitle?: string
  amount: number
  type: 'investment' | 'withdrawal' | 'update' | 'expense' | 'income'
  onDelete?: () => void
}

function groupByDate(items: TimelineItem[]): { label: string; items: TimelineItem[] }[] {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const groups = new Map<string, TimelineItem[]>()

  for (const item of items) {
    let label: string
    if (item.date === today) label = 'Today'
    else if (item.date === yesterday) label = 'Yesterday'
    else label = formatDisplayDate(item.date)

    const list = groups.get(label) ?? []
    list.push(item)
    groups.set(label, list)
  }

  return [...groups.entries()].map(([label, groupItems]) => ({ label, items: groupItems }))
}

function iconFor(type: TimelineItem['type']) {
  if (type === 'investment' || type === 'income') return ArrowDownLeft
  if (type === 'withdrawal' || type === 'expense') return ArrowUpRight
  return RefreshCw
}

function colorFor(type: TimelineItem['type']) {
  if (type === 'investment' || type === 'income') return 'bg-mint/15 text-mint'
  if (type === 'withdrawal' || type === 'expense') return 'bg-peach/15 text-peach'
  return 'bg-accent/15 text-accent'
}

export function ActivityTimeline({
  items,
  currency,
  emptyMessage = 'Nothing here yet.',
}: {
  items: TimelineItem[]
  currency: SupportedCurrency
  emptyMessage?: string
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-muted">{emptyMessage}</p>
  }

  const groups = groupByDate(items)

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            {group.label}
          </p>
          <div className="space-y-0">
            {group.items.map((item, index) => {
              const Icon = iconFor(item.type)
              const isLast = index === group.items.length - 1
              return (
                <div key={item.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'grid h-8 w-8 shrink-0 place-items-center rounded-full',
                        colorFor(item.type),
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </div>
                    {!isLast ? (
                      <div className="my-1 w-px flex-1 bg-ink/10 dark:bg-white/10" />
                    ) : null}
                  </div>
                  <div className={cn('min-w-0 flex-1 pb-4', isLast && 'pb-0')}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink dark:text-white">{item.title}</p>
                        {item.subtitle ? (
                          <p className="mt-0.5 truncate text-xs text-ink-muted">{item.subtitle}</p>
                        ) : null}
                      </div>
                      <span
                        className={cn(
                          'font-display shrink-0 text-sm font-semibold',
                          item.type === 'investment' || item.type === 'income'
                            ? 'text-success'
                            : 'text-ink dark:text-white',
                        )}
                      >
                        {item.type === 'investment' || item.type === 'income' ? '+' : ''}
                        {formatMoney(item.amount, currency, { compact: true })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
