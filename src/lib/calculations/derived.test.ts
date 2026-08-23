import { describe, expect, it } from 'vitest'
import {
  applyMonthlyDelta,
  computeMonthlySummaryForMonth,
  derivedGoalSummary,
  replayAssetFromLedger,
} from '@/lib/calculations/derived'
import type { Asset } from '@/types/asset'
import type { AssetTransaction } from '@/types/transaction'

const asset = (overrides: Partial<Asset> = {}): Asset => ({
  id: 'a1',
  goalId: 'g1',
  name: 'Fund',
  category: 'MF',
  source: 'ZERODHA',
  investmentType: 'SIP',
  investedAmount: 0,
  currentValue: 0,
  totalWithdrawals: 0,
  isActive: true,
  isDeleted: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('derived summaries', () => {
  it('replays asset ledger from transactions', () => {
    const transactions: AssetTransaction[] = [
      {
        id: 't1',
        assetId: 'a1',
        goalId: 'g1',
        type: 'INVESTMENT',
        amount: 100_000,
        date: '2026-08-01',
        month: '2026-08',
        isDeleted: false,
        createdAt: '',
      },
      {
        id: 't2',
        assetId: 'a1',
        goalId: 'g1',
        type: 'WITHDRAWAL',
        amount: 20_000,
        date: '2026-08-10',
        month: '2026-08',
        isDeleted: false,
        createdAt: '',
      },
      {
        id: 't3',
        assetId: 'a1',
        goalId: 'g1',
        type: 'VALUE_UPDATE',
        amount: 95_000,
        date: '2026-08-20',
        month: '2026-08',
        isDeleted: false,
        createdAt: '',
      },
    ]
    const replayed = replayAssetFromLedger(asset(), transactions)
    expect(replayed.investedAmount).toBe(100_000)
    expect(replayed.withdrawnAmount).toBe(20_000)
    expect(replayed.currentValue).toBe(95_000)
  })

  it('aggregates goal summaries from assets', () => {
    const summary = derivedGoalSummary('g1', [
      asset({ currentValue: 500_000, investedAmount: 400_000, totalWithdrawals: 50_000 }),
      asset({ id: 'a2', currentValue: 200_000, investedAmount: 180_000, monthlyInvestment: 10_000 }),
    ])
    expect(summary.currentValue).toBe(700_000)
    expect(summary.investedAmount).toBe(580_000)
    expect(summary.withdrawnAmount).toBe(50_000)
    expect(summary.monthlyInvestment).toBe(10_000)
  })

  it('updates monthly summary deltas', () => {
    const next = applyMonthlyDelta(null, '2026-08', {
      income: 400_000,
      expenses: 80_000,
      investments: 50_000,
      transactionCount: 3,
    })
    expect(next.income).toBe(400_000)
    expect(next.expenses).toBe(80_000)
    expect(next.investments).toBe(50_000)
    expect(next.freeCashFlow).toBe(270_000)
  })

  it('computes monthly summary from source records', () => {
    const summary = computeMonthlySummaryForMonth('2026-08', {
      income: [
        {
          id: 'i1',
          amount: 400_000,
          source: 'Salary',
          date: '2026-08-01',
          month: '2026-08',
          isDeleted: false,
          createdAt: '',
        },
      ],
      expenses: [
        {
          id: 'e1',
          amount: 80_000,
          category: 'Food',
          date: '2026-08-02',
          month: '2026-08',
          isDeleted: false,
          createdAt: '',
          updatedAt: '',
        },
      ],
      transactions: [
        {
          id: 't1',
          assetId: 'a1',
          goalId: 'g1',
          type: 'INVESTMENT',
          amount: 50_000,
          date: '2026-08-05',
          month: '2026-08',
          isDeleted: false,
          createdAt: '',
        },
      ],
      loanPayments: [],
    })
    expect(summary.income).toBe(400_000)
    expect(summary.expenses).toBe(80_000)
    expect(summary.investments).toBe(50_000)
    expect(summary.transactionCount).toBe(3)
  })
})
