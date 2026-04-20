## SmartBudget

React + Vite app for personal budgeting: sign-in (Back4App / Parse), a dashboard with charts, **monthly budgets by category**, **manual expense logging**, **CSV transaction import** from real bank exports, **savings goals**, and a **mock bank link** that imports fake accounts and transactions.

### Features

- **Auth** — Register and sign in with email/password via Parse (Back4App). Without `.env` keys, the app will not show a session (see Setup).
- **Dashboard** — Spending trends (mock monthly data), category donut, bar comparison, recent activity, and a savings snapshot.
- **Budgets** — Set per-category caps by calendar month; compare to spending from bank + manual entries.
- **Budget alerts** — In-app notifications when any category with a cap reaches **80%** of its budget or goes **over** for the selected budget month; dismiss per category (stored locally) with reminders returning if spending cools off then crosses the threshold again.
- **Transactions** — **Import a bank CSV** (map date, description, amount, optional category) into your ledger; add manual expenses; combine with mock bank rows when connected. Manual and CSV rows can be removed from the ledger. **Recurring bills / subscriptions**: mark a manual or CSV expense as recurring (weekly, monthly, or yearly), set next due date and optional end date, and use **Upcoming bills & subscriptions** to see projected cash outflows for the next 45 days.
- **Goals** — Create savings goals, edit saved amount and target, remove goals. Defaults seed on first load when no saved data exists.
- **Accounts** — View linked mock accounts when “connected,” or connect from the dashboard / accounts screen.
- **Persistence** — Budgets, **persisted transactions** (manual + CSV), goals, and **whether the mock bank is connected** are stored in the **`UserFinance`** Parse class (per user, with row-level ACLs). The same data is mirrored in **`localStorage`** as a cache and for offline-tolerant saves if the cloud write fails. If you used the app before cloud sync existed, local-only data is **migrated** to Back4App on next login when possible. Legacy `manualExpenses` on Parse is still written as a mirror of manual-only rows for older documents.
- **Household budgets** — Create a shared household from **Household** in the sidebar, send an invite (email + secret code), and have your partner **request access** with that code. A household **admin** approves join requests in the app; no Back4App Cloud Code is required. Use the **Budget data** selector on the dashboard to switch between **Personal** and a household; budget-alert dismissals are scoped per data source. Shared data lives in **`HouseholdFinance`** with row ACLs (user pointers). Optional **`cloud/household-main.js`** exists for a Cloud Code + Parse Role workflow if you prefer to deploy it.

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

On first save, the app creates (or updates) a **`UserFinance`** row for the signed-in user with fields such as `budgets`, `transactions` (manual + CSV imports), `manualExpenses` (legacy mirror of manual-only rows), `goals`, and `bankConnected`. If saves fail with permission errors, open the Back4App **Database** → **UserFinance** → **Class Level Permissions** and allow authenticated users to **Create**, **Find**, **Get**, and **Update** (each object still has an ACL restricted to that user). See comments in `.env.example` for the same hint.

### Household budgets (Back4App, no Cloud Code)

The app uses the Parse JavaScript SDK only (`src/services/householdParseClient.js`). Create these classes in the **Database** (or let the first save create them): **`Household`**, **`HouseholdFinance`**, **`HouseholdMember`**, **`HouseholdInvite`**, **`HouseholdJoinRequest`**. Invites store **`householdCreator`**, **`householdNameSnapshot`**, **`notifyAdmins`** (pointers), and **`notifyAdminIds`** (array of user id strings). Join requests copy **`notifyAdminIds`** and grant each id **read and write** on the row (admins must be able to set `status` to approved/rejected). **`householdNameSnapshot`** on invites/requests helps display names. **`HouseholdMember`** rows store **`householdNameSnapshot`** because partners usually cannot read the **`Household`** row (creator-only ACL), so the included pointer has no `name` field.

1. **Class Level Permissions** — For each class, allow **authenticated** users to **Create**, **Find**, **Get**, and **Update** as needed (same idea as **`UserFinance`**). Row **ACLs** restrict who can read/write each object. If a save fails with a permissions error, enable the missing operation on that class.

2. **Flow** — An **admin** creates a household and **Create invite** with the partner’s email. The UI shows an **Invite ID** and **code** to share out of band. The partner enters both under **Accept an invite** → **Request access**. The admin sees the row under **Join requests (admins)** and clicks **Approve** (which adds the partner to the **`HouseholdFinance`** ACL and creates a **`HouseholdMember`** row).

3. **Optional Cloud Code** — The file **`cloud/household-main.js`** is an alternate implementation using Parse **Roles** and Cloud Functions. The current app does **not** call those functions; use it only if you switch the client back to `Parse.Cloud.run` or maintain a fork.

4. **Privacy note** — **`HouseholdInvite`** rows use **public read** on the object so the partner can load the invite by ID to verify the code. Treat the **Invite ID** like a secret link; invite codes are random.

5. **Admin / `role` column** — Membership uses **`householdRole`** (`admin` | `member`) and mirrors **`role`** for compatibility. The app treats the **`Household.createdBy`** user as an admin even if the member row was saved incorrectly, and repairs creator rows on load when possible.

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
