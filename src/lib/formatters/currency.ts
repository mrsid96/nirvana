import { CURRENCIES, toMajorUnits } from '@/lib/money'
import type { SupportedCurrency } from '@/types/user'

export function formatMoney(
  minorUnits: number,
  currency: SupportedCurrency,
  options?: { compact?: boolean; maximumFractionDigits?: number },
): string {
  const meta = CURRENCIES[currency]
  const major = toMajorUnits(minorUnits, currency)

  if (options?.compact && currency === 'INR') {
    return formatIndianCompact(major)
  }

  if (options?.compact) {
    return new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(major)
  }

  return new Intl.NumberFormat(meta.locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    minimumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(major)
}

function formatIndianCompact(major: number): string {
  const abs = Math.abs(major)
  const sign = major < 0 ? '-' : ''
  if (abs >= 10_000_000) {
    return `${sign}₹${trimNumber(abs / 10_000_000)}Cr`
  }
  if (abs >= 100_000) {
    return `${sign}₹${trimNumber(abs / 100_000)}L`
  }
  return `${sign}₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(abs)}`
}

function trimNumber(value: number): string {
  return value >= 10 ? value.toFixed(1).replace(/\.0$/, '') : value.toFixed(1)
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}
