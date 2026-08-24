import { derivedGoalSummary } from '@/lib/calculations/derived'
import { currentMonthKey, shiftMonth, todayIsoDate } from '@/lib/formatters/dates'
import { withFreeCashFlow } from '@/types/monthlySummary'
import { DEMO_USER_ID } from '@/demo/constants'
import type { FinanceStateSlice } from '@/services/financeLocalPatch'
import type { Asset } from '@/types/asset'
import type { AssetTransaction } from '@/types/transaction'
import type { Expense } from '@/types/expense'
import type { Goal } from '@/types/goal'
import type { Income } from '@/types/income'
import type { Loan, LoanPayment } from '@/types/loan'
import type { MonthlySummary } from '@/types/monthlySummary'

const ts = '2024-06-15T10:00:00.000Z'

const GOAL_RETIREMENT = 'demo-goal-retirement'
const GOAL_HOME = 'demo-goal-home'
const GOAL_EMERGENCY = 'demo-goal-emergency'
const GOAL_EDUCATION = 'demo-goal-education'

const ASSET_MF = 'demo-asset-mf'
const ASSET_STOCKS = 'demo-asset-stocks'
const ASSET_EPF = 'demo-asset-epf'
const ASSET_CASH = 'demo-asset-cash'
const ASSET_VEHICLE = 'demo-asset-vehicle'
const ASSET_PROPERTY = 'demo-asset-property'

const LOAN_HOME = 'demo-loan-home'

function goal(
  partial: Omit<Goal, 'userId' | 'isDeleted' | 'createdAt' | 'updatedAt'> & Partial<Goal>,
): Goal {
  return {
    userId: DEMO_USER_ID,
    isDeleted: false,
    createdAt: ts,
    updatedAt: ts,
    currentValue: 0,
    investedAmount: 0,
    withdrawnAmount: 0,
    netInvestedAmount: 0,
    monthlyInvestment: 0,
    ...partial,
  }
}

function asset(
  partial: Omit<Asset, 'userId' | 'isDeleted' | 'createdAt' | 'updatedAt' | 'totalWithdrawals'> &
    Partial<Pick<Asset, 'totalWithdrawals'>>,
): Asset {
  return {
    userId: DEMO_USER_ID,
    isDeleted: false,
    createdAt: ts,
    updatedAt: ts,
    ...partial,
    totalWithdrawals: partial.totalWithdrawals ?? 0,
  }
}

function buildGoals(assets: Asset[]): Goal[] {
  const goals: Goal[] = [
    goal({
      id: GOAL_RETIREMENT,
      name: 'Retirement',
      description: 'Long-term retirement corpus',
      targetAmount: 2_00_00_000_00,
      startDate: '2018-01-01',
      targetDate: '2045-01-01',
      priority: 'high',
      status: 'active',
    }),
    goal({
      id: GOAL_HOME,
      name: 'Home & Assets',
      description: 'Property and vehicle',
      targetAmount: 50_00_000_00,
      startDate: '2020-01-01',
      targetDate: '2032-01-01',
      priority: 'medium',
      status: 'active',
    }),
    goal({
      id: GOAL_EMERGENCY,
      name: 'Emergency Fund',
      targetAmount: 10_00_000_00,
      startDate: '2022-01-01',
      targetDate: '2027-01-01',
      priority: 'high',
      status: 'active',
    }),
    goal({
      id: GOAL_EDUCATION,
      name: 'Child Education',
      targetAmount: 25_00_000_00,
      startDate: '2021-01-01',
      targetDate: '2035-06-01',
      priority: 'medium',
      status: 'active',
    }),
  ]

  return goals.map((item) => {
    const summary = derivedGoalSummary(item.id, assets)
    return { ...item, ...summary }
  })
}

