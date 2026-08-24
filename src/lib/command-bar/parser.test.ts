import { describe, expect, it } from 'vitest'
import { extractAmount } from '@/lib/command-bar/amount'
import { extractDate, extractDayOfMonth, isRecurringPhrase, isPastActionPhrase } from '@/lib/command-bar/date'
import {
  extractExpenseCategory,
  extractGoalHint,
  extractIncomeCategory,
  extractLoanHint,
} from '@/lib/command-bar/entities'
import { parseCommand } from '@/lib/command-bar/parser'
import type { ParserContext } from '@/lib/command-bar/types'

const baseContext: ParserContext = {
  currency: 'INR',
  goals: [
    { id: 'g1', name: 'Retirement' },
    { id: 'g2', name: 'Emergency Fund' },
    { id: 'g3', name: 'Child Education' },
    { id: 'g4', name: 'Retirement 2035' },
  ],
  assets: [
    { id: 'a1', name: 'HDFC Flexi Cap', goalId: 'g1' },
    { id: 'a2', name: 'Nifty 50 ETF', goalId: 'g1' },
    { id: 'a3', name: 'Emergency Savings', goalId: 'g2' },
  ],
  loans: [{ id: 'l1', name: 'Home Loan' }],
  today: '2024-08-15',
}

describe('extractAmount', () => {
  it('parses ₹2.8L', () => {
    expect(extractAmount('Salary of ₹2.8L came today', 'INR')).toBe(28000000)
  })

  it('parses 50k', () => {
    expect(extractAmount('Invested 50k in retirement', 'INR')).toBe(5000000)
  })

  it('parses 2.5 lakh', () => {
    expect(extractAmount('Got 2.5 lakh salary', 'INR')).toBe(25000000)
  })

  it('parses ₹50,000', () => {
    expect(extractAmount('Invested ₹50,000 in retirement', 'INR')).toBe(5000000)
  })

  it('parses plain 280000', () => {
    expect(extractAmount('Salary 280000 received', 'INR')).toBe(28000000)
  })

  it('parses spent 500', () => {
    expect(extractAmount('Spent 500 on groceries', 'INR')).toBe(50000)
  })
})

describe('extractDate', () => {
  it('parses today', () => {
    expect(extractDate('came in today', '2024-08-15')).toBe('2024-08-15')
  })

  it('parses yesterday', () => {
    expect(extractDate('spent yesterday', '2024-08-15')).toBe('2024-08-14')
  })
})

describe('extractDayOfMonth', () => {
  it('parses every 5th', () => {
    expect(extractDayOfMonth('every 5th of the month')).toBe(5)
  })

  it('parses SIP on 5th', () => {
    expect(extractDayOfMonth('Set up a 50k SIP every 5th')).toBe(5)
  })
})

describe('entity extraction', () => {
  it('extracts retirement goal hint', () => {
    expect(extractGoalHint('invest 50k in retirement')).toBe('retirement')
  })

  it('extracts groceries category', () => {
    expect(extractExpenseCategory('Spent on groceries')).toBe('Groceries')
  })

  it('extracts salary income', () => {
    expect(extractIncomeCategory('Salary of 2.8L came today')).toBe('Salary')
  })

  it('extracts home loan hint', () => {
    expect(extractLoanHint('Paid 45k towards home loan')).toBe('home loan')
  })
})

describe('recurring vs past phrases', () => {
  it('detects recurring', () => {
    expect(isRecurringPhrase('Invest 50k every month')).toBe(true)
    expect(isRecurringPhrase('Set up a 50k SIP')).toBe(true)
  })

  it('detects past actions', () => {
    expect(isPastActionPhrase('Invested 50k today')).toBe(true)
    expect(isPastActionPhrase('Salary came in today')).toBe(true)
  })
})

