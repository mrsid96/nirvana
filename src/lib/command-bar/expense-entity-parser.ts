import { extractAmount } from '@/lib/command-bar/amount'
import { extractDate } from '@/lib/command-bar/date'
import { extractExpenseCategory } from '@/lib/command-bar/entities'
import type { ExpenseActionData, ParsedFinancialAction } from '@/lib/command-bar/entity-model'
import type { ParserContext } from '@/lib/command-bar/types'

export function withdrawClauseAmount(text: string, currency: ParserContext['currency']): number | undefined {
  const match = text.match(
    /\b(?:withdraw|withdrew|redeemed|redeem|took out)\w*\s+([\d,.]+(?:\s*(?:k|l|lac|lakh|lacs|lakhs))?)/i,
  )
  return match ? extractAmount(match[0], currency) : undefined
}

export function parseExpenseEntities(text: string, context: ParserContext): ParsedFinancialAction[] {
  const n = text.toLowerCase()

  if (/\b(transfer|transferred)\b/.test(n) && !/\bspent|paid|bought\b/.test(n)) {
    return []
  }

  if (/\bneed\s+[\d₹\w.,]+\s+for\b/.test(n) && !/\b(spent|paid|bought)\b/.test(n)) {
    return []
  }

  if (/\b(withdraw|withdrew|redeemed|redeem)\b/.test(n) && /\b(spent|used it to pay|used it on)\b/.test(n)) {
    const amount = withdrawClauseAmount(text, context.currency)
    if (!amount) return []

    const data: ExpenseActionData = {
      amount,
      category: extractExpenseCategory(text),
      date: extractDate(text, context.today),
    }
    return [{ entity: 'EXPENSE', action: 'CREATE', data, confidence: 0.88 }]
  }

  if (/\b(withdraw|withdrew|redeemed|redeem)\b/.test(n) && !/\bspent|used it to pay\b/.test(n)) {
    return []
  }

  if (/\b(loan|emi|mortgage)\b/.test(n) && /\b(paid|payment|pay|goes|going)\b/.test(n)) {
    return []
  }

  const hasExpenseVerb = /\b(spent|spend|paid|bought|purchase|charged|debited|pay)\b/.test(n)
  if (!hasExpenseVerb) return []

  const amount =
    extractAmount(text, context.currency) ?? withdrawClauseAmount(text, context.currency)
  if (!amount) return []

  const frequency = /\b(every month|per month|monthly|each month|a month)\b/i.test(text)
    ? ('monthly' as const)
    : /\b(every year|per year|yearly|annually)\b/i.test(text)
      ? ('yearly' as const)
      : undefined

  const category = extractExpenseCategory(text)

  const data: ExpenseActionData = {
    amount,
    category,
    frequency,
    date: extractDate(text, context.today),
  }

  return [{ entity: 'EXPENSE', action: 'CREATE', data, confidence: 0.88 }]
}
