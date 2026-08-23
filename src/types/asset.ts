export type AssetCategory =
  | 'MF'
  | 'FD'
  | 'RD'
  | 'ETF'
  | 'STOCK'
  | 'GOLD'
  | 'PPF'
  | 'NPS'
  | 'CASH'
  | 'OTHER'

export type AssetSource = 'ZERODHA' | 'GROWW' | 'BANK' | 'OTHER'
export type InvestmentType = 'SIP' | 'LUMP_SUM' | 'BOTH'

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  MF: 'Mutual Fund',
  FD: 'Fixed Deposit',
  RD: 'Recurring Deposit',
  ETF: 'ETF',
  STOCK: 'Stocks',
  GOLD: 'Gold',
  PPF: 'PPF',
  NPS: 'NPS',
  CASH: 'Cash',
  OTHER: 'Other',
}

export const ASSET_SOURCE_LABELS: Record<AssetSource, string> = {
  ZERODHA: 'Zerodha',
  GROWW: 'Groww',
  BANK: 'Bank',
  OTHER: 'Other',
}

export interface Asset {
  id: string
  goalId: string
  name: string
  category: AssetCategory
  source: AssetSource
  investmentType: InvestmentType
  investedAmount: number
  currentValue: number
  totalWithdrawals: number
  expectedCagr?: number
  monthlyInvestment?: number
  plannedInvestmentDay?: number
  startDate?: string
  endDate?: string
  notes?: string
  isActive: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}
