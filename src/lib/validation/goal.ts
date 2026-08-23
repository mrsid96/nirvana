import { z } from 'zod'
import { isoDateSchema, moneyMinorSchema } from '@/lib/validation/common'

export const goalSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional(),
  targetAmount: moneyMinorSchema.positive(),
  startDate: isoDateSchema,
  targetDate: isoDateSchema,
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['active', 'completed', 'paused']),
})
