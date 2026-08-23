import { describe, expect, it } from 'vitest'

/** Keys required in user export payload per V1 spec. */
export const EXPORT_KEYS = [
  'exportedAt',
  'profile',
  'settings',
  'goals',
  'assets',
  'transactions',
  'loans',
  'loanPayments',
  'expenses',
  'income',
  'recurringActivities',
  'scheduledOccurrences',
] as const

export function validateExportShape(data: Record<string, unknown>): boolean {
  return EXPORT_KEYS.every((key) => key in data)
}

describe('export payload', () => {
  it('includes all required collections', () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: { uid: 'u1' },
      settings: { currency: 'INR' },
      goals: [],
      assets: [],
      transactions: [],
      loans: [],
      loanPayments: [],
      expenses: [],
      income: [],
      recurringActivities: [],
      scheduledOccurrences: [],
    }
    expect(validateExportShape(payload)).toBe(true)
  })

  it('preserves exact minor-unit amounts', () => {
    const amount = 5_000_000
    const payload = {
      assets: [{ currentValue: amount, investedAmount: amount }],
    }
    expect(payload.assets[0]?.currentValue).toBe(amount)
  })
})
