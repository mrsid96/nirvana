import { z } from 'zod'
import { isoDateSchema, moneyMinorSchema } from '@/lib/validation/common'

export const assetSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: z.enum(['MF', 'FD', 'RD', 'ETF', 'STOCK', 'GOLD', 'PPF', 'NPS', 'CASH', 'OTHER']),
  source: z.enum(['ZERODHA', 'GROWW', 'BANK', 'OTHER']),
  investmentType: z.enum(['SIP', 'LUMP_SUM', 'BOTH']),
  investedAmount: moneyMinorSchema,
  currentValue: moneyMinorSchema,
  expectedCagr: z.number().min(0).max(100).optional(),
  monthlyInvestment: moneyMinorSchema.optional(),
  plannedInvestmentDay: z.number().int().min(1).max(28).optional(),
  startDate: isoDateSchema.optional(),
  endDate: isoDateSchema.optional(),
  notes: z.string().trim().max(500).optional(),
  isActive: z.boolean(),
})

export const assetTransactionSchema = z.object({
  type: z.enum(['INVESTMENT', 'WITHDRAWAL', 'VALUE_UPDATE']),
  amount: moneyMinorSchema.positive(),
  date: isoDateSchema,
  note: z.string().trim().max(200).optional(),
})
