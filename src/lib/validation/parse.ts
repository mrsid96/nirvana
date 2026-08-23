import type { SupportedCurrency } from '@/types/user'
import { toMinorUnits } from '@/lib/money'
import { moneyMinorSchema } from '@/lib/validation/common'

export function parseAmountInput(
  raw: string,
  currency: SupportedCurrency,
  options?: { allowZero?: boolean },
): { ok: true; minor: number } | { ok: false; message: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, message: 'Enter an amount' }
  const major = Number(trimmed)
  if (!Number.isFinite(major)) return { ok: false, message: 'Enter a valid number' }
  if (major < 0) return { ok: false, message: 'Amount cannot be negative' }
  const minor = toMinorUnits(major, currency)
  const parsed = moneyMinorSchema.safeParse(minor)
  if (!parsed.success) return { ok: false, message: 'Amount is too large' }
  if (minor <= 0 && !options?.allowZero) {
    return { ok: false, message: 'Enter an amount greater than zero' }
  }
  return { ok: true, minor }
}

export function parseDayOfMonth(raw: string): { ok: true; day: number } | { ok: false; message: string } {
  const day = Number(raw)
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return { ok: false, message: 'Day must be between 1 and 31' }
  }
  return { ok: true, day }
}

export function parseRatePercent(raw: string): { ok: true; rate: number } | { ok: false; message: string } {
  const rate = Number(raw)
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    return { ok: false, message: 'Rate must be between 0 and 100' }
  }
  return { ok: true, rate }
}

export function parsePositiveInteger(
  raw: string,
  label = 'Value',
  max = 600,
): { ok: true; value: number } | { ok: false; message: string } {
  const value = Number(raw)
  if (!Number.isInteger(value) || value < 1 || value > max) {
    return { ok: false, message: `${label} must be between 1 and ${max}` }
  }
  return { ok: true, value }
}
