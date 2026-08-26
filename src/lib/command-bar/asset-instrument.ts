import type { AssetCategory } from '@/types/asset'
import type { AssetInstrumentType } from '@/lib/command-bar/entity-model'

export function inferAssetInstrument(text: string): AssetInstrumentType {
  const n = text.toLowerCase()
  if (/\bmutual\s*funds?\b|\bindex\s+fund\b/.test(n)) return 'mutual_fund'
  if (/\bsip\b/.test(n)) return 'sip'
  if (/\brd\b|\brecurring deposit\b/.test(n)) return 'rd'
  if (/\bfd\b|\bfixed deposit\b/.test(n)) return 'fd'
  if (/\bsavings?\b/.test(n)) return 'savings'
  if (/\bstocks?\b|\bequity\b/.test(n)) return 'stocks'
  if (/\bgold\b/.test(n)) return 'gold'
  if (/\bcash\b/.test(n)) return 'cash'
  if (/\bproperty\b|\bhouse\b/.test(n) && /\bbought\b/.test(n)) return 'property'
  if (/\bemergency fund\b/.test(n)) return 'emergency_fund'
  if (/\bvacation fund\b/.test(n)) return 'vacation_fund'
  if (/\bcar fund\b/.test(n)) return 'car_fund'
  return 'unknown'
}

export function assetInstrumentLabel(type: AssetInstrumentType): string {
  const labels: Record<AssetInstrumentType, string> = {
    unknown: 'Unspecified savings',
    mutual_fund: 'Mutual Fund',
    sip: 'SIP',
    rd: 'RD',
    fd: 'FD',
    savings: 'Savings',
    stocks: 'Stocks',
    gold: 'Gold',
    cash: 'Cash',
    property: 'Property',
    index_fund: 'Index Fund',
    emergency_fund: 'Emergency Fund',
    vacation_fund: 'Vacation Fund',
    car_fund: 'Car Fund',
    retirement_investment: 'Retirement Investment',
    house_savings: 'House Savings',
    investment: 'Investment',
    other: 'Other',
  }
  return labels[type]
}

export function assetInstrumentToCategory(type: AssetInstrumentType): AssetCategory {
  switch (type) {
    case 'mutual_fund':
    case 'sip':
    case 'index_fund':
      return 'MF'
    case 'rd':
      return 'RD'
    case 'fd':
      return 'FD'
    case 'stocks':
      return 'STOCK'
    case 'gold':
      return 'GOLD'
    case 'cash':
    case 'savings':
    case 'unknown':
      return 'OTHER'
    default:
      return 'OTHER'
  }
}
