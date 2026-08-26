import { describe, expect, it } from 'vitest'
import { detectGoalWithRecurringAsset, extractMonthlyAmount } from '@/lib/command-bar/bundled-intents'

const ctx = { currency: 'INR' as const, goals: [], assets: [], loans: [], today: '2024-08-15' }

describe('extractMonthlyAmount', () => {
  it('reads monthly amount from second clause after comma', () => {
    const phrase =
      'Create a goal retirement, and start a RD of 50,000 per month'
    expect(extractMonthlyAmount(phrase, 'INR')).toBe(5000000)
  })

  it('reads save amount before per month in timed purchase sentence', () => {
    const phrase =
      'i want to buy furniture worth 2L 1 year from now, i can afford to save 15k per month'
    expect(extractMonthlyAmount(phrase, 'INR')).toBe(1500000)
  })
})

describe('detectGoalWithRecurringAsset explicit', () => {
  it('detects retirement RD bundled goal', () => {
    const phrase =
      'Create a goal retirement, and start a RD of 50,000 per month'
    expect(detectGoalWithRecurringAsset(phrase, ctx)?.intent).toBe('CREATE_GOAL_WITH_ASSET')
  })

  it('detects furniture timed purchase goal', () => {
    const phrase =
      'i want to buy furniture worth 2L 1 year from now, i can afford to save 15k per month'
    const bundled = detectGoalWithRecurringAsset(phrase, ctx)
    expect(bundled?.intent).toBe('CREATE_GOAL_WITH_ASSET')
    expect(bundled?.goalName).toBe('Furniture')
    expect(bundled?.amount).toBe(20000000)
    expect(bundled?.monthlyInvestment).toBe(1500000)
  })
})
