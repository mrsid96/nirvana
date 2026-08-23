export const paths = {
  user: (uid: string) => `users/${uid}`,
  settings: (uid: string) => `users/${uid}/profile/settings`,
  goals: (uid: string) => `users/${uid}/goals`,
  goal: (uid: string, goalId: string) => `users/${uid}/goals/${goalId}`,
  assets: (uid: string, goalId: string) => `users/${uid}/goals/${goalId}/assets`,
  asset: (uid: string, goalId: string, assetId: string) =>
    `users/${uid}/goals/${goalId}/assets/${assetId}`,
  transactions: (uid: string, goalId: string, assetId: string) =>
    `users/${uid}/goals/${goalId}/assets/${assetId}/transactions`,
  transaction: (uid: string, goalId: string, assetId: string, txId: string) =>
    `users/${uid}/goals/${goalId}/assets/${assetId}/transactions/${txId}`,
  loans: (uid: string) => `users/${uid}/loans`,
  loan: (uid: string, loanId: string) => `users/${uid}/loans/${loanId}`,
  loanPayments: (uid: string, loanId: string) => `users/${uid}/loans/${loanId}/payments`,
  expenses: (uid: string) => `users/${uid}/expenses`,
  income: (uid: string) => `users/${uid}/income`,
}
