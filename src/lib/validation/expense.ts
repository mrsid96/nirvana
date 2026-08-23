import { z } from 'zod'
import { EXPENSE_CATEGORIES, PAYMENT_SOURCES } from '@/types/expense'
import { isoDateSchema, moneyMinorSchema } from '@/lib/validation/common'

export const expenseSchema = z.object({
  amount: moneyMinorSchema.positive(),
  category: z.enum(EXPENSE_CATEGORIES),
  description: z.string().trim().max(200).optional(),
  date: isoDateSchema,
  paymentSource: z.enum(PAYMENT_SOURCES).optional(),
})

export const incomeSchema = z.object({
  amount: moneyMinorSchema.positive(),
  source: z.string().trim().min(1).max(40),
  description: z.string().trim().max(200).optional(),
  date: isoDateSchema,
})
