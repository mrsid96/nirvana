import { todayIsoDate, addMonthsIso } from '@/lib/formatters/dates'
import { extractAmount } from '@/lib/command-bar/amount'
import {
  extractAssetHint,
  extractExpenseCategory,
  extractGoalHint,
  extractIncomeCategory,
  extractLoanHint,
  extractSource,
} from '@/lib/command-bar/entities'
import {
  extractDate,
  extractDayOfMonth,
  isPastActionPhrase,
  isRecurringPhrase,
} from '@/lib/command-bar/date'
import {
  detectNavigation,
  detectQuery,
  hasAmbiguousInvestIntent,
  hasAmbiguousLoanIntent,
  scoreFinancialIntents,
} from '@/lib/command-bar/intents'
import {
  matchAssets,
  matchGoals,
  matchLoans,
  toAssetOptions,
  toGoalOptions,
  toLoanOptions,
  findEntityMentions,
  boostIntentsFromMentions,
} from '@/lib/command-bar/matcher'
import { isNavigationIntent, isQueryIntent, INTENT_LABELS } from '@/lib/command-bar/labels'
import { splitCompoundInput, summarizeClause } from '@/lib/command-bar/compound'
import type {
  CommandIntent,
  ParseResult,
  ParserContext,
  StructuredIntent,
} from '@/lib/command-bar/types'

const DEV = import.meta.env.DEV

export async function parseCommandAsync(input: string, context: ParserContext): Promise<ParseResult> {
  const clauses = splitCompoundInput(input)
  if (clauses.length > 1) {
    const clauseResults = clauses.map((clause) => parseCommand(clause, context))
    const valid = clauseResults.filter((result) => result.phase !== 'unknown')
    if (valid.length >= 2) {
      return buildCompoundClarification(input, clauses, clauseResults)
    }
  }

  const deterministic = parseCommand(input, context)

  if (deterministic.phase !== 'unknown' && deterministic.structured.confidence >= 0.5) {
    return deterministic
  }

  if (clauses.length > 1) {
    const clauseResults = clauses.map((clause) => parseCommand(clause, context))
    const valid = clauseResults.filter((result) => result.phase !== 'unknown')
    if (valid.length === 1) {
      return valid[0]!
    }
  }

  return deterministic
}

function buildCompoundClarification(
  input: string,
  clauses: string[],
  results: ParseResult[],
): ParseResult {
  const start = performance.now()
  return buildResult(
    input,
    { intent: 'UNKNOWN', confidence: 0.4, parserMethod: 'compound' },
    'needs_clarification',
    start,
    {
      kind: 'compound_action',
      question: 'I found multiple actions. Which one should I do first?',
      options: clauses.map((clause, index) => {
        const result = results[index]
        const intentLabel =
          result && result.phase !== 'unknown'
            ? INTENT_LABELS[result.structured.intent]
            : 'Action'
        return {
          id: clause,
          label: `${intentLabel} — ${summarizeClause(clause)}`,
          type: 'compound' as const,
        }
      }),
    },
  )
}

