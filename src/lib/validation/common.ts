import { z } from 'zod'

export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
export const monthKeySchema = z.string().regex(/^\d{4}-\d{2}$/)
export const moneyMinorSchema = z.number().int().nonnegative().max(9_000_000_000_000)
export const currencySchema = z.enum(['INR', 'USD', 'EUR', 'GBP', 'SGD', 'AED'])
export const countrySchema = z.string().min(2).max(56)
export const themeSchema = z.enum(['light', 'dark', 'system'])
