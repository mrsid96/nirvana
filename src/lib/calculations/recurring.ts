import { format, parseISO, startOfMonth, addMonths, lastDayOfMonth } from 'date-fns'
import type { Asset } from '@/types/asset'
import type { Loan } from '@/types/loan'
import type {
  OccurrenceStatus,
  RecurringActivity,
  RecurringActivityType,
  ScheduledOccurrence,
} from '@/types/recurring'

/** Last valid calendar day for a monthly schedule (e.g. 31st → Feb 28/29). */
export function scheduledDateForMonth(year: number, monthIndex: number, scheduledDay: number): string {
  const monthStart = new Date(year, monthIndex, 1)
  const lastDay = lastDayOfMonth(monthStart).getDate()
  const day = Math.min(scheduledDay, lastDay)
  return format(new Date(year, monthIndex, day), 'yyyy-MM-dd')
}

export function occurrenceId(recurringActivityId: string, scheduledDate: string): string {
  return `${recurringActivityId}_${scheduledDate}`
}

export function deriveOccurrenceStatus(
  scheduledDate: string,
  storedStatus: OccurrenceStatus | undefined,
  today: string,
): OccurrenceStatus {
  if (storedStatus === 'RECORDED' || storedStatus === 'SKIPPED') return storedStatus
  if (scheduledDate > today) return 'UPCOMING'
  if (scheduledDate === today) return 'DUE'
  return 'OVERDUE'
}

export function isActionRequired(status: OccurrenceStatus): boolean {
  return status === 'DUE' || status === 'OVERDUE'
}

export function sortOccurrencesForDisplay(occurrences: ScheduledOccurrence[]): ScheduledOccurrence[] {
  const priority = (status: OccurrenceStatus): number => {
    if (status === 'OVERDUE') return 0
    if (status === 'DUE') return 1
    if (status === 'UPCOMING') return 2
    return 3
  }
  return [...occurrences].sort((a, b) => {
    const pDiff = priority(a.status) - priority(b.status)
    if (pDiff !== 0) return pDiff
    return a.scheduledDate.localeCompare(b.scheduledDate)
  })
}

export function buildRecurringFromAsset(asset: Asset): RecurringActivity | null {
  if (
    asset.isDeleted ||
    !asset.isActive ||
    !asset.monthlyInvestment ||
    asset.monthlyInvestment <= 0
  ) {
    return null
  }
  const scheduledDay = asset.plannedInvestmentDay ?? 1
  const startDate = asset.startDate ?? asset.createdAt.slice(0, 10)
  return {
    id: `asset_${asset.id}`,
    type: 'INVESTMENT',
    name: asset.name,
    amount: asset.monthlyInvestment,
    frequency: 'MONTHLY',
    scheduledDay,
    startDate,
    endDate: asset.endDate,
    goalId: asset.goalId,
    assetId: asset.id,
    status: 'ACTIVE',
    sourceEntityId: asset.id,
    sourceEntityType: 'asset',
    isDeleted: false,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  }
}

export function buildRecurringFromLoan(loan: Loan): RecurringActivity | null {
  if (loan.isDeleted || loan.status !== 'ACTIVE' || loan.emiAmount <= 0) return null
  return {
    id: `loan_${loan.id}`,
    type: 'LOAN_PAYMENT',
    name: loan.name,
    amount: loan.emiAmount,
    frequency: 'MONTHLY',
    scheduledDay: loan.emiDate,
    startDate: loan.startDate,
    endDate: loan.endDate,
    loanId: loan.id,
    status: 'ACTIVE',
    sourceEntityId: loan.id,
    sourceEntityType: 'loan',
    isDeleted: false,
    createdAt: loan.createdAt,
    updatedAt: loan.updatedAt,
  }
}

export function mergeRecurringActivities(
  manual: RecurringActivity[],
  assets: Asset[],
  loans: Loan[],
): RecurringActivity[] {
  const map = new Map<string, RecurringActivity>()

  for (const activity of manual.filter((item) => !item.isDeleted)) {
    map.set(activity.id, activity)
  }

  for (const asset of assets) {
    const derived = buildRecurringFromAsset(asset)
    if (!derived) continue
    const existing = map.get(derived.id)
    if (!existing || existing.sourceEntityType === 'asset') {
      map.set(derived.id, { ...derived, id: derived.id })
    }
  }

  for (const loan of loans) {
    const derived = buildRecurringFromLoan(loan)
    if (!derived) continue
    const existing = map.get(derived.id)
    if (!existing || existing.sourceEntityType === 'loan') {
      map.set(derived.id, { ...derived, id: derived.id })
    }
  }

  return [...map.values()]
}