export function parseCommand(input: string, context: ParserContext): ParseResult {
  const start = performance.now()
  const text = input.trim()
  const today = context.today ?? todayIsoDate()

  if (!text) {
    return buildResult(text, { intent: 'UNKNOWN', confidence: 0 }, 'unknown', start)
  }

  // Queries — no confirmation needed (before navigation; "show progress" is a query)
  const queryIntent = detectQuery(text)
  if (queryIntent) {
    const structured: StructuredIntent = {
      intent: queryIntent,
      confidence: 0.9,
      parserMethod: 'query',
    }
    const goalHint = extractGoalHint(text, context.goals)
    if (goalHint) {
      const gm = matchGoals(goalHint, context)
      if (gm.match) {
        structured.goalId = gm.match.id
        structured.goalName = gm.match.name
      }
    }
    const loanHint = extractLoanHint(text)
    if (loanHint) {
      const lm = matchLoans(loanHint, context)
      if (lm.match) {
        structured.loanId = lm.match.id
        structured.loanName = lm.match.name
      }
    }
    return buildResult(text, structured, 'ready', start)
  }

  // Navigation — no confirmation needed
  const nav = detectNavigation(text)
  if (nav) {
    const structured: StructuredIntent = {
      intent: nav.intent,
      confidence: 0.95,
      navigationPath: nav.path,
      parserMethod: 'navigation',
    }
    if (nav.intent === 'OPEN_GOAL') {
      const goalHint = extractGoalHint(text, context.goals) ?? text
      const goalMatch = matchGoals(goalHint, context)
      if (goalMatch.match) {
        structured.goalId = goalMatch.match.id
        structured.goalName = goalMatch.match.name
        structured.navigationPath = `/wealth/${goalMatch.match.id}`
      }
    }
    if (nav.intent === 'OPEN_LOAN') {
      const loanHint = extractLoanHint(text)
      const loanMatch = matchLoans(loanHint, context)
      if (loanMatch.match) {
        structured.loanId = loanMatch.match.id
        structured.loanName = loanMatch.match.name
        structured.navigationPath = `/loans/${loanMatch.match.id}`
      }
    }
    if (nav.intent === 'OPEN_ASSET') {
      const hint = extractAssetHint(text) ?? text
      const assetMatch = matchAssets(hint, undefined, context)
      if (assetMatch.match) {
        structured.assetId = assetMatch.match.id
        structured.assetName = assetMatch.match.name
        structured.goalId = assetMatch.match.goalId
        const goal = context.goals.find((g) => g.id === assetMatch.match!.goalId)
        if (goal) structured.goalName = goal.name
        structured.navigationPath = `/wealth/${assetMatch.match.goalId}`
      }
    }
    return buildResult(text, structured, 'ready', start)
  }

  const isRecurring = isRecurringPhrase(text)
  const isPast = isPastActionPhrase(text)

  // Ambiguous invest intent
  if (hasAmbiguousInvestIntent(text)) {
    return buildResult(
      text,
      { intent: 'RECORD_INVESTMENT', confidence: 0.5, parserMethod: 'ambiguous' },
      'needs_clarification',
      start,
      {
        kind: 'ambiguous_intent',
        question: 'Do you want to record an investment you made today, or set up a monthly investment?',
        options: [
          { id: 'record', label: "Record today's investment", type: 'action' },
          { id: 'recurring', label: 'Set up monthly investment', type: 'action' },
        ],
      },
    )
  }

  // Ambiguous loan intent
  if (hasAmbiguousLoanIntent(text)) {
    return buildResult(
      text,
      { intent: 'RECORD_LOAN_PAYMENT', confidence: 0.5, parserMethod: 'ambiguous' },
      'needs_clarification',
      start,
      {
        kind: 'ambiguous_intent',
        question: 'Do you want to record a payment you made today, or set up a monthly payment?',
        options: [
          { id: 'record', label: "Record today's payment", type: 'action' },
          { id: 'recurring', label: 'Set up monthly payment', type: 'action' },
        ],
      },
    )
  }

  const signals = boostIntentsFromMentions(
    scoreFinancialIntents(text, isRecurring, isPast),
    findEntityMentions(text, context),
    text,
  )
  let topSignal = signals[0]

  // Context-aware loan payment: on loan detail page, "Paid 45k today" → loan payment
  if (
    context.currentLoanId &&
    /\b(paid|payment)\b/i.test(text) &&
    extractAmount(text, context.currency) &&
    (!topSignal || topSignal.intent === 'ADD_EXPENSE')
  ) {
    topSignal = { intent: 'RECORD_LOAN_PAYMENT', weight: 0.88 }
  }

  const intent: CommandIntent = topSignal?.intent ?? 'UNKNOWN'
  const confidence = topSignal?.weight ?? 0.3

  if (intent === 'UNKNOWN' || confidence < 0.5) {
    return buildResult(text, { intent: 'UNKNOWN', confidence: 0.2, parserMethod: 'unknown' }, 'unknown', start)
  }

  const amount = extractAmount(text, context.currency)
  const date = extractDate(text, today) ?? (isPast ? today : undefined)
  const dayOfMonth = extractDayOfMonth(text)
  const goalHint = extractGoalHint(text, context.goals)
  const loanHint = extractLoanHint(text)
  const assetHint = extractAssetHint(text)
  const category = extractExpenseCategory(text)
  const incomeCategory = extractIncomeCategory(text)
  const source = extractSource(text)

  const structured: StructuredIntent = {
    intent,
    confidence,
    amount,
    currency: context.currency,
    date,
    category,
    source,
    frequency: isRecurring ? 'MONTHLY' : undefined,
    dayOfMonth,
    parserMethod: 'deterministic',
  }

  if (incomeCategory) structured.category = incomeCategory

  return enrichStructuredIntent(text, structured, context, start)
}

