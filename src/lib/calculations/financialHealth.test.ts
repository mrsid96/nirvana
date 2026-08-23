import { describe, expect, it } from 'vitest'
import { calculateFinancialHealth } from '@/lib/calculations/financialHealth'

describe('financial health', () => {
  it('labels a strong savings and investment profile', () => {
    const health = calculateFinancialHealth({
      income: 400_000,
      expenses: 80_000,
      investments: 100_000,
      emis: 75_000,
      wealthGoalProgress: 50,
    })
    expect(health.savingsRate).toBe(80)
    expect(health.investmentRate).toBe(25)
    expect(health.debtToIncome).toBeCloseTo(18.75, 2)
    expect(health.savingsLabel).toBe('Strong')
  })
})
