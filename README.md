## SmartBudget

React + Vite app for personal budgeting: sign-in (Back4App / Parse), a dashboard with charts, **monthly budgets by category**, **manual expense logging**, **savings goals**, and a **mock bank link** that imports fake accounts and transactions.

### Features

- **Auth** — Register and sign in with email/password via Parse (Back4App). Without `.env` keys, the app will not show a session (see Setup).
- **Dashboard** — Spending trends (mock monthly data), category donut, bar comparison, recent activity, and a savings snapshot.
- **Budgets** — Set per-category caps by calendar month; compare to spending from bank + manual entries.
- **Transactions** — Add manual expenses (description, amount, category, date); combined with imported bank rows. Manual rows can be removed.
- **Goals** — Create savings goals, edit saved amount and target, remove goals. Defaults seed on first load when no saved data exists.
- **Accounts** — View linked mock accounts when “connected,” or connect from the dashboard / accounts screen.
- **Persistence** — Budgets, manual expenses, goals, and **whether the mock bank is connected** are stored in the **`UserFinance`** Parse class (per user, with row-level ACLs). The same data is mirrored in **`localStorage`** as a cache and for offline-tolerant saves if the cloud write fails. If you used the app before cloud sync existed, local-only data is **migrated** to Back4App on next login when possible.

### Prerequisites

- Node.js + npm

### Setup

Install dependencies:

```bash
npm install
```

Create your environment file (Back4App / Parse keys):

```bash
cp .env.example .env
```

Edit `.env` and set:

- `VITE_BACK4APP_APP_ID`
- `VITE_BACK4APP_JS_KEY`

Optional: `VITE_BACK4APP_SERVER_URL` if you use a custom Parse API URL (default is Back4App’s host).

### Back4App database

On first save, the app creates (or updates) a **`UserFinance`** row for the signed-in user with fields such as `budgets`, `manualExpenses`, `goals`, and `bankConnected`. If saves fail with permission errors, open the Back4App **Database** → **UserFinance** → **Class Level Permissions** and allow authenticated users to **Create**, **Find**, **Get**, and **Update** (each object still has an ACL restricted to that user). See comments in `.env.example` for the same hint.

### Run the app (development)

```bash
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### Tests

Run the full suite once:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Tests cover finance helpers, local/cloud finance sync (with mocks), mock bank data, **`UserFinance`**-style persistence helpers, and **`Dashboard`** smoke tests (jsdom + Testing Library).

### Sprint 2 — code smells addressed (refactors)

- **Repeated `persistFinance` payloads** — `Dashboard` now uses a single `useCallback` **`persist(overrides)`** so handlers only pass what changed; fewer stale-field mistakes and less duplication.
- **Nested ternary for page titles** — Replaced with **`secondaryPageTitle(navId)`** and **`NAV` / `NAV_ITEMS`** in `src/constants/navigation.js` so nav ids are not stringly scattered.
- **Duplicated transaction row markup** — **`TransactionListItem`** centralizes icon, category badge, ledger amount formatting, and optional date/delete; used by the dashboard preview list and **`TransactionsPanel`**.
- **Inconsistent money strings** — **`formatUsd`** / **`formatLedgerAmount`** in `src/utils/formatMoney.js` (with tests) keep stat cards and amounts aligned.
- **Duplicated default finance shape** — **`createDefaultFinanceBundle()`** in `userFinance.js` is the single factory for “new user / no remote row”; **`financeSync`** uses it instead of inline literals.
- **Copy drift** — Transactions subtitle no longer claims data is “only on this device” (it syncs to Back4App when configured).

### Build / preview production

```bash
npm run build
npm run preview
```

### Troubleshooting

- `.env` is gitignored; keys are not committed.
- If you see “Back4App is not configured” or auth never loads, restart the dev server after changing `.env` (Vite reads env at build time).
- Parse may log a warning if the wrong SDK entry is used in Node-only scripts; the app targets the browser bundle for Vite.
