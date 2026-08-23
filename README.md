# Codex Wealth — Personal Wealth Creation & Budget Allocation Tracker

A **mobile-first PWA** for tracking personal wealth goals, investments, loans, and monthly cash flow. Built with React, TypeScript, Firebase, and Tailwind CSS.

> **My personal financial command center.**

---

## Features

- **Dashboard** — Net position, monthly cash flow, quick actions, goal & loan progress at a glance.
- **Wealth** — Create goals, add assets (MF, FD, RD, ETF, Stocks, Gold, PPF, NPS, Cash), track investments & withdrawals, view CAGR projections.
- **Loans** — Track loans, EMIs, outstanding balances, payments, and loan burden.
- **Cash Flow** — Monthly income vs expenses vs investments vs loans, with free cash flow.
- **Profile** — Google profile, country, currency, theme, data export.
- **PWA** — Installable, offline app shell, responsive mobile-first UI.

---

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Routing**: React Router 7
- **Styling**: Tailwind CSS 4
- **Components**: Custom UI + Vaul (bottom sheets)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod (validation schemas provided)
- **Dates**: date-fns
- **Backend**: Firebase Auth + Cloud Firestore
- **PWA**: vite-plugin-pwa
- **Testing**: Vitest + React Testing Library
- **Linting**: Oxlint / ESLint

---

## Local Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run dev server
npm run dev
```

---

## Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Enable **Authentication** → **Sign-in method** → **Google**.
3. Create a **Cloud Firestore** database (production mode).
4. Copy your Firebase web app config into `.env.local`:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_USE_FIREBASE_EMULATOR=false
```

**Important**: Firebase client config is **not a secret**. Security comes from Firestore security rules + Firebase Auth.

---

## Firestore Setup

### Deploy Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

### Deploy Indexes

```bash
firebase deploy --only firestore:indexes
```

**Indexes configured in `firestore.indexes.json`:**

- Goals: `status + targetDate`
- Assets: `goalId + isActive`
- Expenses: `date`
- Income: `date`
- Loans: `status`

---

## Firestore Data Model

```
users/{uid}
users/{uid}/profile/settings
users/{uid}/goals/{goalId}
users/{uid}/goals/{goalId}/assets/{assetId}
users/{uid}/goals/{goalId}/assets/{assetId}/transactions/{transactionId}
users/{uid}/loans/{loanId}
users/{uid}/loans/{loanId}/payments/{paymentId}
users/{uid}/expenses/{expenseId}
users/{uid}/income/{incomeId}
users/{uid}/monthlySnapshots/{YYYY-MM}
```

Every document is **user-rooted** and protected by Firestore security rules that verify `request.auth.uid == uid`.

---

## Firestore Security Rules

Rules are in `firestore.rules`. Key principles:

- Every document must be owned by the authenticated user.
- `allow read, write: if request.auth != null && request.auth.uid == uid`.
- No public access to any document.
- Field-level validation (e.g., amounts are valid integers, dates are valid strings).

**Never** allow:

```
allow read, write: if true;
```

---

## Environment Variables

| Variable                            | Description                           |
| ----------------------------------- | ------------------------------------- |
| `VITE_FIREBASE_API_KEY`             | Firebase API key                      |
| `VITE_FIREBASE_AUTH_DOMAIN`         | Firebase auth domain                  |
| `VITE_FIREBASE_PROJECT_ID`          | Firebase project ID                   |
| `VITE_FIREBASE_STORAGE_BUCKET`      | Storage bucket (can be empty for MVP) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID                             |
| `VITE_FIREBASE_APP_ID`              | App ID                                |
| `VITE_USE_FIREBASE_EMULATOR`        | `true` = use local Firebase emulator  |

---

## Firebase Emulator (Development)

Use the emulator suite to avoid touching production Firestore during development.

```bash
# Install Firebase CLI (once)
npm install -g firebase-tools

# Start emulators (Firestore + Auth UI at http://localhost:4000)
firebase emulators:start

# In another terminal, run the app against emulators
cp .env.example .env.local
# Set VITE_USE_FIREBASE_EMULATOR=true in .env.local
npm run dev
```

With emulators running, sign in with a test Google account or the Auth emulator's test users.

### Demo data

In development builds only, Profile → **Load demo data** seeds sample goals, assets, loans, income, and expenses into the signed-in account. This never runs automatically.

---

The PWA is configured in `vite.config.ts` using `vite-plugin-pwa`:

- Web app manifest (name, icons, theme color)
- Service worker (auto-update + cache static assets)
- Offline application shell
- Standalone display + portrait orientation

Icons are in `public/icons/`.

---

## Cloudflare Pages Deployment

### Option A — GitHub + Cloudflare Pages (recommended)

1. Push this repo to GitHub.
2. In Cloudflare Pages → Create project → Connect GitHub repo.
3. Build command: `npm run build`
4. Build output directory: `dist`
5. Environment variables: set the same `VITE_FIREBASE_*` variables.

### Option B — Direct upload (CLI)

```bash
npm run build
npx wrangler pages deploy dist
```

---

## Production Build

```bash
npm run build
```

This runs TypeScript type-checking then Vite production build with PWA generation.

---

## Testing

```bash
# Run once
npm test

# Watch mode
npm run test:watch
```

### Covered calculations

- CAGR (lump sum, monthly SIP, required contribution)
- Goal progress (zero/partial/complete/over-target)
- Loan progress (zero/full/partial)
- Cash flow (income, expenses, investments, withdrawals, loans)
- Financial health labels
- Goal projection (current value, on-track detection, withdrawals)

---

## Architecture

```
Component
   ↓
Hook (context)
   ↓
Service (Firestore access)
   ↓
Firestore
```

Calculations:

```
Component
   ↓
Hook
   ↓
Calculation utility (pure functions)
```

This separation keeps UI clean, calculations testable, and data access centralized.

---

## Currency Handling

- All values stored as integers representing **minor units** (paise/cents).
- Formatting happens only at the UI layer via `Intl.NumberFormat`.
- Supported currencies: INR, USD, EUR, GBP, SGD, AED.
- Indian formatting uses ₹ L / ₹ Cr compact notation.

---

## Free-Tier Considerations

- **Cloudflare Pages Free** — unlimited static sites.
- **Firebase Spark (no-cost)** — 50K reads, 20K writes per day.
- **GitHub Free** — private repos.
- **Total infrastructure cost: ₹0/month**.

App design following these constraints:

- Fetch on page load, local state, explicit refresh.
- No unnecessary realtime listeners.
- Batched operations avoided where not needed (personal dataset sizes are small).
- Client-side calculations for small personal data.

---

## License

MIT
