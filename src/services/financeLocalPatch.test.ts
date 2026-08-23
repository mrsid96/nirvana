import { describe, expect, it } from 'vitest'
import {
  applyGoalPatch,
  buildGoalFromInput,
  buildLoanFromInput,
  computeTransactionSideEffects,
} from '@/services/financeLocalPatch'
import type { Asset } from '@/types/asset'
import type { Goal } from '@/types/goal'
import type { AssetTransaction } from '@/types/transaction'

describe('finance local patch helpers', () => {
  it('builds a goal without extra Firestore reads', () => {
    const goal = buildGoalFromInput('g1', 'user-1', {
      name: 'Retirement',
      targetAmount: 1_000_000,
      startDate: '2026-01-01',
      targetDate: '2040-01-01',
      priority: 'high',
      status: 'active',
    })
    expect(goal.id).toBe('g1')
    expect(goal.currentValue).toBe(0)
  })

  it('patches goal list in memory', () => {
    const goal = buildGoalFromInput('g1', 'user-1', {
      name: 'Retirement',
      targetAmount: 1_000_000,
      startDate: '2026-01-01',
      targetDate: '2040-01-01',
      priority: 'high',
      status: 'active',
    })
    const next = applyGoalPatch(
      {
        goals: [],
        assets: [],
        transactions: [],
        loans: [],
        loanPayments: [],
        expenses: [],
        income: [],
        recurringActivities: [],
        scheduledOccurrences: [],
        monthlySummaries: {},
        currentMonthlySummary: null,
      },
      goal,
    )
    expect(next.goals).toHaveLength(1)
  })

  it('computes transaction side effects locally', () => {
    const goal: Goal = {
      id: 'g1',
      name: 'Retirement',
      targetAmount: 1_000_000,
      startDate: '2026-01-01',
      targetDate: '2040-01-01',
      priority: 'high',
      status: 'active',
      isDeleted: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    const asset: Asset = {
      id: 'a1',
      goalId: 'g1',
      name: 'Fund',
      category: 'MF',
      source: 'GROWW',
      investmentType: 'SIP',
      investedAmount: 100_00,
      currentValue: 100_00,
      totalWithdrawals: 0,
      isActive: true,
      isDeleted: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    const tx: AssetTransaction = {
      id: 't1',
      assetId: 'a1',
      goalId: 'g1',
      type: 'INVESTMENT',
      amount: 50_00,
      date: '2026-01-15',
      month: '2026-01',
      isDeleted: false,
      createdAt: '2026-01-15T00:00:00.000Z',
    }
    const effects = computeTransactionSideEffects(asset, tx, goal, [asset], null)
    expect(effects.asset.investedAmount).toBe(150_00)
    expect(effects.monthlySummary.investments).toBe(50_00)
  })

  it('builds loan from input with derived progress fields', () => {
    const loan = buildLoanFromInput('l1', 'user-1', {
      name: 'Home',
      bank: 'HDFC',
      originalAmount: 1_000_000,
      outstandingAmount: 800_000,
      interestRate: 8,
      tenureMonths: 120,
      startDate: '2020-01-01',
      emiAmount: 10_000,
      emiDate: 5,
      deductionBank: 'HDFC',
      status: 'ACTIVE',
    })
    expect(loan.totalPaid).toBe(200_000)
    expect(loan.progressPercentage).toBe(20)
  })
})
