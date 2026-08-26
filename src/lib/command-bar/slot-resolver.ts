import { extractAmount } from '@/lib/command-bar/amount'
import { extractMonthlyAmount } from '@/lib/command-bar/bundled-intents'
import { isPastActionPhrase, isRecurringPhrase } from '@/lib/command-bar/date'
import { extractExpenseCategory, extractGoalHint, extractIncomeCategory } from '@/lib/command-bar/entities'
import type { CommandIntent, ParserContext, StructuredIntent } from '@/lib/command-bar/types'

export interface CommandSlots {
  hasLoanKeyword: boolean
  hasLoanAcquisition: boolean
  hasGoalKeyword: boolean
  hasInvestVerb: boolean
  hasPayVerb: boolean
  hasExpenseVerb: boolean
  hasIncomeVerb: boolean
  hasWithdrawVerb: boolean
  hasFutureObligation: boolean
  hasPastPayment: boolean
  isRecurring: boolean
  monthlyAmount?: number
  principalAmount?: number
  tenureMonths?: number
  goalName?: string
  loanPurpose?: string
}

export function extractTenureMonths(text: string): number | undefined {
  const match = text.match(/\b(?:for\s+)?(?:around|about|roughly)?\s*(\d{1,3})\s*months?\b/i)
  if (!match?.[1]) return undefined
  const months = Number(match[1])
  return months >= 1 && months <= 600 ? months : undefined
}

export function extractLoanPurpose(text: string): string | undefined {
  const purposeMatch = text.match(
    /\bloan\s+for\s+([a-z][\w\s]{2,40}?)(?:\s+for\s+(?:around|about|roughly|\d)|\s*,|\s+for which|\s+which\b)/i,
  )
  if (purposeMatch?.[1]) {
    return capitalizeWords(purposeMatch[1].trim())
  }

  const genericMatch = text.match(
    /\b(?:take|took|get|got|borrow|borrowed|availed)\b[^.]{0,40}?\bloan\b[^.]{0,20}?\bfor\s+([a-z][\w\s]{2,40}?)(?:\s+for\b|\s*,|\s+for which)/i,
  )
  if (genericMatch?.[1]) {
    return capitalizeWords(genericMatch[1].trim())
  }

  return undefined
}