function buildAssets(): Asset[] {
  return [
    asset({
      id: ASSET_MF,
      goalId: GOAL_RETIREMENT,
      name: 'HDFC Flexi Cap',
      category: 'MF',
      source: 'GROWW',
      investmentType: 'SIP',
      investedAmount: 12_00_000_00,
      currentValue: 14_50_000_00,
      expectedCagr: 12,
      monthlyInvestment: 25_000_00,
      plannedInvestmentDay: 5,
      startDate: '2019-06-01',
      isActive: true,
    }),
    asset({
      id: ASSET_EPF,
      goalId: GOAL_RETIREMENT,
      name: 'EPF',
      category: 'OTHER',
      source: 'OTHER',
      investmentType: 'LUMP_SUM',
      investedAmount: 7_50_000_00,
      currentValue: 8_10_000_00,
      expectedCagr: 8,
      isActive: true,
    }),
    asset({
      id: ASSET_STOCKS,
      goalId: GOAL_EDUCATION,
      name: 'Equity Portfolio',
      category: 'STOCK',
      source: 'ZERODHA',
      investmentType: 'SIP',
      investedAmount: 5_00_000_00,
      currentValue: 6_20_000_00,
      expectedCagr: 14,
      monthlyInvestment: 15_000_00,
      plannedInvestmentDay: 10,
      startDate: '2020-03-01',
      isActive: true,
    }),
    asset({
      id: ASSET_CASH,
      goalId: GOAL_EMERGENCY,
      name: 'Savings Account',
      category: 'CASH',
      source: 'BANK',
      investmentType: 'LUMP_SUM',
      investedAmount: 2_00_000_00,
      currentValue: 2_00_000_00,
      isActive: true,
    }),
    asset({
      id: ASSET_VEHICLE,
      goalId: GOAL_HOME,
      name: 'Vehicle',
      category: 'OTHER',
      source: 'OTHER',
      investmentType: 'LUMP_SUM',
      investedAmount: 8_50_000_00,
      currentValue: 7_00_000_00,
      isActive: true,
    }),
    asset({
      id: ASSET_PROPERTY,
      goalId: GOAL_HOME,
      name: 'Residential Property',
      category: 'OTHER',
      source: 'OTHER',
      investmentType: 'LUMP_SUM',
      investedAmount: 45_00_000_00,
      currentValue: 23_00_000_00,
      isActive: true,
    }),
  ]
}

function buildLoans(): Loan[] {
  const originalAmount = 45_00_000_00
  const outstandingAmount = 18_00_000_00
  const totalPaid = originalAmount - outstandingAmount
  return [
    {
      id: LOAN_HOME,
      userId: DEMO_USER_ID,
      name: 'Home Loan',
      bank: 'HDFC Bank',
      originalAmount,
      outstandingAmount,
      totalPaid,
      progressPercentage: (totalPaid / originalAmount) * 100,
      interestRate: 8.5,
      tenureMonths: 240,
      startDate: '2020-04-01',
      emiAmount: 1_03_000_0,
      emiDate: 5,
      deductionBank: 'HDFC Bank',
      status: 'ACTIVE',
      purpose: 'Primary residence',
      isDeleted: false,
      createdAt: ts,
      updatedAt: ts,
    },
  ]
}

function buildTransactions(month: string): AssetTransaction[] {
  const today = todayIsoDate()
  const items: AssetTransaction[] = [
    {
      id: 'demo-tx-mf-sip',
      userId: DEMO_USER_ID,
      assetId: ASSET_MF,
      goalId: GOAL_RETIREMENT,
      type: 'INVESTMENT',
      amount: 25_000_00,
      date: `${month}-05`,
      month,
      note: 'Monthly SIP — HDFC Flexi Cap',
      isDeleted: false,
      createdAt: ts,
    },
    {
      id: 'demo-tx-stocks-sip',
      userId: DEMO_USER_ID,
      assetId: ASSET_STOCKS,
      goalId: GOAL_EDUCATION,
      type: 'INVESTMENT',
      amount: 15_000_00,
      date: `${month}-10`,
      month,
      note: 'Monthly SIP — Equity Portfolio',
      isDeleted: false,
      createdAt: ts,
    },
    {
      id: 'demo-tx-bonus',
      userId: DEMO_USER_ID,
      assetId: ASSET_MF,
      goalId: GOAL_RETIREMENT,
      type: 'INVESTMENT',
      amount: 50_000_00,
      date: today,
      month,
      note: 'Invested ₹50,000 in HDFC Flexi Cap',
      isDeleted: false,
      createdAt: ts,
    },
  ]

  for (let i = 1; i <= 12; i += 1) {
    const pastMonth = shiftMonth(month, -i)
    items.push({
      id: `demo-tx-history-mf-${i}`,
      userId: DEMO_USER_ID,
      assetId: ASSET_MF,
      goalId: GOAL_RETIREMENT,
      type: 'INVESTMENT',
      amount: 25_000_00,
      date: `${pastMonth}-05`,
      month: pastMonth,
      note: 'Monthly SIP',
      isDeleted: false,
      createdAt: ts,
    })
  }

  return items
}