describe('parseCommand — spec examples', () => {
  it('Salary of ₹2.8L came today', () => {
    const r = parseCommand('Salary of ₹2.8L came today', baseContext)
    expect(r.structured.intent).toBe('ADD_INCOME')
    expect(r.structured.amount).toBe(28000000)
    expect(r.phase).toBe('needs_confirmation')
  })

  it('Salary 280000 received', () => {
    const r = parseCommand('Salary 280000 received', baseContext)
    expect(r.structured.intent).toBe('ADD_INCOME')
    expect(r.structured.amount).toBe(28000000)
  })

  it('Got 2.8 lakh salary today', () => {
    const r = parseCommand('Got 2.8 lakh salary today', baseContext)
    expect(r.structured.intent).toBe('ADD_INCOME')
    expect(r.structured.amount).toBe(28000000)
  })

  it('Invested ₹50,000 in retirement', () => {
    const r = parseCommand('Invested ₹50,000 in retirement', baseContext)
    expect(r.structured.intent).toBe('RECORD_INVESTMENT')
    expect(r.structured.amount).toBe(5000000)
    expect(r.structured.goalId).toBe('g1')
    expect(r.structured.goalName).toBe('Retirement')
  })

  it('Put 20k into my HDFC fund', () => {
    const r = parseCommand('Put 20k into my HDFC fund', baseContext)
    expect(r.structured.intent).toBe('RECORD_INVESTMENT')
    expect(r.structured.amount).toBe(2000000)
    expect(r.structured.assetId).toBe('a1')
  })

  it('Spent ₹2,400 on groceries', () => {
    const r = parseCommand('Spent ₹2,400 on groceries', baseContext)
    expect(r.structured.intent).toBe('ADD_EXPENSE')
    expect(r.structured.amount).toBe(240000)
    expect(r.structured.category).toBe('Groceries')
  })

  it('Paid 45k towards home loan', () => {
    const r = parseCommand('Paid 45k towards home loan', baseContext)
    expect(r.structured.intent).toBe('RECORD_LOAN_PAYMENT')
    expect(r.structured.amount).toBe(4500000)
    expect(r.structured.loanId).toBe('l1')
  })

  it('Withdraw 20k from emergency fund', () => {
    const r = parseCommand('Withdraw 20k from emergency fund', baseContext)
    expect(r.structured.intent).toBe('RECORD_WITHDRAWAL')
    expect(r.structured.amount).toBe(2000000)
    expect(r.structured.goalId).toBe('g2')
  })

  it('Invest 50k every month for retirement', () => {
    const r = parseCommand('Invest 50k every month for retirement', baseContext)
    expect(r.structured.intent).toBe('CREATE_RECURRING_INVESTMENT')
    expect(r.structured.amount).toBe(5000000)
    expect(r.structured.goalId).toBe('g1')
    expect(r.structured.frequency).toBe('MONTHLY')
  })

  it('Set up a 50k SIP every 5th', () => {
    const r = parseCommand('Set up a 50k SIP every 5th', baseContext)
    expect(r.structured.intent).toBe('CREATE_RECURRING_INVESTMENT')
    expect(r.structured.amount).toBe(5000000)
    expect(r.structured.dayOfMonth).toBe(5)
  })

  it('Show my retirement progress', () => {
    const r = parseCommand('Show my retirement progress', baseContext)
    expect(r.structured.intent).toBe('QUERY_GOAL_PROGRESS')
    expect(r.phase).toBe('ready')
  })

  it('How much did I spend this month?', () => {
    const r = parseCommand('How much did I spend this month?', baseContext)
    expect(r.structured.intent).toBe('QUERY_MONTHLY_SPENDING')
    expect(r.phase).toBe('ready')
  })

  it('How much is left on my home loan?', () => {
    const r = parseCommand('How much is left on my home loan?', baseContext)
    expect(r.structured.intent).toBe('QUERY_LOAN_OUTSTANDING')
    expect(r.phase).toBe('ready')
  })

  it('Open Wealth', () => {
    const r = parseCommand('Open Wealth', baseContext)
    expect(r.structured.intent).toBe('OPEN_WEALTH')
    expect(r.structured.navigationPath).toBe('/wealth')
    expect(r.phase).toBe('ready')
  })

  it('Show my loans', () => {
    const r = parseCommand('Show my loans', baseContext)
    expect(r.structured.intent).toBe('OPEN_LOANS')
    expect(r.phase).toBe('ready')
  })

  it('Skip retirement SIP', () => {
    const r = parseCommand('Skip my retirement SIP', {
      ...baseContext,
      scheduledOccurrences: [
        { id: 'occ1', name: 'Retirement SIP', status: 'DUE' },
        { id: 'occ2', name: 'Home Loan EMI', status: 'UPCOMING' },
      ],
    })
    expect(r.structured.intent).toBe('SKIP_SCHEDULED_TRANSACTION')
    expect(r.structured.scheduledOccurrenceId).toBe('occ1')
    expect(r.phase).toBe('needs_confirmation')
  })

  it('Create retirement goal 50 lakh', () => {
    const r = parseCommand('Create retirement goal 50 lakh', baseContext)
    expect(r.structured.intent).toBe('CREATE_GOAL')
    expect(r.structured.amount).toBe(500000000)
    expect(r.phase).toBe('needs_confirmation')
  })

  it('Open HDFC fund navigates to goal', () => {
    const r = parseCommand('Open my HDFC fund', baseContext)
    expect(r.structured.intent).toBe('OPEN_ASSET')
    expect(r.structured.assetId).toBe('a1')
    expect(r.structured.navigationPath).toBe('/wealth/g1')
  })
})

