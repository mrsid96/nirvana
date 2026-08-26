import { extractAmount } from '@/lib/command-bar/amount'
import { extractDayOfMonth, extractTargetHorizon } from '@/lib/command-bar/date'
import { extractGoalHint } from '@/lib/command-bar/entities'
import { todayIsoDate } from '@/lib/formatters/dates'
import type { ParserContext, StructuredIntent } from '@/lib/command-bar/types'
import type { AssetCategory } from '@/types/asset'
import type { SupportedCurrency } from '@/types/user'

const GOAL_NAME_STOP_WORDS = new Set([
  'the',
  'my',
  'a',
  'an',
  'for',
  'goal',
  'money',
  'some',
  'new',
])

export function extractMonthlyAmount(
  text: string,
  currency: SupportedCurrency,
): number | undefined {
  const anchor = text.search(/\b(?:per month|every month|monthly|each month)\b/i)
  if (anchor === -1) return undefined

  const beforeAnchor = text.slice(0, anchor)
  const amounts = [
    ...beforeAnchor.matchAll(/([\d,]+(?:\.\d+)?(?:\s*(?:k|l|lac|lakh|cr|crore))?)/gi),
  ]
  if (amounts.length > 0) {
    const last = amounts[amounts.length - 1]![1]
    if (last) {
      return extractAmount(last.replace(/,/g, ''), currency)
    }
  }

  return undefined
}