function enrichStructuredIntent(
  text: string,
  structured: StructuredIntent,
  context: ParserContext,
  start: number,
): ParseResult {
  const today = context.today ?? todayIsoDate()
  const intent = structured.intent
  const amount = structured.amount
  const goalHint = structured.goalName ?? extractGoalHint(text, context.goals)
  const loanHint = structured.loanName ?? extractLoanHint(text)
  const assetHint = structured.assetName ?? extractAssetHint(text)

  if (!structured.date) {
    structured.date = extractDate(text, today)
  } else if (structured.date === 'today') {
    structured.date = today
  }

  // Create & skip intents — specialized handling
  if (intent === 'CREATE_GOAL') {
    structured.goalName =
      structured.goalName ?? extractGoalHint(text, context.goals) ?? structured.description ?? 'New goal'
    structured.targetDate = addMonthsIso(today, 240)
    if (!amount) {
      return buildResult(text, structured, 'needs_clarification', start, {
        kind: 'missing_amount',
        question: 'What target amount for this goal?',
        options: [],
      })
    }
    return buildResult(text, structured, 'needs_confirmation', start)
  }

  if (intent === 'CREATE_ASSET') {
    structured.assetName =
      structured.assetName ?? extractAssetHint(text) ?? structured.description ?? 'New asset'
    if (!structured.goalId) {
      const goalMatch = matchGoals(extractGoalHint(text, context.goals), context)
      if (goalMatch.match) {
        structured.goalId = goalMatch.match.id
        structured.goalName = goalMatch.match.name
      } else if (goalMatch.ambiguous) {
        return buildResult(text, structured, 'needs_clarification', start, {
          kind: 'ambiguous_goal',
          question: 'Which goal should this asset belong to?',
          options: toGoalOptions(goalMatch.matches),
        })
      } else if (!goalMatch.match) {
        return buildResult(text, structured, 'needs_clarification', start, {
          kind: 'missing_goal',
          question: 'Which goal should this asset belong to?',
          options: toGoalOptions(context.goals),
        })
      }
    }
    if (!amount) {
      return buildResult(text, structured, 'needs_clarification', start, {
        kind: 'missing_amount',
        question: 'What is the initial value of this asset?',
        options: [],
      })
    }
    return buildResult(text, structured, 'needs_confirmation', start)
  }

  if (intent === 'CREATE_LOAN') {
    structured.loanName =
      structured.loanName ?? extractLoanHint(text) ?? structured.description ?? 'New loan'
    if (amount) {
      structured.originalAmount = amount
      structured.outstandingAmount = amount
      structured.emiAmount = amount
    }
    if (!amount) {
      return buildResult(text, structured, 'needs_clarification', start, {
        kind: 'missing_amount',
        question: 'What is the loan amount or EMI?',
        options: [],
      })
    }
    return buildResult(text, structured, 'needs_confirmation', start)
  }

  if (intent === 'SKIP_SCHEDULED_TRANSACTION') {
    const skipMatch = matchSkipOccurrence(text, context)
    if (skipMatch.match) {
      structured.scheduledOccurrenceId = skipMatch.match.id
      structured.scheduledOccurrenceName = skipMatch.match.name
      return buildResult(text, structured, 'needs_confirmation', start)
    }
    if (skipMatch.ambiguous || skipMatch.matches.length > 1) {
      return buildResult(text, structured, 'needs_clarification', start, {
        kind: 'ambiguous_intent',
        question: 'Which scheduled transaction should I skip?',
        options: skipMatch.matches.map((o) => ({
          id: o.id,
          label: o.name,
          type: 'occurrence' as const,
        })),
      })
    }
    return buildResult(text, structured, 'needs_clarification', start, {
      kind: 'ambiguous_intent',
      question: 'No due scheduled transactions found to skip.',
      options: [],
    })
  }

  // Entity matching based on intent
  const needsGoal = [
    'RECORD_INVESTMENT',
    'CREATE_RECURRING_INVESTMENT',
    'RECORD_WITHDRAWAL',
    'CREATE_ASSET',
    'QUERY_GOAL_PROGRESS',
  ].includes(intent)

  const needsAsset = ['RECORD_INVESTMENT', 'CREATE_RECURRING_INVESTMENT', 'RECORD_WITHDRAWAL'].includes(
    intent,
  )

  const needsLoan = ['RECORD_LOAN_PAYMENT', 'QUERY_LOAN_OUTSTANDING'].includes(intent)

  // Asset-first: match by asset name and infer goal
  if (needsAsset && assetHint) {
    const assetMatch = matchAssets(assetHint, structured.goalId, context)
    if (assetMatch.match) {
      structured.assetId = assetMatch.match.id
      structured.assetName = assetMatch.match.name
      if (!structured.goalId) {
        structured.goalId = assetMatch.match.goalId
        const goal = context.goals.find((g) => g.id === assetMatch.match!.goalId)
        if (goal) structured.goalName = goal.name
      }
    }
  }

  if (needsGoal) {
    const goalMatch = matchGoals(goalHint, context)
    if (goalMatch.match) {
      structured.goalId = goalMatch.match.id
      structured.goalName = goalMatch.match.name
    } else if (goalMatch.ambiguous) {
      return buildResult(text, structured, 'needs_clarification', start, {
        kind: 'ambiguous_goal',
        question: 'Which goal should this go toward?',
        options: toGoalOptions(goalMatch.matches),
      })
    } else if (!goalMatch.match && goalMatch.matches.length === 0 && needsGoal) {
      if (!amount) {
        return buildResult(text, structured, 'needs_clarification', start, {
          kind: 'missing_amount',
          question: 'What amount?',
          options: [],
        })
      }
      return buildResult(text, structured, 'needs_clarification', start, {
        kind: 'missing_goal',
        question: amount
          ? `Got it — ${formatAmountHint(amount, context.currency)}. Which goal should this go toward?`
          : 'Which goal should this go toward?',
        options: toGoalOptions(context.goals),
      })
    }
  }

  if (needsAsset && structured.goalId && !structured.assetId) {
    const assetMatch = matchAssets(assetHint, structured.goalId, context)
    if (assetMatch.match) {
      structured.assetId = assetMatch.match.id
      structured.assetName = assetMatch.match.name
    } else if (assetMatch.ambiguous) {
      return buildResult(text, structured, 'needs_clarification', start, {
        kind: 'ambiguous_asset',
        question: 'Which asset should I use?',
        options: toAssetOptions(assetMatch.matches),
      })
    } else if (assetMatch.matches.length > 1 && !assetMatch.match) {
      return buildResult(text, structured, 'needs_clarification', start, {
        kind: 'missing_asset',
        question: 'Which asset should I use?',
        options: toAssetOptions(assetMatch.matches),
      })
    }
  }

  if (needsLoan) {
    const loanMatch = matchLoans(loanHint, context)
    if (loanMatch.match) {
      structured.loanId = loanMatch.match.id
      structured.loanName = loanMatch.match.name
    } else if (loanMatch.ambiguous) {
      return buildResult(text, structured, 'needs_clarification', start, {
        kind: 'ambiguous_loan',
        question: 'Which loan is this for?',
        options: toLoanOptions(loanMatch.matches),
      })
    } else if (!loanMatch.match) {
      return buildResult(text, structured, 'needs_clarification', start, {
        kind: 'missing_loan',
        question: amount
          ? `Got it — ${formatAmountHint(amount, context.currency)}. Which loan is this for?`
          : 'Which loan is this for?',
        options: toLoanOptions(context.loans),
      })
    }
  }

  if (!amount && isFinancialWriteIntent(intent)) {
    return buildResult(text, structured, 'needs_clarification', start, {
      kind: 'missing_amount',
      question: 'What amount?',
      options: [],
    })
  }

  return buildResult(text, structured, 'needs_confirmation', start)
}

