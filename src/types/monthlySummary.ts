export interface MonthlySummary {
  month: string
  income: number
  expenses: number
  investments: number
  withdrawals: number
  loanPayments: number
  freeCashFlow: number
  transactionCount: number
  updatedAt: string
}

export function emptyMonthlySummary(month: string): MonthlySummary {
  return {
    month,
    income: 0,
    expenses: 0,
    investments: 0,
    withdrawals: 0,
    loanPayments: 0,
    freeCashFlow: 0,
    transactionCount: 0,
    updatedAt: '',
  }
}

export function withFreeCashFlow<T extends Omit<MonthlySummary, 'freeCashFlow' | 'updatedAt'> & Partial<Pick<MonthlySummary, 'updatedAt'>>>(
  summary: T,
): MonthlySummary {
  return {
    month: summary.month,
    income: summary.income,
    expenses: summary.expenses,
    investments: summary.investments,
    withdrawals: summary.withdrawals,
    loanPayments: summary.loanPayments,
    transactionCount: summary.transactionCount,
    freeCashFlow:
      summary.income -
      summary.expenses -
      summary.loanPayments -
      summary.investments +
      summary.withdrawals,
    updatedAt: summary.updatedAt ?? '',
  }
}
