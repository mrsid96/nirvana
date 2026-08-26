import { Calendar } from 'lucide-react'
import { useMemo } from 'react'
import { formatDisplayDate, todayIsoDate } from '@/lib/formatters/dates'
import { formatMoney } from '@/lib/formatters/currency'
import {
  daysOverdue,
  groupOccurrencesByMonth,
} from '@/lib/calculations/recurring'
import { OccurrenceTypeLabel } from '@/lib/visual-icons'
import type { ScheduledOccurrence } from '@/types/recurring'
import type { SupportedCurrency } from '@/types/user'
import { EmptyState } from '@/components/ui'

export function FinancialCalendar({
  occurrences,
  currency,
  startMonthKey,
  today = todayIsoDate(),
}: {
  occurrences: ScheduledOccurrence[]
  currency: SupportedCurrency
  startMonthKey: string
  today?: string
}) {
  const months = useMemo(
    () => groupOccurrencesByMonth(occurrences, startMonthKey, 3),
    [occurrences, startMonthKey],
  )

  const hasItems = months.some((month) => month.items.length > 0)
  if (!hasItems) {
    return (
      <EmptyState
        icon={Calendar}
        title="No upcoming schedule"
        body="Add recurring income, expenses, or SIPs to see your financial calendar."
      />
    )
  }

  return (
    <div className="space-y-5">
      {months.map((month) =>
        month.items.length > 0 ? (
          <section key={month.monthKey} className="space-y-2">
            <h3 className="text-sm font-semibold text-ink dark:text-white">{month.label}</h3>
            <ul className="space-y-2">
              {month.items.map((item) => {
                const isOverdue = item.status === 'OVERDUE'
                const isDue = item.status === 'DUE'
                const overdueDays = isOverdue ? daysOverdue(item.scheduledDate, today) : 0
                return (
                <li
                  key={item.id}
                  className={`flex items-center justify-between gap-3 rounded-[14px] px-4 py-3 ${
                    isOverdue
                      ? 'bg-danger/8 dark:bg-danger/15'
                      : isDue
                        ? 'bg-accent/8 dark:bg-accent/15'
                        : 'bg-surface dark:bg-surface-dark'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink dark:text-white">
                      <span className="text-ink-muted">{item.scheduledDate.slice(8)}</span>
                      {' '}
                      <OccurrenceTypeLabel type={item.type} name={item.name} />
                    </p>
                    <p className="text-xs text-ink-muted">
                      {isOverdue
                        ? `Overdue ${overdueDays} day${overdueDays === 1 ? '' : 's'}`
                        : isDue
                          ? 'Due today'
                          : formatDisplayDate(item.scheduledDate)}
                    </p>
                  </div>
                  <p className="font-display text-sm font-semibold text-ink dark:text-white">
                    {formatMoney(item.expectedAmount, currency, { compact: true })}
                  </p>
                </li>
                )
              })}
            </ul>
          </section>
        ) : null,
      )}
    </div>
  )
}
