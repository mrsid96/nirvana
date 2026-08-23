import { format, parseISO, startOfMonth, addMonths } from 'date-fns'
import type { Asset } from '@/types/asset'
import type { AssetTransaction } from '@/types/transaction'

export interface WealthHistoryPoint {
  label: string
  monthKey: string
  wealth: number
}

/**
 * Reconstruct month-end wealth from transaction history.
 * Does not fabricate values — only months with valuation data are included.
 */
export function buildHistoricalWealthSeries(
  assets: Asset[],
  transactions: AssetTransaction[],
  asOfDate: string,
  monthsBack = 12,
): WealthHistoryPoint[] {
  const activeAssets = assets.filter((asset) => !asset.isDeleted)
  if (activeAssets.length === 0) return []

  const asOf = parseISO(asOfDate)
  const monthKeys: string[] = []
  for (let i = monthsBack; i >= 0; i -= 1) {
    const monthStart = startOfMonth(addMonths(asOf, -i))
    monthKeys.push(format(monthStart, 'yyyy-MM'))
  }

  const points: WealthHistoryPoint[] = []

  for (const monthKey of monthKeys) {
    const monthEnd = format(
      new Date(Number(monthKey.slice(0, 4)), Number(monthKey.slice(5, 7)), 0),
      'yyyy-MM-dd',
    )
    let total = 0
    let hasData = false

    for (const asset of activeAssets) {
      const value = wealthAtDate(asset, transactions, monthEnd)
      if (value !== null) {
        hasData = true
        total += value
      }
    }

    if (hasData) {
      const [year, month] = monthKey.split('-').map(Number)
      const label = new Intl.DateTimeFormat(undefined, { month: 'short', year: '2-digit' }).format(
        new Date(year!, month! - 1, 1),
      )
      points.push({ label, monthKey, wealth: total })
    }
  }

  return points
}

function wealthAtDate(
  asset: Asset,
  transactions: AssetTransaction[],
  date: string,
): number | null {
  const assetTx = transactions
    .filter(
      (tx) =>
        !tx.isDeleted &&
        tx.assetId === asset.id &&
        tx.date <= date &&
        tx.type !== 'VALUE_UPDATE',
    )
    .sort((a, b) => a.date.localeCompare(b.date))

  const valueUpdates = transactions
    .filter(
      (tx) =>
        !tx.isDeleted &&
        tx.assetId === asset.id &&
        tx.type === 'VALUE_UPDATE' &&
        tx.date <= date,
    )
    .sort((a, b) => a.date.localeCompare(b.date))

  if (assetTx.length === 0 && valueUpdates.length === 0) {
    if (asset.createdAt.slice(0, 10) > date) return null
    return asset.currentValue
  }

  let invested = 0
  let withdrawn = 0
  let currentValue = 0

  for (const tx of assetTx) {
    if (tx.type === 'INVESTMENT') {
      invested += tx.amount
      currentValue += tx.amount
    } else if (tx.type === 'WITHDRAWAL') {
      withdrawn += tx.amount
      currentValue = Math.max(0, currentValue - tx.amount)
    }
  }

  if (valueUpdates.length > 0) {
    currentValue = valueUpdates.at(-1)!.amount
  } else if (assetTx.length === 0) {
    return null
  }

  void invested
  void withdrawn
  return currentValue
}