function buildExpenses(month: string): Expense[] {
  const today = todayIsoDate()
  return [
    {
      id: 'demo-exp-groceries',
      userId: DEMO_USER_ID,
      amount: 8_500_00,
      category: 'Groceries',
      description: 'Weekly groceries',
      date: today,
      month,
      paymentSource: 'UPI',
      isDeleted: false,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'demo-exp-interiors',
      userId: DEMO_USER_ID,
      amount: 25_000_00,
      category: 'Home',
      description: 'Spent ₹25,000 on home interiors',
      date: today,
      month,
      paymentSource: 'UPI',
      isDeleted: false,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'demo-exp-transport',
      userId: DEMO_USER_ID,
      amount: 4_200_00,
      category: 'Transport',
      description: 'Fuel and cab',
      date: `${month}-12`,
      month,
      paymentSource: 'Credit Card',
      isDeleted: false,
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: 'demo-exp-utilities',
      userId: DEMO_USER_ID,
      amount: 3_800_00,
      category: 'Utilities',
      description: 'Electricity and internet',
      date: `${month}-08`,
      month,
      paymentSource: 'UPI',
      isDeleted: false,
      createdAt: ts,
      updatedAt: ts,
    },
  ]
}

function buildIncome(month: string): Income[] {
  const today = todayIsoDate()
  return [
    {
      id: 'demo-inc-salary',
      userId: DEMO_USER_ID,
      amount: 1_80_000_00,
      source: 'Salary',
      description: 'Monthly salary',
      date: `${month}-01`,
      month,
      isDeleted: false,
      createdAt: ts,
    },
    {
      id: 'demo-inc-bonus',
      userId: DEMO_USER_ID,
      amount: 2_00_000_00,
      source: 'Bonus',
      description: 'Received ₹2 lakh bonus',
      date: today,
      month,
      isDeleted: false,
      createdAt: ts,
    },
  ]
}

function buildLoanPayments(month: string): LoanPayment[] {
  return [
    {
      id: 'demo-loan-pay-1',
      userId: DEMO_USER_ID,
      loanId: LOAN_HOME,
      amount: 1_03_000_0,
      date: `${month}-05`,
      month,
      note: 'Home loan EMI',
      isDeleted: false,
      createdAt: ts,
    },
  ]
}

function buildMonthlySummary(month: string): MonthlySummary {
  return withFreeCashFlow({
    month,
    income: 3_80_000_00,
    expenses: 41_500_00,
    investments: 90_000_00,
    withdrawals: 0,
    loanPayments: 1_03_000_0,
    transactionCount: 8,
    updatedAt: ts,
  })
}

/** Realistic fictional dataset for Try Nirvana demo mode. Net worth ≈ ₹42.8L. */
export function createDemoFinanceState(): FinanceStateSlice {
  const month = currentMonthKey()
  const assets = buildAssets()
  const goals = buildGoals(assets)
  const loans = buildLoans()
  const currentMonthlySummary = buildMonthlySummary(month)

  return {
    goals,
    assets,
    loans,
    transactions: buildTransactions(month),
    loanPayments: buildLoanPayments(month),
    expenses: buildExpenses(month),
    income: buildIncome(month),
    recurringActivities: [],
    scheduledOccurrences: [],
    monthlySummaries: { [month]: currentMonthlySummary },
    currentMonthlySummary,
  }
}

export function demoNetWorthMinor(state: FinanceStateSlice): number {
  const assetsTotal = state.assets
    .filter((item) => !item.isDeleted && item.isActive)
    .reduce((sum, item) => sum + item.currentValue, 0)
  const liabilities = state.loans
    .filter((item) => !item.isDeleted && item.status === 'ACTIVE')
    .reduce((sum, item) => sum + item.outstandingAmount, 0)
  return assetsTotal - liabilities
}
