import { addMonthsIso, todayIsoDate } from '@/lib/formatters/dates'

/**
 * Extract date references from natural language.
 * Returns ISO date string.
 */
export function extractDate(text: string, today = todayIsoDate()): string | undefined {
  const normalized = text.toLowerCase()

  if (/\btoday\b/.test(normalized)) return today
  if (/\byesterday\b/.test(normalized)) return shiftDays(today, -1)
  if (/\btomorrow\b/.test(normalized)) return shiftDays(today, 1)

  // ISO date: 2024-08-15
  const isoMatch = normalized.match(/\b(\d{4}-\d{2}-\d{2})\b/)
  if (isoMatch) return isoMatch[1]

  // "5th", "on the 5th", "every 5th" — not a full date, skip here
  // "last week" etc. — skip for V1

  return undefined
}

export function extractDayOfMonth(text: string): number | undefined {
  const normalized = text.toLowerCase()

  const everyNth = normalized.match(/(?:every|on the)\s+(\d{1,2})(?:st|nd|rd|th)?/i)
  if (everyNth) {
    const day = Number(everyNth[1])
    if (day >= 1 && day <= 31) return day
  }

  const sipMatch = normalized.match(/\b(\d{1,2})(?:st|nd|rd|th)\s+(?:of every|every)/i)
  if (sipMatch) {
    const day = Number(sipMatch[1])
    if (day >= 1 && day <= 31) return day
  }

  return undefined
}

export function isRecurringPhrase(text: string): boolean {
  const normalized = text.toLowerCase()
  return (
    /\bevery\s+month\b/.test(normalized) ||
    /\bmonthly\b/.test(normalized) ||
    /\beach\s+month\b/.test(normalized) ||
    /\bsip\b/.test(normalized) ||
    /\brecurring\b/.test(normalized) ||
    /\bevery\s+\d{1,2}(?:st|nd|rd|th)?\b/.test(normalized) ||
    /\bi want to\b/.test(normalized) ||
    /\bset up\b/.test(normalized) ||
    /\bsetup\b/.test(normalized)
  )
}

export function isPastActionPhrase(text: string): boolean {
  const normalized = text.toLowerCase()
  return (
    /\b(today|yesterday|came|came in|received|got|paid|spent|invested|put|withdrew|withdrawn)\b/.test(
      normalized,
    ) ||
    /\bi (invested|paid|spent|received|got|withdrew)\b/.test(normalized)
  )
}

function shiftDays(iso: string, delta: number): string {
  const parts = iso.split('-').map(Number)
  const y = parts[0] ?? 0
  const m = parts[1] ?? 1
  const d = parts[2] ?? 1
  const date = new Date(y, m - 1, d + delta)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function nextMonthStart(today = todayIsoDate()): string {
  return addMonthsIso(today, 1).slice(0, 8) + '01'
}
