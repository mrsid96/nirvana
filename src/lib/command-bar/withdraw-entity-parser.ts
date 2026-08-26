import { extractAmount } from '@/lib/command-bar/amount'
import { extractDate } from '@/lib/command-bar/date'
import { extractGoalHint } from '@/lib/command-bar/entities'
import { inferAssetInstrument } from '@/lib/command-bar/asset-instrument'
import type { ParsedFinancialAction, WithdrawActionData } from '@/lib/command-bar/entity-model'
import { resolveReference } from '@/lib/command-bar/reference-resolver'
import type { ParserContext } from '@/lib/command-bar/types'
import type { SupportedCurrency } from '@/types/user'

function redeemClauseAmount(text: string, currency: SupportedCurrency): number | undefined {
  const match = text.match(
    /\b(?:redeem|redeemed|withdraw|withdrew|withdrawn|took out)\w*\s+([\d,.]+(?:\s*(?:k|l|lac|lakh|lacs|lakhs))?)/i,
  )
  return match ? extractAmount(match[0], currency) : undefined
}

function extractWithdrawGoal(text: string, context: ParserContext): string | undefined {
  const educationMatch = text.match(
    /\bfor\s+(?:my\s+|her\s+|his\s+)?(?:(daughter|son|child)['']?s?\s+)?education\b/i,
  )
  if (educationMatch) {
    const child = educationMatch[1]
    if (child) {
      return `${child.charAt(0).toUpperCase()}${child.slice(1).toLowerCase()}'s Education`
    }
    return 'Child Education'
  }

  const createdFor = text.match(/\bcreated\s+for\s+(?:my\s+|her\s+|his\s+)?([a-z][\w\s']{2,30}?)(?:\s*[.,]|$)/i)
  if (createdFor?.[1]) {
    const hint = createdFor[1].trim()
    if (hint.toLowerCase().includes('education')) {
      return hint.toLowerCase().includes('child') || hint.toLowerCase().includes('daughter')
        ? "Daughter's Education"
        : 'Education'
    }
    return hint.charAt(0).toUpperCase() + hint.slice(1)
  }

  return extractGoalHint(text, context.goals)
}

export function parseWithdrawEntities(text: string, context: ParserContext): ParsedFinancialAction[] {
  const n = text.toLowerCase()
  if (!/\b(withdraw|withdrew|withdrawn|redeem|redeemed|took out|taken out)\b/.test(n)) {
    return []
  }

  const amount = redeemClauseAmount(text, context.currency) ?? extractAmount(text, context.currency)
  if (!amount) return []

  const ref = resolveReference(text, context)
  const asset = inferAssetInstrument(text)
  const goal =
    ref.goalName ??
    extractWithdrawGoal(text, context) ??
    (/\bemergency\b/i.test(text) ? undefined : extractGoalHint(text, context.goals))
  const early = /\bbefore maturity\b/i.test(text)

  const data: WithdrawActionData = {
    amount,
    asset: ref.assetName ?? asset,
    goal,
    date: extractDate(text, context.today),
    early_withdrawal: early || undefined,
    reason: /\bemergency\b/i.test(text) ? 'emergency' : undefined,
  }

  return [{ entity: 'WITHDRAW', action: 'CREATE', data, confidence: 0.9 }]
}