function isFinancialWriteIntent(intent: CommandIntent): boolean {
  return !isNavigationIntent(intent) && !isQueryIntent(intent) && intent !== 'UNKNOWN'
}

function formatAmountHint(minor: number, currency: string): string {
  const major = minor / 100
  if (currency === 'INR') return `₹${major.toLocaleString('en-IN')}`
  return `${major}`
}

function buildResult(
  input: string,
  structured: StructuredIntent,
  phase: ParseResult['phase'],
  start: number,
  clarification?: ParseResult['clarification'],
): ParseResult {
  const durationMs = performance.now() - start
  if (DEV) {
    console.debug('[command-bar]', {
      input,
      intent: structured.intent,
      confidence: structured.confidence,
      phase,
      durationMs,
      parserMethod: structured.parserMethod,
    })
  }
  return { input, structured, phase, clarification, durationMs }
}

// Re-export for clarification resolution
export function applyClarification(
  structured: StructuredIntent,
  optionId: string,
  optionType: string,
  context: ParserContext,
): StructuredIntent {
  const updated = { ...structured }

  if (optionType === 'goal') {
    const goal = context.goals.find((g) => g.id === optionId)
    if (goal) {
      updated.goalId = goal.id
      updated.goalName = goal.name
    }
  } else if (optionType === 'asset') {
    const asset = context.assets.find((a) => a.id === optionId)
    if (asset) {
      updated.assetId = asset.id
      updated.assetName = asset.name
      updated.goalId = asset.goalId
    }
  } else if (optionType === 'loan') {
    const loan = context.loans.find((l) => l.id === optionId)
    if (loan) {
      updated.loanId = loan.id
      updated.loanName = loan.name
    }
  } else if (optionType === 'occurrence') {
    const occurrence = context.scheduledOccurrences?.find((o) => o.id === optionId)
    if (occurrence) {
      updated.scheduledOccurrenceId = occurrence.id
      updated.scheduledOccurrenceName = occurrence.name
    }
  } else if (optionType === 'action') {
    if (optionId === 'recurring') {
      if (updated.intent === 'RECORD_INVESTMENT') updated.intent = 'CREATE_RECURRING_INVESTMENT'
      if (updated.intent === 'RECORD_LOAN_PAYMENT') updated.intent = 'CREATE_RECURRING_EXPENSE'
    }
  }

  return updated
}

