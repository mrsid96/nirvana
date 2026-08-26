import type { CommandIntent } from '@/lib/command-bar/types'

interface IntentSignal {
  intent: CommandIntent
  weight: number
  requiresRecurring?: boolean
  requiresPast?: boolean
}

const NAVIGATION_PATTERNS: Array<{ pattern: RegExp; intent: CommandIntent; path: string }> = [
  { pattern: /\b(open|show|go to|take me to|navigate to)\s+(?:my\s+)?(?:home|dashboard)\b/i, intent: 'OPEN_DASHBOARD', path: '/' },
  { pattern: /\b(open|show|go to|take me to)\s+(?:my\s+)?wealth\b/i, intent: 'OPEN_WEALTH', path: '/wealth' },
  { pattern: /\b(open|show|go to|take me to)\s+(?:my\s+)?loans?\b/i, intent: 'OPEN_LOANS', path: '/loans' },
  { pattern: /\b(open|show|go to|take me to)\s+(?:my\s+)?profile\b/i, intent: 'OPEN_PROFILE', path: '/profile' },
  { pattern: /\b(open|show|go to)\s+statements?\b/i, intent: 'OPEN_DASHBOARD', path: '/statements' },
]

const QUERY_PATTERNS: Array<{ pattern: RegExp; intent: CommandIntent }> = [
  { pattern: /\b(how much|what).*\b(spend|spent|spending)\b/i, intent: 'QUERY_MONTHLY_SPENDING' },
  { pattern: /\b(total|what).*\bexpenses?\b/i, intent: 'QUERY_MONTHLY_SPENDING' },
  { pattern: /\bhow much\b.*\binvest/i, intent: 'QUERY_MONTHLY_INVESTMENT' },
  { pattern: /\b(total|what).*\binvestments?\b/i, intent: 'QUERY_MONTHLY_INVESTMENT' },
  { pattern: /\bhow much\b.*\bleft\b.*\bloan/i, intent: 'QUERY_LOAN_OUTSTANDING' },
  { pattern: /\boutstanding\b.*\bloan/i, intent: 'QUERY_LOAN_OUTSTANDING' },
  { pattern: /\bhow\b.*\b(retirement|goal)\b.*\b(doing|progress|track)/i, intent: 'QUERY_GOAL_PROGRESS' },
  { pattern: /\b(am i|are we)\b.*\bon track/i, intent: 'QUERY_GOAL_PROGRESS' },
  { pattern: /\b(show|what is)\b.*\b(retirement|goal)\b.*\bprogress/i, intent: 'QUERY_GOAL_PROGRESS' },
  { pattern: /\bshow\b.*\b(retirement|goal)\b.*\bprogress/i, intent: 'QUERY_GOAL_PROGRESS' },
  { pattern: /\bwhat\b.*\bnet worth/i, intent: 'QUERY_NET_WORTH' },
  { pattern: /\bhow\b.*\bcash flow/i, intent: 'QUERY_CASH_FLOW' },
  { pattern: /\bfree cash\b/i, intent: 'QUERY_CASH_FLOW' },
  { pattern: /\bhow much\b.*\b(saving|saved)\b/i, intent: 'QUERY_CASH_FLOW' },
]

export function detectNavigation(text: string): { intent: CommandIntent; path: string } | undefined {
  const normalized = text.toLowerCase()
  if (/\bprogress\b/.test(normalized) || /\bhow much\b/.test(normalized)) return undefined

  for (const { pattern, intent, path } of NAVIGATION_PATTERNS) {
    if (pattern.test(text)) return { intent, path }
  }
  const assetNav = text.match(/\b(show|open)\s+(?:my\s+)?(.+?(?:fund|etf|asset))/i)
  if (assetNav) return { intent: 'OPEN_ASSET', path: '' }
  const loanNav = text.match(/\b(show|open)\s+(?:my\s+)?(.+?\s*loan)/i)
  if (loanNav) return { intent: 'OPEN_LOAN', path: '' }
  const goalNav = text.match(/\b(show|open|take me to)\s+(?:my\s+)?(.+)/i)
  if (goalNav) {
    const target = goalNav[2]?.toLowerCase() ?? ''
    if (!target.includes('loan') && !target.includes('wealth') && !target.includes('home')) {
      return { intent: 'OPEN_GOAL', path: '' }
    }
  }
  return undefined
}

