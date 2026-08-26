import { describe, expect, it } from 'vitest'
import { parseFinancialEntities } from '@/lib/command-bar/entity-parser'
import type {
  GoalActionData,
  ParsedFinancialAction,
  WithdrawActionData,
} from '@/lib/command-bar/entity-model'
import { toMinorUnits } from '@/lib/money'
import type { ParserContext } from '@/lib/command-bar/types'

const today = '2024-08-15'
const minor = (n: number) => toMinorUnits(n, 'INR')

function entities(actions: ParsedFinancialAction[], entity: string) {
  return actions.filter((a) => a.entity === entity)
}

describe('regression cases', () => {
  it('redeem for school fees — goal + withdraw, no expense', () => {
    const result = parseFinancialEntities(
      "I need 40k for my daughter's school fees, so I'll redeem 40k from the mutual fund I created for her education.",
      { currency: 'INR', goals: [], assets: [], loans: [], today },
    )
    expect(entities(result.actions, 'EXPENSE')).toHaveLength(0)
    expect(entities(result.actions, 'WITHDRAW')).toHaveLength(1)
    expect(entities(result.actions, 'WITHDRAW')[0]?.data).toMatchObject({
      amount: minor(40000),
      asset: 'mutual_fund',
    })
    const goal = entities(result.actions, 'GOAL')[0]
    expect((goal?.data as GoalActionData).name).toMatch(/education/i)
  })

  it('home loan + savings + clear loan goal', () => {
    const result = parseFinancialEntities(
      "I'm taking a 30L home loan, putting 10L from my savings into the house, and want to have the loan cleared within 7 years.",
      { currency: 'INR', goals: [], assets: [], loans: [], today },
    )
    expect(entities(result.actions, 'INCOME')).toHaveLength(0)
    const loan = entities(result.actions, 'LOAN')[0]
    expect(loan?.data).toMatchObject({ type: 'home_loan', amount: minor(3000000) })
    const goal = entities(result.actions, 'GOAL').find((g) => (g.data as GoalActionData).tenure)
    expect((goal?.data as GoalActionData).name).toMatch(/loan|house/i)
    expect((goal?.data as GoalActionData).tenure).toMatch(/7 years/)
    const asset = entities(result.actions, 'ASSET')[0]
    expect(asset?.data).toMatchObject({ type: 'savings', current_value: minor(1000000) })
  })

  it('resolves pronoun references from context', () => {
    const ctx: ParserContext = {
      currency: 'INR',
      today,
      goals: [{ id: 'g1', name: 'Retirement' }],
      assets: [{ id: 'a1', name: 'Mutual Fund SIP', goalId: 'g1' }],
      loans: [],
      currentGoalId: 'g1',
      currentAssetId: 'a1',
    }
    const result = parseFinancialEntities(
      "I'll add another 20k to it every month, but I might withdraw 50k from it next year for an emergency.",
      ctx,
    )
    expect(entities(result.actions, 'GOAL')).toHaveLength(0)
    const asset = entities(result.actions, 'ASSET')[0]
    expect(asset?.action).toBe('UPDATE')
    expect(asset?.parent?.reference).toBe('Retirement')
    expect(asset?.data).toMatchObject({ contribution_amount: minor(20000), frequency: 'monthly' })
    const withdraw = entities(result.actions, 'WITHDRAW')[0]
    expect(withdraw?.data).toMatchObject({
      amount: minor(50000),
      goal: 'Retirement',
    })
    expect((withdraw?.data as WithdrawActionData).date).toBe('2025-08-15')
  })

  it('salary breakdown with ambiguous dual-asset allocation', () => {
    const result = parseFinancialEntities(
      "My salary is 2L a month, 45k goes towards the home loan, I spend roughly 35k on everything else, and I'm putting 50k monthly into a mix of mutual funds and an RD for my child's education.",
      { currency: 'INR', goals: [], assets: [], loans: [], today },
    )
    expect(entities(result.actions, 'INCOME')[0]?.data).toMatchObject({
      type: 'salary',
      amount: minor(200000),
      frequency: 'monthly',
    })
    expect(entities(result.actions, 'LOAN')[0]?.data).toMatchObject({
      type: 'home_loan',
      emi: minor(45000),
      frequency: 'monthly',
    })
    expect(entities(result.actions, 'EXPENSE')[0]?.data).toMatchObject({
      amount: minor(35000),
      frequency: 'monthly',
    })
    const goal = entities(result.actions, 'GOAL')[0]
    expect((goal?.data as GoalActionData).name).toMatch(/education/i)
    const assets = entities(result.actions, 'ASSET')
    expect(assets).toHaveLength(2)
    expect(assets.map((a) => (a.data as { type: string }).type).sort()).toEqual(['mutual_fund', 'rd'])
    expect(result.unresolved).toContain('asset_allocation')
    expect(assets.every((a) => !(a.data as { contribution_amount?: number }).contribution_amount)).toBe(true)
  })
})
