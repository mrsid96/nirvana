export interface FaqItem {
  question: string
  answer: string
}

export const PROFILE_FAQ: FaqItem[] = [
  {
    question: 'What is Nirvana?',
    answer:
      'Nirvana is a personal finance tracker for goals, investments, loans, income, and spending. It helps you see cash flow, net worth, and progress toward what matters to you.',
  },
  {
    question: 'How do I add an expense or income?',
    answer:
      'Tap the + button on the Dashboard or use the command bar at the top. You can type naturally — for example, “Spent 500 on groceries” or “Salary 1.5L per month”.',
  },
  {
    question: 'How do goals and assets work?',
    answer:
      'A goal is something you are saving for (retirement, a house, education). Assets are the investments or savings working toward that goal — mutual funds, RDs, FDs, and more. One goal can have multiple assets.',
  },
  {
    question: 'How do loans and EMIs work?',
    answer:
      'Add a loan with its amount, EMI, and tenure. Nirvana tracks outstanding balance and includes EMIs in your monthly cash flow. When you pay an EMI, record it as a loan payment.',
  },
  {
    question: 'What are notifications for?',
    answer:
      'Notifications remind you about scheduled investments, EMIs, and other recurring activities. When something is due, confirm whether it actually happened — Nirvana does not assume it went through automatically.',
  },
  {
    question: 'Can I withdraw without recording an expense?',
    answer:
      'Yes. Withdrawing from an investment is separate from spending. If you redeem money and then spend it, record both — a withdrawal from the asset and an expense for what you bought.',
  },
  {
    question: 'Is my data private?',
    answer:
      'Your data stays in your account. You can export everything as JSON from Your profile → Your data. Clearing financial data removes records from your account permanently.',
  },
  {
    question: 'Is this financial advice?',
    answer:
      'No. Nirvana is a tracking and planning tool. Projections and summaries are estimates based on what you enter — they are not guaranteed returns or professional financial advice.',
  },
]