function capitalizeWords(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function inferRecurringAsset(text: string): {
  assetName: string
  assetCategory: AssetCategory
  source: string
} {
  const normalized = text.toLowerCase()
  if (/\bmutual\s*funds?\b|\bmf\b/.test(normalized)) {
    return { assetName: 'Mutual Fund', assetCategory: 'MF', source: 'OTHER' }
  }
  if (/\brd\b|\brecurring deposit\b/.test(normalized)) {
    return { assetName: 'RD', assetCategory: 'FD', source: 'BANK' }
  }
  if (/\betf\b/.test(normalized)) {
    return { assetName: 'ETF', assetCategory: 'ETF', source: 'OTHER' }
  }
  if (/\bfd\b|\bfixed deposit\b/.test(normalized)) {
    return { assetName: 'FD', assetCategory: 'FD', source: 'BANK' }
  }
  if (/\bstock\b|\bequity\b/.test(normalized)) {
    return { assetName: 'Stocks', assetCategory: 'STOCK', source: 'OTHER' }
  }
  if (/\bppf\b/.test(normalized)) {
    return { assetName: 'PPF', assetCategory: 'PPF', source: 'BANK' }
  }
  if (/\bsip\b/.test(normalized)) {
    return { assetName: 'SIP', assetCategory: 'MF', source: 'OTHER' }
  }
  if (/\b(save|saving|afford|invest)\b/.test(normalized)) {
    return { assetName: 'Unspecified savings', assetCategory: 'OTHER', source: 'OTHER' }
  }
  return { assetName: 'Unspecified savings', assetCategory: 'OTHER', source: 'OTHER' }
}

function extractWorthAmount(text: string, currency: SupportedCurrency): number | undefined {
  const worthMatch = text.match(/\bworth\s+([\d,.]+(?:\s*(?:k|l|lac|lakh|cr|crore))?)/i)
  if (worthMatch?.[0]) {
    return extractAmount(worthMatch[0], currency)
  }
  return undefined
}

function extractRecurringAssetName(text: string): string {
  return inferRecurringAsset(text).assetName
}

function extractNewGoalName(text: string): string | undefined {
  const match = text.match(/\bgoal\s+([a-z][\w]+)/i)
  if (!match?.[1]) return undefined
  const name = match[1].trim()
  if (GOAL_NAME_STOP_WORDS.has(name.toLowerCase())) return undefined
  return capitalizeWords(name)
}

function extractPurchaseGoalName(text: string): string | undefined {
  const worthMatch = text.match(
    /\b(?:want|plan|need)\s+(?:to\s+)?(?:buy|purchase|get|own)\s+(?:a|an|the|my)?\s*([a-z0-9][\w\s]{0,30}?)\s+worth\b/i,
  )
  if (worthMatch?.[1]) {
    const name = worthMatch[1].trim()
    if (name.length >= 2 && !GOAL_NAME_STOP_WORDS.has(name.toLowerCase())) {
      return capitalizeWords(name)
    }
  }

  const buyWorthMatch = text.match(
    /\b(?:buy|purchase|get)\s+(?:a|an|the|my)?\s*([a-z0-9][\w\s]{0,30}?)\s+worth\b/i,
  )
  if (buyWorthMatch?.[1]) {
    const name = buyWorthMatch[1].trim()
    if (name.length >= 2 && !GOAL_NAME_STOP_WORDS.has(name.toLowerCase())) {
      return capitalizeWords(name)
    }
  }

  const wantArticleMatch = text.match(
    /\b(?:want|need)\s+(?:to\s+)?(?:have|buy|get|own\s+)?(?:a|an|the|my)\s+([a-z0-9][\w\s]{0,30}?)\s+for\b/i,
  )
  if (wantArticleMatch?.[1]) {
    const name = wantArticleMatch[1].trim()
    if (name.length >= 2 && !GOAL_NAME_STOP_WORDS.has(name.toLowerCase())) {
      return capitalizeWords(name)
    }
  }

  const giftMatch = text.match(
    /\b(?:thinking\s+(?:to\s+)?)?gift\s+(?:myself|yourself|himself|herself|themself|themselves)?\s*(?:a|an|the)?\s*([a-z0-9][\w\s]{0,30}?)(?:\s*,|\s+for\b|\s+and\b)/i,
  )
  if (giftMatch?.[1]) {
    const name = giftMatch[1].trim()
    if (name.length >= 2 && !GOAL_NAME_STOP_WORDS.has(name.toLowerCase())) {
      return capitalizeWords(name)
    }
  }

  const purchaseMatch = text.match(
    /\b(?:want|plan|wish|hope|thinking|save|saving|need)\b(?:\s+\w+){0,8}?\s+(?:to\s+)?(?:have|buy|get|own|purchase|gift)\s+(?:a|an|the|my)?\s*([a-z0-9][\w\s]{0,30}?)\s+for\b/i,
  )
  if (purchaseMatch?.[1]) {
    const name = purchaseMatch[1].trim()
    if (name.length >= 2 && !GOAL_NAME_STOP_WORDS.has(name.toLowerCase())) {
      return capitalizeWords(name)
    }
  }

  const saveForMatch = text.match(
    /\bsave(?:\s+up)?\s+for\s+(?:a|an|the|my)?\s*([a-z0-9][\w\s]{0,30}?)(?:\s+for\b|\s*,|\s+and\b|\s+to\b)/i,
  )
  if (saveForMatch?.[1]) {
    const name = saveForMatch[1].trim()
    if (name.length >= 2 && !GOAL_NAME_STOP_WORDS.has(name.toLowerCase())) {
      return capitalizeWords(name)
    }
  }

  const forThatMatch = text.match(
    /\bfor\s+that\b[^,]*,\s*(?:i\s+)?(?:want|plan|wish|hope|thinking)\b/i,
  )
  if (forThatMatch) {
    const before = text.slice(0, forThatMatch.index).trim()
    const itemMatch = before.match(
      /(?:gift|buy|get|have|own|purchase)\s+(?:myself|yourself)?\s*(?:a|an|the)?\s*([a-z0-9][\w\s]{0,30}?)\s*,?\s*$/i,
    )
    if (itemMatch?.[1]) {
      const name = itemMatch[1].trim()
      if (name.length >= 2 && !GOAL_NAME_STOP_WORDS.has(name.toLowerCase())) {
        return capitalizeWords(name)
      }
    }
  }

  return undefined
}

function extractExplicitGoalClause(text: string): string {
  const parts = text.split(/\s*,\s*and\s+|\s+and\s+/i)
  return parts[0]?.trim() ?? text
}

function extractTargetClause(text: string): string {
  const forThat = text.split(/\s*,\s*for that\b/i)
  if (forThat.length > 1 && forThat[0]?.trim()) {
    return forThat[0].trim()
  }

  const parts = text.split(/\s*,\s*(?:to which|and\b)|\s+to which\b/i)
  const first = parts[0]?.trim() ?? text
  return first.split(/\b(?:every month|per month|monthly|each month)\b/i)[0]?.trim() ?? first
}

function buildBundledIntent(
  text: string,
  context: ParserContext,
  fields: {
    goalName: string
    targetClause: string
    confidence: number
  },
): StructuredIntent | null {
  const monthlyInvestment = extractMonthlyAmount(text, context.currency)
  if (!monthlyInvestment) return null

  const asset = inferRecurringAsset(text)
  const today = context.today ?? todayIsoDate()
  const targetAmount =
    extractWorthAmount(fields.targetClause, context.currency) ??
    extractWorthAmount(text, context.currency) ??
    extractAmount(fields.targetClause, context.currency)
  const targetDate = extractTargetHorizon(text, today)

  return {
    intent: 'CREATE_GOAL_WITH_ASSET',
    confidence: fields.confidence,
    parserMethod: 'bundled',
    currency: context.currency,
    goalName: fields.goalName,
    assetName: asset.assetName,
    assetCategory: asset.assetCategory,
    investmentType: 'SIP',
    amount: targetAmount,
    monthlyInvestment,
    targetDate,
    frequency: 'MONTHLY',
    dayOfMonth: extractDayOfMonth(text) ?? 1,
    source: asset.source,
  }
}

function detectExplicitGoalWithRecurring(
  text: string,
  context: ParserContext,
): StructuredIntent | null {
  const normalized = text.toLowerCase()
  if (!/\b(create|add|set up|setup)\b/.test(normalized)) return null
  if (!/\bgoal\b/.test(normalized)) return null
  if (!/\band\b/.test(normalized)) return null
  if (!/\b(rd|recurring deposit|sip|monthly deposit|mutual fund|mf)\b/.test(normalized)) return null
  if (!/\b(start|begin|open|setup|set up|invest|put)\b/.test(normalized)) return null

  const goalName = extractNewGoalName(text) ?? extractGoalHint(text) ?? 'New goal'
  return buildBundledIntent(text, context, {
    goalName,
    targetClause: extractExplicitGoalClause(text),
    confidence: 0.93,
  })
}

function detectPurchaseGoalWithRecurring(
  text: string,
  context: ParserContext,
): StructuredIntent | null {
  const normalized = text.toLowerCase()
  if (/\bloan\b|\bemi\b|\bmortgage\b/.test(normalized) && !/\b(mutual fund|mf)\b/.test(normalized)) {
    return null
  }

  const hasMonthly = /\b(every month|per month|monthly|each month)\b/.test(normalized)
  const hasSavingsPlan =
    /\b(save|saving|invest|put|deposit|sip|aside|afford)\b/.test(normalized) ||
    /\b(mutual fund|mf|rd|etf|fd|ppf|stocks?)\b/.test(normalized)
  const hasPurchaseTarget =
    Boolean(extractPurchaseGoalName(text)) ||
    /\bworth\s+[\d,.]+(?:\s*(?:k|l|lac|lakh|cr|crore))?/i.test(text)

  if (!hasMonthly || !hasSavingsPlan || !hasPurchaseTarget) return null

  const goalName = extractPurchaseGoalName(text)
  if (!goalName) return null

  return buildBundledIntent(text, context, {
    goalName,
    targetClause: extractTargetClause(text),
    confidence: 0.91,
  })
}

/** Goal + monthly SIP/RD/MF in one sentence (explicit create or aspirational purchase). */
export function detectGoalWithRecurringAsset(
  text: string,
  context: ParserContext,
): StructuredIntent | null {
  return (
    detectExplicitGoalWithRecurring(text, context) ??
    detectPurchaseGoalWithRecurring(text, context)
  )
}
