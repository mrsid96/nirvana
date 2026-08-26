import { extractAmount } from '@/lib/command-bar/amount'
import { extractDate } from '@/lib/command-bar/date'
import type { IncomeActionData, ParsedFinancialAction } from '@/lib/command-bar/entity-model'
import type { ParserContext } from '@/lib/command-bar/types'

const INCOME_TYPES: Array<{ type: string; pattern: RegExp }> = [
  { type: 'salary', pattern: /\b(salary|paycheck|pay roll|payroll|wages)\b/i },
  { type: 'bonus', pattern: /\b(bonus|referral)\b/i },
  { type: 'rental', pattern: /\b(rent|rental)\b/i },
  { type: 'interest', pattern: /\binterest\b/i },
  { type: 'freelance', pattern: /\b(freelanc|contract|project)\b/i },
  { type: 'dividend', pattern: /\bdividend\b/i },
  { type: 'business', pattern: /\b(business|side business)\b/i },
  { type: 'cashback', pattern: /\bcashback\b/i },
]

function isIncomeClause(text: string): boolean {
  const n = text.toLowerCase()
  if (/\b(salary|received|got|came in|earn|earned|made|income|paycheck|bonus|dividend|interest)\b/.test(n)) {
    if (/\b(spent|paid|bought|withdraw|redeem)\b/.test(n)) return false
    return true
  }
  return false
}

export function parseIncomeEntities(text: string, context: ParserContext): ParsedFinancialAction[] {
  if (!isIncomeClause(text)) return []

  const amount = extractAmount(text, context.currency)
  if (!amount) return []

  const frequency = /\b(every month|per month|monthly|a month)\b/i.test(text)
    ? ('monthly' as const)
    : /\b(every year|per year|yearly|annually|annual)\b/i.test(text)
      ? ('yearly' as const)
      : ('one_time' as const)

  let incomeType: string | undefined
  for (const { type, pattern } of INCOME_TYPES) {
    if (pattern.test(text)) {
      incomeType = type
      break
    }
  }

  const data: IncomeActionData = {
    type: incomeType,
    amount,
    frequency,
    date: extractDate(text, context.today),
  }

  return [{ entity: 'INCOME', action: 'CREATE', data, confidence: 0.88 }]
}
