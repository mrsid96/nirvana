import { z } from 'zod'
import { isoDateSchema, moneyMinorSchema } from '@/lib/validation/common'

export const loanSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional(),
  purpose: z.string().trim().max(80).optional(),
  bank: z.string().trim().min(1).max(80),
  originalAmount: moneyMinorSchema.positive(),
  outstandingAmount: moneyMinorSchema,
  interestRate: z.number().min(0).max(100),
  tenureMonths: z.number().int().positive().max(600),
  startDate: isoDateSchema,
  endDate: isoDateSchema.optional(),
  emiAmount: moneyMinorSchema.nonnegative(),
  emiDate: z.number().int().min(1).max(28),
  deductionBank: z.string().trim().min(1).max(80),
  status: z.enum(['ACTIVE', 'CLOSED']),
})

export const loanPaymentSchema = z.object({
  amount: moneyMinorSchema.positive(),
  principalAmount: moneyMinorSchema.optional(),
  interestAmount: moneyMinorSchema.optional(),
  date: isoDateSchema,
  note: z.string().trim().max(200).optional(),
  updateOutstanding: z.boolean().optional(),
})
