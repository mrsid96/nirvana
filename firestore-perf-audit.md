# Firestore Performance Audit (Pre-Optimization Baseline)

Audit traced from actual code paths as of the performance hardening work.

## Operation Summary Table

| Operation | Before (Reads) | Before (Writes) | Sequential? | After (Reads) | After (Writes) | Target |
|-----------|----------------|-----------------|-------------|---------------|----------------|--------|
| Dashboard Load | 8–30+ | 0–N (migration/sync) | Yes (migration → core → activity) | **6** | 0 | ≤7 reads |
| Create Goal | 1 | 1 | write → **full refresh (~8+ reads)** | **0** | **1** | 1 write, no refresh |
| Create Loan | 1 | 1 | write → **full refresh** | **0** | **1** | 1 write, no refresh |
| Create Asset | 1–N | 2–3 | query goal assets + refresh | 0–1 | 2 | minimal writes |
| Add Investment | 1+N | 1 txn (4+ docs) | pre-query siblings → txn → **full refresh** | **0** | **1 txn** | 1 txn, no refresh |
| Add Withdrawal | same | same | same | **0** | **1 txn** | 1 txn, no refresh |
| Record Loan Payment | 0 | 1 txn | txn → **full refresh** | **0** | **1 txn** | 1 txn, no refresh |
| Add Expense | 1 | 2 | write + read summary + write | **0** | **1 txn** | 1 write/batch |
| Add Income | 1 | 2 | write + read summary + write | **0** | **1 txn** | 1 write/batch |
| Goal Detail | 2 | 0 | parallel | 2 | 0 | on-demand |
| Loan Detail | 1 | 0 | single query | 1 | 0 | on-demand |
| Statement Month | 5 | 0 | parallel | 5 | 0 | on-demand |
| Wealth History (deferred) | 1 query | 0 | on mount | 1 query | 0 | deferred |

## Root Causes Identified

1. **`FinanceContext.run()` and mutation handlers called `refresh({ silent: true })`** after every edit/delete — reloading goals, assets, loans, occurrences, recurring rules, monthly summary, recent transactions, and loan payments.
2. **Dashboard `refresh()` waterfall**: migration (1+ reads) → `loadCoreFinanceData` (6) → `loadRecentTransactions` + `loadRecentLoanPayments` (2), sequential between phases.
3. **`visibilitychange` triggered full refresh** on every tab focus.
4. **`listDocuments` on goals/loans/recurringRules** without `isDeleted` server filter — full collection scans + client filter.
5. **`ensureWealthHistory` on Dashboard mount** loaded 13 months of transactions immediately.
6. **`createTransaction` pre-query** for sibling assets before transaction (avoidable from local state).
7. **`createExpense` / `createIncome`** used separate read-before-write for monthly summary.
8. **`syncScheduledOccurrences` on every dashboard load** caused background writes.
9. **`rebuildDerivedData`** only in dev Profile — not in normal user flows ✓

## Dashboard Call Graph (Before)

```
refresh()
  → migrateFirestoreV1() [1 read if v2, many if migrating]
  → loadCoreFinanceData() [6 parallel reads]
  → loadRecentTransactions() [1 read]
  → loadRecentLoanPayments() [1 read]  ← removed from dashboard
  → syncScheduledOccurrences() [background writes]
```

## Dashboard Call Graph (After)

```
runFirestoreOperation('Dashboard Load')
  → migrateFirestoreV1() [only if profile.schemaVersion < 2]
  → loadDashboardData() [6 parallel reads]
      goals (notDeleted)
      assets (notDeleted)
      loans (notDeleted)
      scheduledOccurrences (status in, limit 50)
      monthlySummary (single doc)
      recent transactions (limit 10)
  → background: loadRecurringActivities + sync occurrences
```

## Mutation Call Graph (After)

```
write → patch local React state (no refresh)
```

## Listeners

- **`onSnapshot`**: NOT FOUND — no duplicate listener issue.
- **No full collection loads on dashboard** for expenses, income, all transactions, all loan payments, or all monthly summaries.

## Performance Logging

Development-only logging via `src/firebase/performance.ts` instruments all reads/writes through `src/firebase/firestore.ts`.

Example output:

```
[Firestore]
Operation: Dashboard Load
Reads: 6
Writes: 0
Parallel batches: 1
Duration: 420ms
```
