import type { StructuredIntent } from '@/lib/command-bar/types'
import { isCreateIntent } from '@/lib/command-bar/labels'

export function validateCreateIntent(structured: StructuredIntent): string | null {
  if (!isCreateIntent(structured.intent)) return null

  switch (structured.intent) {
    case 'CREATE_GOAL':
      if (!structured.goalName?.trim()) return 'Enter a goal name'
      if (!structured.amount) return 'Enter a target amount'
      if (!structured.targetDate) return 'Choose a target date'
      return null

    case 'CREATE_ASSET':
      if (!structured.assetName?.trim()) return 'Enter an asset name'
      if (!structured.goalId) return 'Choose a goal'
      if (!structured.amount) return 'Enter the asset value'
      return null

    case 'CREATE_LOAN':
      if (!structured.loanName?.trim()) return 'Enter a loan name'
      if (!structured.bank?.trim()) return 'Enter the bank or lender'
      const original = structured.originalAmount ?? structured.amount
      if (!original) return 'Enter the original loan amount'
      if (!structured.emiAmount && !structured.amount) return 'Enter the EMI amount'
      if (structured.interestRate != null && (structured.interestRate < 0 || structured.interestRate > 100)) {
        return 'Interest rate must be between 0 and 100'
      }
      if (structured.tenureMonths != null && structured.tenureMonths < 1) {
        return 'Tenure must be at least 1 month'
      }
      return null

    default:
      return null
  }
}
