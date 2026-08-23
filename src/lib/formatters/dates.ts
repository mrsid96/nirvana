import { format, parseISO } from 'date-fns'

export function todayIsoDate(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function monthKeyFromDate(date: string): string {
  return date.slice(0, 7)
}

export function currentMonthKey(): string {
  return format(new Date(), 'yyyy-MM')
}

export function formatMonthLabel(monthKey: string, locale = undefined as string | undefined): string {
  const [year, month] = monthKey.split('-')
  if (!year || !month) return monthKey
  const date = new Date(Number(year), Number(month) - 1, 1)
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date)
}

export function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) return monthKey
  const date = new Date(year, month - 1 + delta, 1)
  return format(date, 'yyyy-MM')
}

export function formatDisplayDate(date: string, locale?: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(parseISO(date))
  } catch {
    return date
  }
}

export function monthsBetween(startDate: string, endDate: string): number {
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  const years = end.getFullYear() - start.getFullYear()
  const months = end.getMonth() - start.getMonth()
  return years * 12 + months
}

export function addMonthsIso(date: string, months: number): string {
  const parsed = parseISO(date)
  parsed.setMonth(parsed.getMonth() + months)
  return format(parsed, 'yyyy-MM-dd')
}

export function greetingForNow(now = new Date()): 'Good morning' | 'Good afternoon' | 'Good evening' {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function monthRange(monthKey: string): { start: string; end: string } {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) {
    return { start: `${monthKey}-01`, end: `${monthKey}-31` }
  }
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  }
}
