export function futureValueLumpSum(
  presentValue: number,
  annualCagr: number,
  years: number,
): number {
  if (years <= 0) return presentValue
  return presentValue * (1 + annualCagr) ** years
}

export function monthlyRateFromCagr(annualCagr: number): number {
  if (annualCagr <= 0) return 0
  return (1 + annualCagr) ** (1 / 12) - 1
}

export function futureValueWithMonthlyContributions(params: {
  presentValue: number
  monthlyContribution: number
  annualCagr: number
  months: number
}): number {
  const { presentValue, monthlyContribution, annualCagr, months } = params
  if (months <= 0) return presentValue
  const r = monthlyRateFromCagr(annualCagr)
  if (r === 0) {
    return presentValue + monthlyContribution * months
  }
  const growth = (1 + r) ** months
  const fvPrincipal = presentValue * growth
  const fvAnnuity = monthlyContribution * ((growth - 1) / r)
  return fvPrincipal + fvAnnuity
}

export function requiredMonthlyContribution(params: {
  presentValue: number
  targetValue: number
  annualCagr: number
  months: number
}): number {
  const { presentValue, targetValue, annualCagr, months } = params
  if (months <= 0) return Math.max(0, targetValue - presentValue)
  const r = monthlyRateFromCagr(annualCagr)
  if (r === 0) {
    return Math.max(0, (targetValue - presentValue) / months)
  }
  const growth = (1 + r) ** months
  const fvOfCurrent = presentValue * growth
  const remaining = targetValue - fvOfCurrent
  if (remaining <= 0) return 0
  return remaining * (r / (growth - 1))
}
