export type HealthLabel = 'Strong' | 'Good' | 'Needs Attention'

export interface FinancialHealth {
  savingsRate: number
  investmentRate: number
  debtToIncome: number
  wealthGoalProgress: number
  savingsLabel: HealthLabel
  investmentLabel: HealthLabel
  debtLabel: HealthLabel
  overallLabel: HealthLabel
}

export function calculateFinancialHealth(params: {
  income: number
  expenses: number
  investments: number
  emis: number
  wealthGoalProgress: number
}): FinancialHealth {
  const { income, expenses, investments, emis, wealthGoalProgress } = params
  const savingsRate = income <= 0 ? 0 : ((income - expenses) / income) * 100
  const investmentRate = income <= 0 ? 0 : (investments / income) * 100
  const debtToIncome = income <= 0 ? 0 : (emis / income) * 100

  const savingsLabel = labelFromThresholds(savingsRate, 20, 10, true)
  const investmentLabel = labelFromThresholds(investmentRate, 20, 10, true)
  const debtLabel = labelFromThresholds(debtToIncome, 30, 40, false)
  const progressLabel = labelFromThresholds(wealthGoalProgress, 40, 15, true)
  const score =
    (labelScore(savingsLabel) +
      labelScore(investmentLabel) +
      labelScore(debtLabel) +
      labelScore(progressLabel)) /
    4

  return {
    savingsRate,
    investmentRate,
    debtToIncome,
    wealthGoalProgress,
    savingsLabel,
    investmentLabel,
    debtLabel,
    overallLabel: score >= 2.5 ? 'Strong' : score >= 1.75 ? 'Good' : 'Needs Attention',
  }
}

function labelFromThresholds(
  value: number,
  strong: number,
  good: number,
  higherIsBetter: boolean,
): HealthLabel {
  if (higherIsBetter) {
    if (value >= strong) return 'Strong'
    if (value >= good) return 'Good'
    return 'Needs Attention'
  }
  if (value <= strong) return 'Strong'
  if (value <= good) return 'Good'
  return 'Needs Attention'
}

function labelScore(label: HealthLabel): number {
  if (label === 'Strong') return 3
  if (label === 'Good') return 2
  return 1
}
