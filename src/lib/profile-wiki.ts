export interface WikiTerm {
  term: string
  definition: string
}

export interface WikiGuideStep {
  title: string
  body: string
}

export const WIKI_TERMINOLOGY: WikiTerm[] = [
  {
    term: 'Goal',
    definition:
      'A savings target you are working toward — retirement, a home, education, or a big purchase. Goals hold one or more assets and show progress over time.',
  },
  {
    term: 'Asset',
    definition:
      'Money invested or saved toward a goal: mutual funds, RDs, FDs, stocks, gold, and more. Each asset tracks balance, contributions, and withdrawals.',
  },
  {
    term: 'Income',
    definition:
      'Money coming in — salary, bonus, freelance payments, rent received, and similar. Income feeds your cash flow and available surplus.',
  },
  {
    term: 'Expense',
    definition:
      'Money spent on goods, services, or bills. Expenses reduce cash flow but are separate from withdrawing from an investment.',
  },
  {
    term: 'Loan',
    definition:
      'Borrowed money with an outstanding balance. Add principal, EMI, rate, and tenure so Nirvana can track repayment and include EMIs in cash flow.',
  },
  {
    term: 'EMI',
    definition:
      'Equated Monthly Installment — a fixed payment toward a loan. Record each EMI when you pay it; Nirvana reduces the outstanding balance.',
  },
  {
    term: 'Withdrawal',
    definition:
      'Taking money out of an asset or goal (redemption). This is not the same as spending — redeem first, then record an expense if you actually spent the money.',
  },
  {
    term: 'SIP / Recurring investment',
    definition:
      'A scheduled monthly (or periodic) investment into an asset. When it is due, Nirvana asks you to confirm it happened via Notifications.',
  },
  {
    term: 'Cash flow',
    definition:
      'Income minus expenses and EMIs for a period. The Dashboard month view shows whether you are living within your means.',
  },
  {
    term: 'Net worth',
    definition:
      'Total assets minus outstanding loans. Wealth and Dashboard summaries help you see how your position changes over time.',
  },
]

export const WIKI_GUIDE: WikiGuideStep[] = [
  {
    title: 'Start on the Dashboard',
    body:
      'The Dashboard is your financial home. See monthly cash flow, net worth, goals at a glance, and switch to Notifications when something is due.',
  },
  {
    title: 'Use the command bar',
    body:
      'Type naturally at the top of the screen — “Spent 2,400 on groceries”, “Salary 2.8L today”, or “Invest 10k every month in retirement”. Nirvana parses your sentence and asks you to confirm before saving.',
  },
  {
    title: 'Tap + for guided entry',
    body:
      'The floating + button opens forms for expense, income, investment, withdrawal, loan payment, new loan, or new goal. Use it when you prefer step-by-step fields over typing.',
  },
  {
    title: 'Build wealth with goals',
    body:
      'Open Wealth to create goals and attach assets. Set a target amount, add SIPs, and track progress. One goal can have multiple assets (e.g. mutual fund + RD).',
  },
  {
    title: 'Track loans',
    body:
      'Add each loan with EMI and tenure. Pay EMIs from the + menu or command bar. Outstanding balance updates as you record payments.',
  },
  {
    title: 'Confirm notifications',
    body:
      'Scheduled SIPs and other recurring items appear under Notifications. Confirm or skip each one — Nirvana does not auto-record them.',
  },
  {
    title: 'Adjust preferences here',
    body:
      'Set country, currency, and appearance under Preferences. Export or clear your data from the Your data section in the sidebar.',
  },
]