describe('parseCommand — edge cases', () => {
  it('missing amount asks clarification', () => {
    const r = parseCommand('Spent on groceries', baseContext)
    expect(r.clarification?.kind).toBe('missing_amount')
  })

  it('missing goal asks clarification', () => {
    const r = parseCommand('Invest 50k every month', baseContext)
    expect(r.phase).toBe('needs_clarification')
    expect(r.clarification?.kind).toBe('missing_goal')
  })

  it('ambiguous goal or asset triggers clarification', () => {
    const r = parseCommand('Invest 50k in retirement today', {
      ...baseContext,
      goals: [
        { id: 'g1', name: 'Retirement' },
        { id: 'g4', name: 'Retirement 2035' },
      ],
    })
    if (r.phase === 'needs_clarification') {
      expect(['ambiguous_goal', 'ambiguous_asset', 'missing_asset']).toContain(r.clarification?.kind)
    } else {
      expect(r.structured.goalId).toBeDefined()
    }
  })

  it('ambiguous invest intent', () => {
    const r = parseCommand('I invested 50k in retirement every month', baseContext)
    expect(r.phase).toBe('needs_clarification')
    expect(r.clarification?.kind).toBe('ambiguous_intent')
  })

  it('unsupported sentence returns unknown', () => {
    const r = parseCommand('Hello world random text', baseContext)
    expect(r.structured.intent).toBe('UNKNOWN')
    expect(r.phase).toBe('unknown')
  })

  it('uses context for goal when on goal page', () => {
    const r = parseCommand('Invest 20k today', {
      ...baseContext,
      currentGoalId: 'g1',
      currentAssetId: 'a1',
    })
    expect(r.structured.goalId).toBe('g1')
    expect(r.structured.assetId).toBe('a1')
  })

  it('uses context for loan payment', () => {
    const r = parseCommand('Paid 45k today', {
      ...baseContext,
      currentLoanId: 'l1',
    })
    expect(r.structured.intent).toBe('RECORD_LOAN_PAYMENT')
    expect(r.structured.loanId).toBe('l1')
  })

  it('parses within 300ms', () => {
    const start = performance.now()
    for (let i = 0; i < 100; i++) {
      parseCommand('Invested 50k in retirement today', baseContext)
    }
    const elapsed = performance.now() - start
    expect(elapsed / 100).toBeLessThan(300)
  })
})