function capitalizeWords(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function extractSlots(text: string, context: ParserContext): CommandSlots {
  const normalized = text.toLowerCase()
  const monthlyAmount = extractMonthlyAmount(text, context.currency)
  const tenureMonths = extractTenureMonths(text)
  const loanPurpose = extractLoanPurpose(text)
  const principalClause = loanPurpose
    ? text.split(new RegExp(loanPurpose, 'i'))[0] ?? text
    : text.split(/\bfor which\b/i)[0] ?? text
  const principalAmount = extractAmount(principalClause, context.currency)

  const hasLoanKeyword = /\bloan\b|\bemi\b|\bmortgage\b/.test(normalized)
  const hasLoanAcquisition =
    /\b(take|took|taken|get|got|borrow|borrowed|availed|applied for)\b[^.]{0,50}?\bloan\b/.test(
      normalized,
    ) || /\bloan\b[^.]{0,30}?\bfor\b/.test(normalized)
  const hasFutureObligation = /\b(have to|has to|need to|will|going to|must)\b/.test(normalized)
  const hasPastPayment =
    /\b(paid|payment)\b/.test(normalized) &&
    isPastActionPhrase(text) &&
    !hasFutureObligation

  return {
    hasLoanKeyword,
    hasLoanAcquisition,
    hasGoalKeyword: /\bgoal\b/.test(normalized) || Boolean(extractGoalHint(text, context.goals)),
    hasInvestVerb: /\b(invest|invested|sip|save|saving|put aside|set aside|allocate)\b/.test(normalized),
    hasPayVerb: /\b(pay|repay|repayment|emi)\b/.test(normalized),
    hasExpenseVerb: /\b(spent|spend|bought|purchase|charged|debited)\b/.test(normalized),
    hasIncomeVerb:
      /\b(salary|received|got|came in|income|earned|credited|paycheck)\b/.test(normalized) &&
      !/\b(spent|paid|invest|charged)\b/.test(normalized),
    hasWithdrawVerb: /\b(withdraw|withdrew|withdrawn|redeemed|pulled out)\b/.test(normalized),
    hasFutureObligation,
    hasPastPayment,
    isRecurring: isRecurringPhrase(text) || /\bper month\b/.test(normalized),
    monthlyAmount,
    principalAmount:
      principalAmount && monthlyAmount && principalAmount === monthlyAmount
        ? undefined
        : principalAmount,
    tenureMonths,
    goalName: extractGoalHint(text, context.goals),
    loanPurpose,
  }
}

export function detectNarrativeLoan(text: string, context: ParserContext): StructuredIntent | null {
  const slots = extractSlots(text, context)
  if (!slots.hasLoanKeyword || !slots.hasLoanAcquisition) return null
  if (slots.hasPastPayment && !slots.hasFutureObligation) return null

  const hasEmiPlan =
    slots.isRecurring &&
    (slots.monthlyAmount != null || slots.hasPayVerb || slots.hasFutureObligation)
  if (!hasEmiPlan) return null

  const emiAmount = slots.monthlyAmount
  const tenureMonths = slots.tenureMonths
  let originalAmount = slots.principalAmount
  if (!originalAmount && emiAmount && tenureMonths) {
    originalAmount = emiAmount * tenureMonths
  }

  const loanName = slots.loanPurpose ?? slots.goalName ?? 'New loan'

  return {
    intent: 'CREATE_LOAN',
    confidence: 0.92,
    parserMethod: 'narrative-loan',
    currency: context.currency,
    loanName,
    purpose: slots.loanPurpose,
    emiAmount,
    originalAmount,
    outstandingAmount: originalAmount,
    tenureMonths,
    amount: originalAmount ?? emiAmount,
    dayOfMonth: 5,
  }
}

export function resolveFromSlots(text: string, context: ParserContext): StructuredIntent | null {
  const narrativeLoan = detectNarrativeLoan(text, context)
  if (narrativeLoan) return narrativeLoan

  const slots = extractSlots(text, context)
  const normalized = text.toLowerCase()

  if (slots.hasWithdrawVerb) {
    return {
      intent: 'RECORD_WITHDRAWAL',
      confidence: 0.85,
      parserMethod: 'slots',
      amount: slots.principalAmount ?? slots.monthlyAmount,
      currency: context.currency,
      goalName: slots.goalName,
    }
  }

  if (slots.hasIncomeVerb && slots.principalAmount) {
    return {
      intent: 'ADD_INCOME',
      confidence: 0.85,
      parserMethod: 'slots',
      amount: slots.principalAmount,
      currency: context.currency,
      category: extractIncomeCategory(text),
    }
  }

  if (slots.hasExpenseVerb && slots.principalAmount) {
    return {
      intent: 'ADD_EXPENSE',
      confidence: 0.85,
      parserMethod: 'slots',
      amount: slots.principalAmount,
      currency: context.currency,
      category: extractExpenseCategory(text),
    }
  }

  if (
    slots.hasPastPayment &&
    slots.hasLoanKeyword &&
    (slots.principalAmount || slots.monthlyAmount)
  ) {
    return {
      intent: 'RECORD_LOAN_PAYMENT',
      confidence: 0.88,
      parserMethod: 'slots',
      amount: slots.principalAmount ?? slots.monthlyAmount,
      currency: context.currency,
      loanName: slots.loanPurpose,
    }
  }

  if (slots.hasInvestVerb && slots.isRecurring && slots.monthlyAmount && !slots.hasLoanKeyword) {
    return {
      intent: 'CREATE_RECURRING_INVESTMENT',
      confidence: 0.85,
      parserMethod: 'slots',
      monthlyInvestment: slots.monthlyAmount,
      amount: slots.monthlyAmount,
      currency: context.currency,
      goalName: slots.goalName,
      frequency: 'MONTHLY',
    }
  }

  if (slots.hasInvestVerb && (slots.principalAmount || slots.monthlyAmount) && !slots.hasLoanKeyword) {
    return {
      intent: 'RECORD_INVESTMENT',
      confidence: 0.85,
      parserMethod: 'slots',
      amount: slots.principalAmount ?? slots.monthlyAmount,
      currency: context.currency,
      goalName: slots.goalName,
    }
  }

  if (/\b(create|add|new)\b.*\bloan\b/.test(normalized) && (slots.principalAmount || slots.monthlyAmount)) {
    return {
      intent: 'CREATE_LOAN',
      confidence: 0.82,
      parserMethod: 'slots',
      loanName: slots.loanPurpose ?? 'New loan',
      emiAmount: slots.monthlyAmount,
      originalAmount: slots.principalAmount ?? slots.monthlyAmount,
      outstandingAmount: slots.principalAmount ?? slots.monthlyAmount,
      amount: slots.principalAmount ?? slots.monthlyAmount,
      tenureMonths: slots.tenureMonths,
      currency: context.currency,
    }
  }

  return null
}

export function structuredFromGuideIntent(
  intent: CommandIntent,
  text: string,
  context: ParserContext,
): StructuredIntent {
  const slots = extractSlots(text, context)
  const base: StructuredIntent = { intent, confidence: 0.7, parserMethod: 'guide' }

  switch (intent) {
    case 'CREATE_LOAN': {
      const narrative = detectNarrativeLoan(text, context)
      return {
        ...base,
        intent: 'CREATE_LOAN',
        currency: context.currency,
        loanName: narrative?.loanName ?? slots.loanPurpose ?? 'New loan',
        purpose: narrative?.purpose ?? slots.loanPurpose,
        emiAmount: narrative?.emiAmount ?? slots.monthlyAmount,
        originalAmount:
          narrative?.originalAmount ??
          slots.principalAmount ??
          (slots.monthlyAmount && slots.tenureMonths
            ? slots.monthlyAmount * slots.tenureMonths
            : undefined),
        outstandingAmount:
          narrative?.outstandingAmount ??
          slots.principalAmount ??
          (slots.monthlyAmount && slots.tenureMonths
            ? slots.monthlyAmount * slots.tenureMonths
            : undefined),
        tenureMonths: narrative?.tenureMonths ?? slots.tenureMonths,
        amount:
          narrative?.amount ??
          slots.principalAmount ??
          (slots.monthlyAmount && slots.tenureMonths
            ? slots.monthlyAmount * slots.tenureMonths
            : undefined) ??
          slots.monthlyAmount,
        dayOfMonth: narrative?.dayOfMonth ?? 5,
      }
    }
    case 'CREATE_GOAL':
      return { ...base, goalName: slots.goalName ?? slots.loanPurpose ?? 'New goal', amount: slots.principalAmount }
    case 'CREATE_GOAL_WITH_ASSET':
      return {
        ...base,
        goalName: slots.goalName ?? 'New goal',
        amount: slots.principalAmount,
        monthlyInvestment: slots.monthlyAmount,
        assetName: 'Mutual Fund',
        assetCategory: 'MF',
        investmentType: 'SIP',
      }
    case 'ADD_EXPENSE':
      return { ...base, amount: slots.principalAmount ?? slots.monthlyAmount, category: extractExpenseCategory(text) }
    case 'ADD_INCOME':
      return { ...base, amount: slots.principalAmount ?? slots.monthlyAmount, category: extractIncomeCategory(text) }
    case 'RECORD_INVESTMENT':
      return { ...base, amount: slots.principalAmount ?? slots.monthlyAmount, goalName: slots.goalName }
    case 'RECORD_WITHDRAWAL':
      return { ...base, amount: slots.principalAmount ?? slots.monthlyAmount, goalName: slots.goalName }
    case 'RECORD_LOAN_PAYMENT':
      return { ...base, amount: slots.principalAmount ?? slots.monthlyAmount, loanName: slots.loanPurpose }
    case 'CREATE_RECURRING_INVESTMENT':
      return {
        ...base,
        amount: slots.monthlyAmount,
        monthlyInvestment: slots.monthlyAmount,
        goalName: slots.goalName,
        frequency: 'MONTHLY',
      }
    default:
      return base
  }
}

export function summarizeSlots(slots: CommandSlots): string[] {
  const hints: string[] = []
  if (slots.loanPurpose) hints.push(`loan for ${slots.loanPurpose}`)
  if (slots.monthlyAmount) hints.push('a monthly amount')
  if (slots.tenureMonths) hints.push(`${slots.tenureMonths} months`)
  if (slots.goalName) hints.push(`goal: ${slots.goalName}`)
  if (slots.principalAmount) hints.push('an amount')
  return hints
}