export function generateOccurrenceDates(
  activity: RecurringActivity,
  fromDate: string,
  toDate: string,
): string[] {
  if (activity.status !== 'ACTIVE' || activity.isDeleted) return []

  const start = parseISO(fromDate)
  const end = parseISO(toDate)
  const activityStart = parseISO(activity.startDate)
  const activityEnd = activity.endDate ? parseISO(activity.endDate) : null

  const cursor = startOfMonth(start < activityStart ? activityStart : start)
  const dates: string[] = []

  while (cursor <= end) {
    const scheduled = scheduledDateForMonth(
      cursor.getFullYear(),
      cursor.getMonth(),
      activity.scheduledDay,
    )
    const scheduledParsed = parseISO(scheduled)
    if (scheduledParsed < activityStart) {
      cursor.setMonth(cursor.getMonth() + 1)
      continue
    }
    if (activityEnd && scheduledParsed > activityEnd) break
    if (scheduled >= fromDate && scheduled <= toDate) {
      dates.push(scheduled)
    }
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return dates
}

export function buildOccurrenceFromActivity(
  activity: RecurringActivity,
  scheduledDate: string,
  today: string,
  existing?: ScheduledOccurrence,
): ScheduledOccurrence {
  const recurringId = activity.id

  if (existing) {
    return {
      ...existing,
      status: deriveOccurrenceStatus(scheduledDate, existing.status, today),
      expectedAmount: activity.amount,
      name: activity.name,
    }
  }

  return {
    id: occurrenceId(recurringId, scheduledDate),
    recurringActivityId: recurringId,
    type: activity.type,
    name: activity.name,
    expectedAmount: activity.amount,
    scheduledDate,
    month: scheduledDate.slice(0, 7),
    status: deriveOccurrenceStatus(scheduledDate, undefined, today),
    goalId: activity.goalId,
    assetId: activity.assetId,
    loanId: activity.loanId,
    expenseCategory: activity.expenseCategory,
    incomeSource: activity.incomeSource,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/** Sync window: 3 months back, 6 months forward */
export function syncOccurrenceWindow(today: string): { from: string; to: string } {
  const parsed = parseISO(today)
  const from = format(addMonths(parsed, -3), 'yyyy-MM-dd')
  const to = format(addMonths(parsed, 6), 'yyyy-MM-dd')
  return { from, to }
}

export function syncOccurrences(
  activities: RecurringActivity[],
  existing: ScheduledOccurrence[],
  today: string,
): ScheduledOccurrence[] {
  const { from, to } = syncOccurrenceWindow(today)
  const existingMap = new Map(existing.map((item) => [item.id, item]))
  const result = new Map<string, ScheduledOccurrence>()

  for (const activity of activities) {
    if (activity.isDeleted || activity.status !== 'ACTIVE') continue
    const dates = generateOccurrenceDates(activity, from, to)
    for (const scheduledDate of dates) {
      const id = occurrenceId(activity.id, scheduledDate)
      const prev = existingMap.get(id)
      const occurrence = buildOccurrenceFromActivity(activity, scheduledDate, today, prev)
      result.set(id, occurrence)
    }
  }

  for (const item of existing) {
    if (item.isDeleted) continue
    if (item.status === 'RECORDED' || item.status === 'SKIPPED') {
      result.set(item.id, {
        ...item,
        status: deriveOccurrenceStatus(item.scheduledDate, item.status, today),
      })
    }
  }

  return [...result.values()]
}

export function countActionRequired(occurrences: ScheduledOccurrence[]): number {
  return occurrences.filter((item) => !item.isDeleted && isActionRequired(item.status)).length
}

export function daysOverdue(scheduledDate: string, today: string): number {
  if (scheduledDate >= today) return 0
  const start = parseISO(scheduledDate)
  const end = parseISO(today)
  const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

export function occurrenceTypeEmoji(type: RecurringActivityType): string {
  switch (type) {
    case 'INVESTMENT':
      return '📈'
    case 'LOAN_PAYMENT':
      return '🏦'
    case 'INCOME':
      return '💰'
    case 'EXPENSE':
      return '💸'
    default:
      return '📅'
  }
}

export interface CalendarMonthGroup {
  monthKey: string
  label: string
  items: ScheduledOccurrence[]
}

export function groupOccurrencesByMonth(
  occurrences: ScheduledOccurrence[],
  startMonthKey: string,
  monthsCount = 3,
): CalendarMonthGroup[] {
  const [startYear, startMonth] = startMonthKey.split('-').map(Number)
  if (!startYear || !startMonth) return []

  const groups: CalendarMonthGroup[] = []
  for (let offset = 0; offset < monthsCount; offset += 1) {
    const date = new Date(startYear, startMonth - 1 + offset, 1)
    const monthKey = format(date, 'yyyy-MM')
    const label = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(
      date,
    )
    const items = occurrences
      .filter(
        (item) =>
          !item.isDeleted &&
          item.scheduledDate.startsWith(monthKey) &&
          item.status !== 'RECORDED' &&
          item.status !== 'SKIPPED',
      )
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    groups.push({ monthKey, label, items })
  }
  return groups
}

export function groupRecurringByType(
  activities: RecurringActivity[],
): { type: RecurringActivityType; label: string; items: RecurringActivity[] }[] {
  const order: RecurringActivityType[] = ['INVESTMENT', 'LOAN_PAYMENT', 'INCOME', 'EXPENSE']
  const labels: Record<RecurringActivityType, string> = {
    INVESTMENT: 'Investments',
    LOAN_PAYMENT: 'Loans',
    INCOME: 'Income',
    EXPENSE: 'Expenses',
  }
  return order.map((type) => ({
    type,
    label: labels[type],
    items: activities
      .filter((item) => !item.isDeleted && item.type === type)
      .sort((a, b) => a.scheduledDay - b.scheduledDay),
  }))
}

export function recurringTypeLabel(type: RecurringActivityType): string {
  switch (type) {
    case 'INVESTMENT':
      return 'SIP / Investment'
    case 'LOAN_PAYMENT':
      return 'Loan EMI'
    case 'INCOME':
      return 'Recurring income'
    case 'EXPENSE':
      return 'Recurring expense'
    default:
      return 'Recurring'
  }
}

export function formatScheduledDay(day: number): string {
  return `${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} every month`
}
