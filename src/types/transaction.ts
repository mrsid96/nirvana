export type AssetTransactionType = 'INVESTMENT' | 'WITHDRAWAL' | 'VALUE_UPDATE'

export interface AssetTransaction {
  id: string
  userId?: string
  assetId: string
  goalId: string
  type: AssetTransactionType
  amount: number
  date: string
  month: string
  note?: string
  source?: string
  isDeleted: boolean
  createdAt: string
  updatedAt?: string
}
