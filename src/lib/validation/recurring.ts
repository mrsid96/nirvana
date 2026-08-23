import { z } from 'zod'
import { EXPENSE_CATEGORIES } from '@/types/expense'
import { isoDateSchema, moneyMinorSchema } from '@/lib/validation/common'

export const recurringActivitySchema = z.object({
  type: z.enum(['INVESTMENT', 'LOAN_PAYMENT', 'INCOME', 'EXPENSE']),
  name: z.string().trim().min(1).max(80),
  amount: moneyMinorSchema.positive(),
  frequency: z.literal('MONTHLY'),
  scheduledDay: z.number().int().min(1).max(31),
  startDate: isoDateSchema,
  endDate: isoDateSchema.optional(),
  goalId: z.string().optional(),
  assetId: z.string().optional(),
  loanId: z.string().optional(),
  expenseCategory: z.enum(EXPENSE_CATEGORIES).optional(),
  incomeSource: z.string().trim().max(80).optional(),
  status: z.enum(['ACTIVE', 'PAUSED']),
})

export const recordOccurrenceSchema = z.object({
  actualAmount: moneyMinorSchema.positive(),
  actualDate: isoDateSchema,
  note: z.string().trim().max(200).optional(),
})

export const skipOccurrenceSchema = z.object({
  reason: z.string().trim().max(200).optional(),
})
