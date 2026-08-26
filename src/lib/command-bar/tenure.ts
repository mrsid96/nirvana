import { addMonthsIso, todayIsoDate } from '@/lib/formatters/dates'

export interface TenureInfo {
  label: string
  targetDate?: string
  months?: number
}

export function extractTenure(text: string, today = todayIsoDate()): TenureInfo | undefined {
  const normalized = text.toLowerCase()

  const yearsFromNow = normalized.match(/\b(\d+)\s*years?\s+from\s+now\b/)
  if (yearsFromNow?.[1]) {
    const years = Number(yearsFromNow[1])
    return { label: `${years} ${years === 1 ? 'year' : 'years'}`, months: years * 12, targetDate: addMonthsIso(today, years * 12) }
  }

  const oneYearFromNow = /\b(?:one|1)\s+year\s+from\s+now\b/.test(normalized)
  if (oneYearFromNow) {
    return { label: '1 year', months: 12, targetDate: addMonthsIso(today, 12) }
  }

  const monthsFromNow = normalized.match(/\b(\d+)\s*months?\s+from\s+now\b/)
  if (monthsFromNow?.[1]) {
    const months = Number(monthsFromNow[1])
    return { label: `${months} months`, months, targetDate: addMonthsIso(today, months) }
  }

  const inYears = normalized.match(/\b(?:in|after)\s+(\d+)\s*years?\b/)
  if (inYears?.[1]) {
    const years = Number(inYears[1])
    return { label: `${years} years`, months: years * 12, targetDate: addMonthsIso(today, years * 12) }
  }

  const inOneYear = /\b(?:in|next)\s+year\b/.test(normalized)
  if (inOneYear) {
    return { label: '1 year', months: 12, targetDate: addMonthsIso(today, 12) }
  }

  const inMonths = normalized.match(/\b(?:in|after|over\s+the\s+next)\s+(\d+)\s*months?\b/)
  if (inMonths?.[1]) {
    const months = Number(inMonths[1])
    return { label: `${months} months`, months, targetDate: addMonthsIso(today, months) }
  }

  const withinYears = normalized.match(/\bwithin\s+(\d+)\s*years?\b/)
  if (withinYears?.[1]) {
    const years = Number(withinYears[1])
    return { label: `${years} years`, months: years * 12, targetDate: addMonthsIso(today, years * 12) }
  }

  const bareYears = normalized.match(/\b(?:for|in)\s+(\d+)\s*years?\b/)
  if (bareYears?.[1]) {
    const years = Number(bareYears[1])
    return { label: `${years} years`, months: years * 12, targetDate: addMonthsIso(today, years * 12) }
  }

  const bareMonths = normalized.match(/\b(?:for|in|within)\s+(\d+)\s*months?\b/)
  if (bareMonths?.[1]) {
    const months = Number(bareMonths[1])
    return { label: `${months} months`, months, targetDate: addMonthsIso(today, months) }
  }

  return undefined
}