export function detectQuery(text: string): CommandIntent | undefined {
  for (const { pattern, intent } of QUERY_PATTERNS) {
    if (pattern.test(text)) return intent
  }
  return undefined
}

export function scoreFinancialIntents(
  text: string,
  isRecurring: boolean,
  isPast: boolean,
): IntentSignal[] {
  const normalized = text.toLowerCase()
  const signals: IntentSignal[] = []

  if (/\bskip\b/.test(normalized) && /\b(scheduled|recurring|sip|emi)\b/.test(normalized)) {
    signals.push({ intent: 'SKIP_SCHEDULED_TRANSACTION', weight: 0.95 })
  }

  if (/\b(withdraw|withdrew|withdrawn|pulled out|redeemed)\b/.test(normalized)) {
    signals.push({ intent: 'RECORD_WITHDRAWAL', weight: 0.9, requiresPast: true })
  }

  if (
    /\b(invest|invested|sip|topped up|top up|allocated|bought shares|added to|put\b.*\binto)\b/.test(
      normalized,
    )
  ) {
    if (isRecurring && !isPast) {
      signals.push({ intent: 'CREATE_RECURRING_INVESTMENT', weight: 0.92, requiresRecurring: true })
    } else {
      signals.push({ intent: 'RECORD_INVESTMENT', weight: isPast ? 0.95 : 0.75, requiresPast: isPast })
    }
  }

  if (
    /\b(spent|spend|bought|purchase|purchased|paid for|charged|debited|ordered|subscription)\b/.test(
      normalized,
    )
  ) {
    if (!isRecurring) {
      signals.push({ intent: 'ADD_EXPENSE', weight: 0.9 })
    }
  }

  if (
    /\b(salary|received|got|came in|income|earned|credited|deposited|paycheck|pay day)\b/.test(
      normalized,
    ) &&
    !/\b(spent|paid|invest|charged|debited)\b/.test(normalized)
  ) {
    signals.push({ intent: 'ADD_INCOME', weight: 0.88 })
  }

  if (/\b(paid|payment)\b/.test(normalized) && /\b(loan|emi|mortgage)\b/.test(normalized)) {
    if (isRecurring && !isPast) {
      signals.push({ intent: 'CREATE_RECURRING_EXPENSE', weight: 0.7, requiresRecurring: true })
    } else {
      signals.push({ intent: 'RECORD_LOAN_PAYMENT', weight: 0.92 })
    }
  }

  if (/\bemi\b/.test(normalized) && /\b(paid|payment)\b/.test(normalized)) {
    signals.push({ intent: 'RECORD_LOAN_PAYMENT', weight: 0.9 })
  }

  if (/\b(paid|payment)\b/.test(normalized) && !/\b(loan|emi|mortgage|rent|bill)\b/.test(normalized)) {
    signals.push({ intent: 'ADD_EXPENSE', weight: 0.65 })
  }

  if (/\b(create|new|add|set up|setup)\b.*\bgoal\b/.test(normalized)) {
    signals.push({ intent: 'CREATE_GOAL', weight: 0.85 })
  }

  if (/\b(create|new|add)\b.*\b(asset|fund)\b/.test(normalized)) {
    signals.push({ intent: 'CREATE_ASSET', weight: 0.85 })
  }

  if (/\b(create|new|add)\b.*\bloan\b/.test(normalized)) {
    signals.push({ intent: 'CREATE_LOAN', weight: 0.85 })
  }

  return signals.sort((a, b) => b.weight - a.weight)
}

export function hasAmbiguousInvestIntent(text: string): boolean {
  const normalized = text.toLowerCase()
  const hasInvest = /\b(invest|invested|sip|topped up|added to)\b/.test(normalized)
  const hasRecurring = /\b(every month|monthly|each month|every\s+\d)/.test(normalized)
  const hasPast = /\b(today|yesterday|invested|put)\b/.test(normalized)
  return hasInvest && hasRecurring && hasPast
}

export function hasAmbiguousLoanIntent(text: string): boolean {
  const normalized = text.toLowerCase()
  const hasPaid = /\b(paid|payment)\b/.test(normalized)
  const hasRecurring = /\b(every month|monthly|each month|emi is)\b/.test(normalized)
  const hasPast = /\b(today|yesterday|paid)\b/.test(normalized)
  return hasPaid && hasRecurring && hasPast && /\b(loan|emi)\b/.test(normalized)
}
