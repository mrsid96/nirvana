import { todayIsoDate } from '@/lib/formatters/dates'
import {
  createAsset,
  createExpense,
  createGoal,
  createIncome,
  createLoan,
  createTransaction,
} from '@/services/financeService'

/** Development-only sample dataset. Never call automatically in production. */
export async function seedDemoData(uid: string): Promise<void> {
  const today = todayIsoDate()
  const month = today.slice(0, 7)

  const retirementId = await createGoal(uid, {
    name: 'Retirement',
    description: 'Long-term retirement corpus',
    targetAmount: 50_000_000_00,
    startDate: today,
    targetDate: '2045-01-01',
    priority: 'high',
    status: 'active',
  })

  const emergencyId = await createGoal(uid, {
    name: 'Emergency Fund',
    targetAmount: 10_000_000_00,
    startDate: today,
    targetDate: '2028-01-01',
    priority: 'high',
    status: 'active',
  })

  const educationId = await createGoal(uid, {
    name: 'Child Education',
    targetAmount: 25_000_000_00,
    startDate: today,
    targetDate: '2035-06-01',
    priority: 'medium',
    status: 'active',
  })

  const mfId = await createAsset(uid, {
    goalId: retirementId,
    name: 'Nippon Small Cap',
    category: 'MF',
    source: 'GROWW',
    investmentType: 'SIP',
    investedAmount: 1_500_000_00,
    currentValue: 1_850_000_00,
    totalWithdrawals: 0,
    expectedCagr: 12,
    monthlyInvestment: 50_000_00,
    plannedInvestmentDay: 5,
    startDate: today,
    isActive: true,
  })

  await createAsset(uid, {
    goalId: emergencyId,
    name: 'HDFC FD',
    category: 'FD',
    source: 'BANK',
    investmentType: 'LUMP_SUM',
    investedAmount: 800_000_00,
    currentValue: 820_000_00,
    totalWithdrawals: 0,
    expectedCagr: 7,
    isActive: true,
  })

  await createAsset(uid, {
    goalId: educationId,
    name: 'Nifty 50 ETF',
    category: 'ETF',
    source: 'ZERODHA',
    investmentType: 'SIP',
    investedAmount: 600_000_00,
    currentValue: 720_000_00,
    totalWithdrawals: 50_000_00,
    expectedCagr: 11,
    monthlyInvestment: 25_000_00,
    plannedInvestmentDay: 10,
    startDate: today,
    isActive: true,
  })

  const mfAsset = {
    id: mfId,
    goalId: retirementId,
    name: 'Nippon Small Cap',
    category: 'MF' as const,
    source: 'GROWW' as const,
    investmentType: 'SIP' as const,
    investedAmount: 1_500_000_00,
    currentValue: 1_850_000_00,
    totalWithdrawals: 0,
    isActive: true,
    isDeleted: false,
    createdAt: today,
    updatedAt: today,
  }

  await createTransaction(
    uid,
    {
      assetId: mfId,
      goalId: retirementId,
      type: 'INVESTMENT',
      amount: 50_000_00,
      date: today,
      note: 'Monthly SIP',
    },
    mfAsset,
  )

  await createLoan(uid, {
    name: 'Home Loan',
    bank: 'HDFC Bank',
    originalAmount: 80_000_000_00,
    outstandingAmount: 68_400_000_00,
    interestRate: 7.4,
    tenureMonths: 240,
    startDate: '2020-04-01',
    emiAmount: 1_030_000_0,
    emiDate: 5,
    deductionBank: 'HDFC Bank',
    status: 'ACTIVE',
    purpose: 'Primary residence',
  })

  await createLoan(uid, {
    name: 'Personal Loan',
    bank: 'ICICI Bank',
    originalAmount: 5_000_000_00,
    outstandingAmount: 2_100_000_00,
    interestRate: 11.5,
    tenureMonths: 48,
    startDate: '2024-01-01',
    emiAmount: 130_000_0,
    emiDate: 12,
    deductionBank: 'ICICI Bank',
    status: 'ACTIVE',
  })

  await createExpense(uid, {
    amount: 2_500_00,
    category: 'Groceries',
    description: 'Weekly groceries',
    date: today,
    paymentSource: 'UPI',
  })

  await createExpense(uid, {
    amount: 1_800_00,
    category: 'Transport',
    description: 'Fuel',
    date: today,
    paymentSource: 'Credit Card',
  })

  await createExpense(uid, {
    amount: 4_500_00,
    category: 'Food',
    description: 'Dining out',
    date: today,
    paymentSource: 'UPI',
  })

  await createIncome(uid, {
    amount: 4_000_000_00,
    source: 'Salary',
    description: `Pay for ${month}`,
    date: `${month}-01`,
  })

  await createIncome(uid, {
    amount: 50_000_00,
    source: 'Interest',
    description: 'FD interest',
    date: today,
  })
}