export function resolvePhaseAfterClarification(
  structured: StructuredIntent,
  context: ParserContext,
): ParseResult['phase'] {
  if (isNavigationIntent(structured.intent) || isQueryIntent(structured.intent)) return 'ready'
  if (structured.intent === 'UNKNOWN') return 'unknown'

  if (structured.intent === 'SKIP_SCHEDULED_TRANSACTION') {
    return structured.scheduledOccurrenceId ? 'needs_confirmation' : 'needs_clarification'
  }

  if (structured.intent === 'CREATE_GOAL') {
    if (!structured.amount) return 'needs_clarification'
    return 'needs_confirmation'
  }

  if (structured.intent === 'CREATE_ASSET') {
    if (!structured.amount || !structured.goalId) return 'needs_clarification'
    return 'needs_confirmation'
  }

  if (structured.intent === 'CREATE_LOAN') {
    if (!structured.amount) return 'needs_clarification'
    return 'needs_confirmation'
  }

  const needsGoal = ['RECORD_INVESTMENT', 'CREATE_RECURRING_INVESTMENT', 'RECORD_WITHDRAWAL'].includes(
    structured.intent,
  )
  const needsAsset = ['RECORD_INVESTMENT', 'CREATE_RECURRING_INVESTMENT', 'RECORD_WITHDRAWAL'].includes(
    structured.intent,
  )
  const needsLoan = structured.intent === 'RECORD_LOAN_PAYMENT'

  if (!structured.amount) return 'needs_clarification'
  if (needsGoal && !structured.goalId) return 'needs_clarification'
  if (needsAsset && !structured.assetId) {
    const assets = context.assets.filter((a) => a.goalId === structured.goalId)
    if (assets.length > 1) return 'needs_clarification'
    if (assets.length === 1) {
      const only = assets[0]!
      structured.assetId = only.id
      structured.assetName = only.name
    }
  }
  if (needsLoan && !structured.loanId) return 'needs_clarification'

  return 'needs_confirmation'
}

function matchSkipOccurrence(
  text: string,
  context: ParserContext,
): { match?: { id: string; name: string }; matches: Array<{ id: string; name: string }>; ambiguous: boolean } {
  const pool = (context.scheduledOccurrences ?? []).filter(
    (o) => o.status === 'DUE' || o.status === 'OVERDUE' || o.status === 'UPCOMING',
  )
  if (pool.length === 0) return { matches: [], ambiguous: false }

  const normalized = text.toLowerCase()
  const scored = pool
    .map((o) => ({
      item: o,
      score: normalized.includes(o.name.toLowerCase()) ? 1 : 0,
    }))
    .filter((s) => s.score > 0)

  if (scored.length === 1) {
    return { match: scored[0]!.item, matches: [scored[0]!.item], ambiguous: false }
  }
  if (pool.length === 1) {
    const only = pool[0]!
    return { match: only, matches: [only], ambiguous: false }
  }
  return { matches: pool, ambiguous: pool.length > 1 }
}
