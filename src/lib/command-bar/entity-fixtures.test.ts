import { describe, expect, it } from 'vitest'
import { parseFinancialEntities } from '@/lib/command-bar/entity-parser'
import type { ParsedFinancialAction } from '@/lib/command-bar/entity-model'
import { toMinorUnits } from '@/lib/money'
import type { ParserContext } from '@/lib/command-bar/types'

const ctx: ParserContext = {
  currency: 'INR',
  goals: [],
  assets: [],
  loans: [],
  today: '2024-08-15',
}

function minor(major: number): number {
  return toMinorUnits(major, 'INR')
}

function findEntity(actions: ParsedFinancialAction[], entity: string) {
  return actions.filter((a) => a.entity === entity)
}

describe('entity parser fixtures', () => {
  describe('goals', () => {
    it('parses furniture goal with tenure', () => {
      const result = parseFinancialEntities(
        'I want to buy furniture worth 2L one year from now.',
        ctx,
      )
      const goals = findEntity(result.actions, 'GOAL')
      expect(goals).toHaveLength(1)
      expect(goals[0]?.data).toMatchObject({
        name: 'Buy Furniture',
        target_amount: minor(200000),
        tenure: '1 year',
      })
    })

    it('parses car goal', () => {
      const result = parseFinancialEntities('I want to buy a car for 10 lakhs in 2 years.', ctx)
      const goal = findEntity(result.actions, 'GOAL')[0]
      expect(goal?.data).toMatchObject({
        name: 'Buy Car',
        target_amount: minor(1000000),
        tenure: '2 years',
      })
    })
  })

  describe('goal + asset', () => {
    it('parses goal with unknown recurring asset when instrument unspecified', () => {
      const result = parseFinancialEntities(
        'I want furniture worth 2L in one year and can save 15k per month.',
        ctx,
      )
      expect(findEntity(result.actions, 'GOAL')).toHaveLength(1)
      const asset = findEntity(result.actions, 'ASSET')[0]
      expect(asset?.data).toMatchObject({
        type: 'unknown',
        contribution_amount: minor(15000),
        frequency: 'monthly',
      })
      expect(asset?.parent?.reference).toBe('Buy Furniture')
    })

    it('parses goal with mutual fund when specified', () => {
      const result = parseFinancialEntities(
        'I want a car for 10L in 2 years and will invest 20k every month in mutual funds.',
        ctx,
      )
      const asset = findEntity(result.actions, 'ASSET')[0]
      expect(asset?.data).toMatchObject({
        type: 'mutual_fund',
        contribution_amount: minor(20000),
        frequency: 'monthly',
      })
    })

    it('parses existing RD asset under goal', () => {
      const result = parseFinancialEntities(
        'I need 5L for education in 3 years and already have 2L in an RD.',
        ctx,
      )
      const asset = findEntity(result.actions, 'ASSET')[0]
      expect(asset?.data).toMatchObject({
        type: 'rd',
        current_value: minor(200000),
      })
    })
  })

  describe('income', () => {
    it('parses monthly salary', () => {
      const result = parseFinancialEntities('My salary is 1.5L per month.', ctx)
      const income = findEntity(result.actions, 'INCOME')[0]
      expect(income?.data).toMatchObject({
        type: 'salary',
        amount: minor(150000),
        frequency: 'monthly',
      })
    })

    it('parses one-time bonus', () => {
      const result = parseFinancialEntities('I received a bonus of 4L.', ctx)
      expect(findEntity(result.actions, 'INCOME')[0]?.data).toMatchObject({
        type: 'bonus',
        amount: minor(400000),
        frequency: 'one_time',
      })
    })
  })

  describe('expense', () => {
    it('parses grocery expense', () => {
      const result = parseFinancialEntities('I spent 5k on groceries today.', ctx)
      expect(findEntity(result.actions, 'EXPENSE')[0]?.data).toMatchObject({
        amount: minor(5000),
      })
    })

    it('does not classify transfer as expense', () => {
      const result = parseFinancialEntities(
        'I transferred 50k from savings to my current account.',
        ctx,
      )
      expect(findEntity(result.actions, 'EXPENSE')).toHaveLength(0)
    })
  })

  describe('loan', () => {
    it('parses home loan acquisition', () => {
      const result = parseFinancialEntities('I took a home loan of 50L.', ctx)
      expect(findEntity(result.actions, 'LOAN')[0]?.data).toMatchObject({
        type: 'home_loan',
        amount: minor(5000000),
      })
    })

    it('parses loan repayment not expense', () => {
      const result = parseFinancialEntities('I paid 30k towards my home loan.', ctx)
      expect(findEntity(result.actions, 'LOAN')[0]?.action).toBe('UPDATE')
      expect(findEntity(result.actions, 'EXPENSE')).toHaveLength(0)
    })
  })

  describe('withdraw', () => {
    it('parses RD withdrawal without expense', () => {
      const result = parseFinancialEntities('I withdrew 50k from my RD.', ctx)
      expect(findEntity(result.actions, 'WITHDRAW')[0]?.data).toMatchObject({
        amount: minor(50000),
        asset: 'rd',
      })
      expect(findEntity(result.actions, 'EXPENSE')).toHaveLength(0)
    })

    it('parses withdraw + expense when spent', () => {
      const result = parseFinancialEntities(
        'I withdrew 50k from my RD and spent it on furniture.',
        ctx,
      )
      expect(findEntity(result.actions, 'WITHDRAW')).toHaveLength(1)
      expect(findEntity(result.actions, 'EXPENSE')).toHaveLength(1)
    })
  })

  describe('disambiguation', () => {
    it('does not treat loan as income', () => {
      const result = parseFinancialEntities('I took a loan of 10L.', ctx)
      expect(findEntity(result.actions, 'INCOME')).toHaveLength(0)
      expect(findEntity(result.actions, 'LOAN')).toHaveLength(1)
    })
  })
})
