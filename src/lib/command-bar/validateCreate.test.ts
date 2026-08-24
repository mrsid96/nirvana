import { describe, expect, it } from 'vitest'
import { validateCreateIntent } from '@/lib/command-bar/validateCreate'
import type { StructuredIntent } from '@/lib/command-bar/types'

describe('validateCreateIntent', () => {
  it('requires goal name and amount', () => {
    const intent: StructuredIntent = {
      intent: 'CREATE_GOAL',
      confidence: 1,
      targetDate: '2045-01-01',
    }
    expect(validateCreateIntent(intent)).toBe('Enter a goal name')
    intent.goalName = 'Retirement'
    expect(validateCreateIntent(intent)).toBe('Enter a target amount')
    intent.amount = 50000000
    expect(validateCreateIntent(intent)).toBeNull()
  })

  it('requires loan bank and amounts', () => {
    const intent: StructuredIntent = {
      intent: 'CREATE_LOAN',
      confidence: 1,
      loanName: 'Home Loan',
      originalAmount: 50000000,
      emiAmount: 4500000,
    }
    expect(validateCreateIntent(intent)).toBe('Enter the bank or lender')
    intent.bank = 'HDFC'
    expect(validateCreateIntent(intent)).toBeNull()
  })
})
