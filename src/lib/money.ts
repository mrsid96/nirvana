import type { SupportedCurrency } from '@/types/user'

export interface CurrencyMeta {
  code: SupportedCurrency
  label: string
  locale: string
  minorUnits: number
}

export const CURRENCIES: Record<SupportedCurrency, CurrencyMeta> = {
  INR: { code: 'INR', label: 'Indian Rupee', locale: 'en-IN', minorUnits: 100 },
  USD: { code: 'USD', label: 'US Dollar', locale: 'en-US', minorUnits: 100 },
  EUR: { code: 'EUR', label: 'Euro', locale: 'en-IE', minorUnits: 100 },
  GBP: { code: 'GBP', label: 'British Pound', locale: 'en-GB', minorUnits: 100 },
  SGD: { code: 'SGD', label: 'Singapore Dollar', locale: 'en-SG', minorUnits: 100 },
  AED: { code: 'AED', label: 'UAE Dirham', locale: 'en-AE', minorUnits: 100 },
}

export const COUNTRIES: { name: string; countryCode: string; currency: SupportedCurrency }[] =
  [
    { name: 'India', countryCode: 'IN', currency: 'INR' },
    { name: 'United States', countryCode: 'US', currency: 'USD' },
    { name: 'United Kingdom', countryCode: 'GB', currency: 'GBP' },
    { name: 'Singapore', countryCode: 'SG', currency: 'SGD' },
    { name: 'United Arab Emirates', countryCode: 'AE', currency: 'AED' },
    { name: 'Germany', countryCode: 'DE', currency: 'EUR' },
    { name: 'France', countryCode: 'FR', currency: 'EUR' },
    { name: 'Ireland', countryCode: 'IE', currency: 'EUR' },
  ]

export function isSupportedCurrency(value: string): value is SupportedCurrency {
  return value in CURRENCIES
}

export function toMinorUnits(major: number, currency: SupportedCurrency): number {
  return Math.round(major * CURRENCIES[currency].minorUnits)
}

export function toMajorUnits(minor: number, currency: SupportedCurrency): number {
  return minor / CURRENCIES[currency].minorUnits
}

export function addMoney(...amounts: number[]): number {
  return amounts.reduce((sum, value) => sum + value, 0)
}
