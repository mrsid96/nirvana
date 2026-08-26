import { extractAmount } from '@/lib/command-bar/amount'
import { extractMonthlyAmount } from '@/lib/command-bar/bundled-intents'
import { extractDate } from '@/lib/command-bar/date'
import type { LoanActionData, ParsedFinancialAction } from '@/lib/command-bar/entity-model'
import { extractTenureMonths } from '@/lib/command-bar/slot-resolver'
import type { ParserContext } from '@/lib/command-bar/types'
import type { SupportedCurrency } from '@/types/user'

const LOAN_TYPES: Array<{ type: string; pattern: RegExp }> = [
  { type: 'home_loan', pattern: /\b(home loan|mortgage|house loan)\b/i },
  { type: 'car_loan', pattern: /\bcar loan\b/i },
  { type: 'education_loan', pattern: /\beducation loan\b/i },
  {
    type: 'personal_loan',
    pattern:
      /\b(personal loan|borrowed|owe|from my|from a friend|from my brother|from my father|from my friend)\b/i,
  },
  { type: 'credit_card', pattern: /\bcredit card\b/i },
]

function inferLoanType(text: string): string | undefined {
  for (const { type, pattern } of LOAN_TYPES) {
    if (pattern.test(text)) return type
  }
  if (/\bloan\b/i.test(text)) return 'personal_loan'
  return undefined
}

function extractLoanPrincipal(text: string, currency: SupportedCurrency): number | undefined {
  const patterns = [
    /\b(?:taking|take|took|got|availed)\s+(?:a\s+)?([\d,.]+(?:\s*(?:k|l|lac|lakh|lacs|lakhs|cr|crore))?)\s+(?:home\s+)?loan\b/i,
    /\b([\d,.]+(?:\s*(?:k|l|lac|lakh|lacs|lakhs|cr|crore))?)\s+(?:home\s+)?loan\b/i,
    /\bloan\s+of\s+([\d,.]+(?:\s*(?:k|l|lac|lakh|lacs|lakhs|cr|crore))?)/i,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      const amount = extractAmount(match[1], currency)
      if (amount) return amount
    }
  }
  return undefined
}

function extractLoanPaymentAmount(text: string, currency: SupportedCurrency): number | undefined {
  const towards = text.match(
    /\b([\d,.]+(?:\s*(?:k|l|lac|lakh|lacs|lakhs))?)\s+(?:goes|going)\s+towards?\s+(?:the\s+)?(?:my\s+)?(?:home\s+)?loan\b/i,
  )
  if (towards?.[1]) {
    return extractAmount(towards[1], currency)
  }
  return extractMonthlyAmount(text, currency) ?? extractAmount(text, currency)
}

export function parseLoanEntities(text: string, context: ParserContext): ParsedFinancialAction[] {
  const n = text.toLowerCase()
  if (/\b(had to|have to pay|for which i have to pay|for around)\b/.test(n)) {
    return []
  }

  const hasLoan =
    /\b(loan|borrow|borrowed|owe|emi|mortgage|credit card)\b/.test(n) ||
    /\b(take|took|taken|taking|got|availed)\b[^.]{0,40}?\bloan\b/.test(n)

  const goesTowardsLoan = /\b(goes|going)\s+towards?\s+(?:the\s+)?(?:my\s+)?(?:home\s+)?loan\b/.test(n)

  if (!hasLoan && !goesTowardsLoan) return []

  const isRepayment =
    (/\b(paid|payment|repay|repaid)\b/.test(n) || goesTowardsLoan) &&
    !/\b(take|took|taken|taking|borrow|have a|have an|got a)\b/.test(n) &&
    !/\b(have to|will|going to)\b/.test(n)

  const loanType = inferLoanType(text)
  const emi = goesTowardsLoan
    ? extractLoanPaymentAmount(text, context.currency)
    : extractMonthlyAmount(text, context.currency)
  const tenure = extractTenureMonths(text)
  const principal = extractLoanPrincipal(text, context.currency)
  const amount = principal ?? extractAmount(text, context.currency)
  const lenderMatch = text.match(/\bfrom\s+(?:my\s+)?([a-z][\w]+)\b/i)
  const rateMatch = text.match(/\b(?:at|@)\s*(\d+(?:\.\d+)?)\s*%/i)

  if (isRepayment) {
    const data: LoanActionData = {
      type: loanType,
      repayment: amount ?? emi,
      emi,
      frequency: emi ? 'monthly' : undefined,
      date: extractDate(text, context.today),
    }
    return [{ entity: 'LOAN', action: 'UPDATE', data, confidence: 0.9 }]
  }

  const data: LoanActionData = {
    type: loanType,
    amount: principal ?? (amount && amount !== emi ? amount : undefined),
    outstanding_amount: /\boutstanding|remaining|owe\b/i.test(text) ? amount : undefined,
    emi,
    frequency: emi ? 'monthly' : undefined,
    tenure: tenure ? `${tenure} months` : undefined,
    lender: lenderMatch?.[1],
    interest_rate: rateMatch ? Number(rateMatch[1]) : undefined,
    date: extractDate(text, context.today),
  }

  if (!data.amount && !data.outstanding_amount && !data.emi) return []

  if (!data.amount && emi && tenure) {
    data.amount = emi * tenure
    data.outstanding_amount = data.amount
  }

  return [{ entity: 'LOAN', action: 'CREATE', data, confidence: 0.9 }]
}
