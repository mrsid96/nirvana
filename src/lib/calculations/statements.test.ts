import { describe, expect, it } from 'vitest'
import { calculateMonthlyCashFlow } from '@/lib/calculations/cashflow'
import { monthKeyFromDate, shiftMonth } from '@/lib/formatters/dates'
import type { AssetTransaction } from '@/types/transaction'
import type { Income } from '@/types/income'
import type { Expense } from '@/types/expense'

describe('monthly statement assignment', () => {
  it('assigns transactions to month based on actual date not scheduled date', () => {
    const tx: AssetTransaction = {
      id: 't1',
      assetId: 'a1',
      goalId: 'g1',
      type: 'INVESTMENT',
      amount: 50_000,
      date: '2026-07-28',
      month: '2026-07',
      isDeleted: false,
      createdAt: '',
    }
    const july = calculateMonthlyCashFlow({
      income: [],
      expenses: [],
      transactions: [tx],
      loans: [],
      month: '2026-07',
    })
    const august = calculateMonthlyCashFlow({
      income: [],
      expenses: [],
      transactions: [tx],
      loans: [],
      month: '2026-08',
    })
    expect(july.investments).toBe(50_000)
    expect(august.investments).toBe(0)
  })

  it('uses month key from date for income entries', () => {
    const income: Income = {
      id: 'i1',
      amount: 400_000,
      source: 'Salary',
      date: '2026-01-31',
      month: monthKeyFromDate('2026-01-31'),
      isDeleted: false,
      createdAt: '',
    }
    const jan = calculateMonthlyCashFlow({
      income: [income],
      expenses: [],
      transactions: [],
      loans: [],
      month: '2026-01',
    })
    const feb = calculateMonthlyCashFlow({
      income: [income],
      expenses: [],
      transactions: [],
      loans: [],
      month: '2026-02',
    })
    expect(jan.income).toBe(400_000)
    expect(feb.income).toBe(0)
  })

  it('handles year transition for statements', () => {
    const expense: Expense = {
      id: 'e1',
      amount: 10_000,
      category: 'Food',
      date: '2025-12-31',
      month: '2025-12',
      isDeleted: false,
      createdAt: '',
      updatedAt: '',
    }
    const dec = calculateMonthlyCashFlow({
      income: [],
      expenses: [expense],
      transactions: [],
      loans: [],
      month: '2025-12',
    })
    const jan = calculateMonthlyCashFlow({
      income: [],
      expenses: [expense],
      transactions: [],
      loans: [],
      month: shiftMonth('2025-12', 1),
    })
    expect(dec.expenses).toBe(10_000)
    expect(jan.expenses).toBe(0)
  })
})
