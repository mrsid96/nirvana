import { describe, expect, it } from 'vitest'
import {
  futureValueLumpSum,
  futureValueWithMonthlyContributions,
  requiredMonthlyContribution,
} from '@/lib/calculations/cagr'

describe('CAGR / future value', () => {
  it('returns present value when years are zero', () => {
    expect(futureValueLumpSum(100_000, 0.12, 0)).toBe(100_000)
  })

  it('compounds for 1 year', () => {
    expect(futureValueLumpSum(100_000, 0.12, 1)).toBeCloseTo(112_000, 6)
  })

  it('compounds for 10 years', () => {
    expect(futureValueLumpSum(100_000, 0.12, 10)).toBeCloseTo(310_584.82, 1)
  })

  it('uses a different CAGR', () => {
    expect(futureValueLumpSum(50_000, 0.08, 5)).toBeCloseTo(73_466.4, 1)
  })
})

describe('SIP projection', () => {
  it('adds only current value when monthly investment is zero', () => {
    expect(
      futureValueWithMonthlyContributions({
        presentValue: 200_000,
        monthlyContribution: 0,
        annualCagr: 0.12,
        months: 12,
      }),
    ).toBeCloseTo(200_000 * 1.12, 6)
  })

  it('projects positive monthly investment with zero CAGR', () => {
    expect(
      futureValueWithMonthlyContributions({
        presentValue: 100_000,
        monthlyContribution: 10_000,
        annualCagr: 0,
        months: 12,
      }),
    ).toBe(220_000)
  })

  it('projects positive monthly investment with positive CAGR', () => {
    const result = futureValueWithMonthlyContributions({
      presentValue: 0,
      monthlyContribution: 10_000,
      annualCagr: 0.12,
      months: 12,
    })
    expect(result).toBeGreaterThan(120_000)
    expect(result).toBeLessThan(130_000)
  })

  it('computes required monthly contribution', () => {
    expect(
      requiredMonthlyContribution({
        presentValue: 0,
        targetValue: 120_000,
        annualCagr: 0,
        months: 12,
      }),
    ).toBe(10_000)
  })
})
