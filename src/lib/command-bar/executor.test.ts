import { describe, expect, it, vi } from 'vitest'
import { executeConfirmedIntent } from '@/lib/command-bar/executor'
import type { CommandBarFinance } from '@/lib/command-bar/executor'
import type { StructuredIntent } from '@/lib/command-bar/types'
import type { Asset } from '@/types/asset'
import type { ScheduledOccurrence } from '@/types/recurring'

const asset: Asset = {
  id: 'a1',
  goalId: 'g1',
  name: 'HDFC Fund',
  category: 'MF',
  source: 'ZERODHA',
  investmentType: 'LUMP_SUM',
  investedAmount: 100000,
  currentValue: 100000,
  totalWithdrawals: 0,
  isActive: true,
  isDeleted: false,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}

function mockFinance(): CommandBarFinance {
  return {
    assets: [asset],
    goals: [{ id: 'g1', name: 'Retirement' }],
    scheduledOccurrences: [],
    addGoal: vi.fn().mockResolvedValue('g-new'),
    addAsset: vi.fn().mockResolvedValue('a-new'),
    addLoan: vi.fn().mockResolvedValue('l-new'),
    addExpense: vi.fn().mockResolvedValue(undefined),
    addIncome: vi.fn().mockResolvedValue(undefined),
    addTransaction: vi.fn().mockResolvedValue(undefined),
    addLoanPayment: vi.fn().mockResolvedValue(undefined),
    addRecurringActivity: vi.fn().mockResolvedValue('r-new'),
    skipOccurrence: vi.fn().mockResolvedValue(undefined),
  }
}

describe('executeConfirmedIntent', () => {
  it('creates a goal', async () => {
    const finance = mockFinance()
    const intent: StructuredIntent = {
      intent: 'CREATE_GOAL',
      confidence: 1,
      amount: 50000000,
      goalName: 'Retirement',
      targetDate: '2045-01-01',
    }
    await executeConfirmedIntent(intent, finance)
    expect(finance.addGoal).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Retirement', targetAmount: 50000000 }),
    )
  })

  it('creates an asset', async () => {
    const finance = mockFinance()
    await executeConfirmedIntent(
      {
        intent: 'CREATE_ASSET',
        confidence: 1,
        amount: 2000000,
        goalId: 'g1',
        assetName: 'Nifty ETF',
      },
      finance,
    )
    expect(finance.addAsset).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Nifty ETF', goalId: 'g1', investedAmount: 2000000 }),
    )
  })

  it('creates a loan', async () => {
    const finance = mockFinance()
    await executeConfirmedIntent(
      {
        intent: 'CREATE_LOAN',
        confidence: 1,
        amount: 5000000,
        loanName: 'Home Loan',
      },
      finance,
    )
    expect(finance.addLoan).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Home Loan', originalAmount: 5000000 }),
    )
  })

  it('creates recurring expense (non-loan)', async () => {
    const finance = mockFinance()
    await executeConfirmedIntent(
      {
        intent: 'CREATE_RECURRING_EXPENSE',
        confidence: 1,
        amount: 150000,
        category: 'Groceries',
        dayOfMonth: 5,
      },
      finance,
    )
    expect(finance.addRecurringActivity).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'EXPENSE', expenseCategory: 'Groceries' }),
    )
  })

  it('creates a loan with rich fields', async () => {
    const finance = mockFinance()
    await executeConfirmedIntent(
      {
        intent: 'CREATE_LOAN',
        confidence: 1,
        loanName: 'Home Loan',
        bank: 'HDFC',
        originalAmount: 50000000,
        outstandingAmount: 45000000,
        emiAmount: 4500000,
        interestRate: 8.5,
        tenureMonths: 180,
        dayOfMonth: 10,
        startDate: '2024-01-15',
      },
      finance,
    )
    expect(finance.addLoan).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Home Loan',
        bank: 'HDFC',
        originalAmount: 50000000,
        outstandingAmount: 45000000,
        emiAmount: 4500000,
        interestRate: 8.5,
        tenureMonths: 180,
        emiDate: 10,
        startDate: '2024-01-15',
      }),
    )
  })

  it('skips scheduled occurrence', async () => {
    const occurrence: ScheduledOccurrence = {
      id: 'occ1',
      recurringActivityId: 'r1',
      type: 'INVESTMENT',
      name: 'Retirement SIP',
      expectedAmount: 5000000,
      scheduledDate: '2024-08-05',
      status: 'DUE',
      isDeleted: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }
    const finance = mockFinance()
    finance.scheduledOccurrences = [occurrence]
    await executeConfirmedIntent(
      { intent: 'SKIP_SCHEDULED_TRANSACTION', confidence: 1, scheduledOccurrenceId: 'occ1' },
      finance,
    )
    expect(finance.skipOccurrence).toHaveBeenCalledWith(occurrence, undefined)
  })
})
