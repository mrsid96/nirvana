import { toMinorUnits } from '@/lib/money'
import type { SupportedCurrency } from '@/types/user'

const LAKH_MULTIPLIER = 100_000
const CRORE_MULTIPLIER = 10_000_000

/**
 * Extract and normalize monetary amounts from natural language.
 * Returns amount in minor units (paise/cents).
 */
export function extractAmount(text: string, currency: SupportedCurrency): number | undefined {
  const normalized = text.toLowerCase().replace(/,/g, '')

  // Currency symbol + number: ₹50,000, $500
  const symbolMatch = normalized.match(/(?:₹|rs\.?|inr)\s*([\d]+(?:\.\d+)?)\s*(k|l|lac|lakh|cr|crore)?/i)
  if (symbolMatch) {
    return parseAmountParts(Number(symbolMatch[1]), symbolMatch[2], currency)
  }

  // Number + lakh/lac/L: 2.8 lakh, 2.5L, 50k
  const suffixMatch = normalized.match(
    /([\d]+(?:\.\d+)?)\s*(k|l|lac|lakh|cr|crore)\b/i,
  )
  if (suffixMatch) {
    return parseAmountParts(Number(suffixMatch[1]), suffixMatch[2], currency)
  }

  // Plain large numbers: 50000, 280000
  const plainMatch = normalized.match(/\b([\d]{3,}(?:\.\d+)?)\b/)
  if (plainMatch) {
    const major = Number(plainMatch[1])
    if (major >= 100) return toMinorUnits(major, currency)
  }

  // Smaller plain numbers when context suggests money: spent 500
  const smallMatch = normalized.match(
    /(?:spent|paid|invest|invested|withdraw|received|salary|emi|sip)\w*\s+([\d]+(?:\.\d+)?)/i,
  )
  if (smallMatch) {
    const major = Number(smallMatch[1])
    if (major > 0) return toMinorUnits(major, currency)
  }

  return undefined
}

function parseAmountParts(
  value: number,
  suffix: string | undefined,
  currency: SupportedCurrency,
): number | undefined {
  if (!Number.isFinite(value) || value <= 0) return undefined

  let major = value
  const s = suffix?.toLowerCase()
  if (s === 'k') major = value * 1_000
  else if (s === 'l' || s === 'lac' || s === 'lakh') major = value * LAKH_MULTIPLIER
  else if (s === 'cr' || s === 'crore') major = value * CRORE_MULTIPLIER

  return toMinorUnits(major, currency)
}
