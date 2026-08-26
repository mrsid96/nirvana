import { describe, expect, it } from 'vitest'
import { parseCommand } from '@/lib/command-bar/parser'
import type { ParserContext } from '@/lib/command-bar/types'

const baseContext: ParserContext = {
  currency: 'INR',
  goals: [
    { id: 'g1', name: 'Retirement' },
    { id: 'g2', name: 'Emergency Fund' },
  ],
  assets: [{ id: 'a1', name: 'HDFC Flexi Cap', goalId: 'g1' }],
  loans: [{ id: 'l1', name: 'Home Loan' }],
  today: '2024-08-15',
}

type PhraseCase = {
  phrase: string
  intent: string
  notIntent?: string[]
}

const PHRASE_BANK: PhraseCase[] = [
  { phrase: 'Salary of ₹2.8L came in today', intent: 'ADD_INCOME' },
  { phrase: 'Received ₹50,000 bonus today', intent: 'ADD_INCOME' },
  { phrase: 'Spent ₹2,400 on groceries', intent: 'ADD_EXPENSE' },
  { phrase: 'Bought clothes for ₹8,500 today', intent: 'ADD_EXPENSE' },
  { phrase: 'Invested ₹50,000 in retirement today', intent: 'RECORD_INVESTMENT' },
  { phrase: 'Withdraw ₹20,000 from emergency fund', intent: 'RECORD_WITHDRAWAL' },
  { phrase: 'Paid ₹45,000 home loan EMI today', intent: 'RECORD_LOAN_PAYMENT' },
  {
    phrase: 'Took a loan for home interiors, paying ₹15,000 per month for 15 months',
    intent: 'CREATE_LOAN',
    notIntent: ['CREATE_GOAL', 'CREATE_GOAL_WITH_ASSET'],
  },
  {
    phrase:
      'i had a bad day, had to take a loan for home interiors for around 15 months, for which i have to pay 15000 per month',
    intent: 'CREATE_LOAN',
    notIntent: ['CREATE_GOAL', 'CREATE_GOAL_WITH_ASSET', 'UNKNOWN'],
  },
  {
    phrase: 'Create a car loan of ₹8 lakh, EMI ₹18,000 every month',
    intent: 'CREATE_LOAN',
  },
  {
    phrase: 'I want a bike for ₹3L, invest ₹10k every month in mutual fund',
    intent: 'CREATE_GOAL_WITH_ASSET',
    notIntent: ['CREATE_LOAN'],
  },
  {
    phrase:
      'Gift myself an S26 Ultra, put ₹15k aside every month in a mutual fund',
    intent: 'CREATE_GOAL_WITH_ASSET',
    notIntent: ['CREATE_LOAN'],
  },
  {
    phrase:
      'i want to buy furniture worth 2L 1 year from now, i can afford to save 15k per month',
    intent: 'CREATE_GOAL_WITH_ASSET',
    notIntent: ['CREATE_LOAN', 'UNKNOWN'],
  },
  {
    phrase: 'Create retirement goal for ₹1 crore',
    intent: 'CREATE_GOAL',
  },
  { phrase: 'How much did I spend this month?', intent: 'QUERY_MONTHLY_SPENDING' },
  { phrase: 'Show my retirement progress', intent: 'QUERY_GOAL_PROGRESS' },
  { phrase: 'Open Wealth', intent: 'OPEN_WEALTH' },
]

describe('phrase bank', () => {
  for (const { phrase, intent, notIntent } of PHRASE_BANK) {
    it(`parses: ${phrase.slice(0, 60)}…`, () => {
      const result = parseCommand(phrase, baseContext)
      expect(result.structured.intent).toBe(intent)
      for (const blocked of notIntent ?? []) {
        expect(result.structured.intent).not.toBe(blocked)
      }
      expect(result.phase).not.toBe('unknown')
    })
  }
})

describe('timed purchase goal details', () => {
  it('extracts furniture goal with worth, horizon, and monthly save', () => {
    const phrase =
      'i want to buy furniture worth 2L 1 year from now, i can afford to save 15k per month'
    const result = parseCommand(phrase, baseContext)
    expect(result.structured.intent).toBe('CREATE_GOAL_WITH_ASSET')
    expect(result.structured.goalName).toBe('Furniture')
    expect(result.structured.amount).toBe(20000000)
    expect(result.structured.monthlyInvestment).toBe(1500000)
    expect(result.structured.targetDate).toBe('2025-08-15')
    expect(result.structured.assetName).toBe('Unspecified savings')
    expect(result.phase).toBe('needs_confirmation')
  })
})

describe('narrative loan details', () => {
  it('extracts home interiors loan with EMI and tenure', () => {
    const phrase =
      'i had a bad day, had to take a loan for home interiors for around 15 months, for which i have to pay 15000 per month'
    const result = parseCommand(phrase, baseContext)
    expect(result.structured.intent).toBe('CREATE_LOAN')
    expect(result.structured.loanName).toBe('Home Interiors')
    expect(result.structured.emiAmount).toBe(1500000)
    expect(result.structured.tenureMonths).toBe(15)
    expect(result.phase).toBe('needs_confirmation')
  })
})
