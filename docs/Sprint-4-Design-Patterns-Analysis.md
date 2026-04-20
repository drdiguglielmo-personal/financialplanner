# Sprint 4 — Design Patterns Analysis (SmartBudget)

## Course expectation

For Sprint 4, in addition to the **feature user stories**, you will perform an **analysis of where design patterns could be applied** to your system.

- **You do not have to implement** the patterns in code.
- **You do need to identify** architectural or structural places where a named pattern would be a reasonable fit, and briefly justify why.

The sections below document **this project’s** current architecture and where standard patterns already appear in spirit, or where a deliberate application of a pattern would clarify or extend the design.

---

## How this analysis was done

1. **Boundaries reviewed:** UI (`src/components/`), domain utilities (`src/utils/`), persistence (`financeSync.js`, `householdFinanceSync.js`), Parse client (`parseClient.js`, `householdParseClient.js`), and integrations (`bankProvider/`, webhooks).
2. For each seam, patterns are named from common references (GoF and widely used architectural patterns).
3. **“Already approximated”** means the codebase already follows the intent without necessarily using the pattern’s classical class structure.

---

## 1. System map

| Layer / module | Responsibility | Primary paths |
| ---------------- | -------------- | --------------- |
| UI (React) | Screens, forms, charts, orchestration of services | `src/components/` |
| Finance domain | Pure transforms: budgets, spending, CSV parsing, export | `src/services/userFinance.js`, `src/utils/finance.js`, `src/utils/csvImport.js`, `src/utils/exportReports.js` |
| Persistence / sync | Local vs cloud finance bundles; household bundles | `src/services/financeSync.js`, `src/services/householdFinanceSync.js`, `src/services/financeRemote.js`, `src/services/householdFinanceRemote.js` |
| Backend client | Parse initialization; household ACLs and invite/join flow | `src/services/parseClient.js`, `src/services/householdParseClient.js`, `src/services/householdCloud.js` |
| Integrations | Pluggable bank API; outbound overspend webhooks | `src/services/bankProvider/`, `src/services/overspendEmailWebhook.js`, `src/services/overspendNotify.js` |

---

## 2. Candidate locations for patterns (completed for SmartBudget)

| # | Location in codebase | Problem or tension | Candidate pattern(s) | Fit (why here?) | If applied more formally: main benefit | If applied more formally: main risk or cost |
| - | -------------------- | ------------------ | -------------------- | --------------- | ---------------------------------------- | ------------------------------------------- |
| 1 | `src/services/bankProvider/index.js`, `mockBankProvider.js`, `plaidBankProvider.js` | UI and `Dashboard` should not depend on one concrete bank implementation. | **Strategy** (interchangeable algorithms); **Simple Factory** (`getDefaultBankProvider`) | Same `connect` / account surface, different backends (mock vs future Plaid). | Swap implementations via config or env without touching React components. | Extra interfaces and wiring; must keep provider API stable. |
| 2 | `src/services/householdCloud.js` → `householdParseClient.js` | UI and panels should not know about dozens of Parse calls and error shaping. | **Facade** | `householdCloud` exposes a small set of functions (`cloudHouseholdCreate`, `cloudHouseholdInvite`, …) and hides Parse SDK details. | **Already approximated:** stable API for `HouseholdPanel` and tests. | Renaming or splitting facades if the surface grows too large. |
| 3 | `src/services/householdParseClient.js` | External shapes (invite rows, ACL rules, denormalized fields) differ from what the UI needs. | **Adapter** (data); parts of **Chain of Responsibility** (multi-step approve/reject) | Normalizes Back4App/Parse quirks (`householdNameSnapshot`, `notifyAdminIds`) into predictable outcomes for the UI. | Clearer “anti-corruption” layer if Parse schema changes. | Large file; full Adapter split could over-fragment for a course-sized app. |
| 4 | `src/utils/csvImport.js` + CSV mapping UI | Bank CSV columns are arbitrary; the app uses a fixed transaction model. | **Adapter** | Maps arbitrary column headers and string rows into internal `{ amount, date, category, … }` structures. | Easier to add new bank presets or column aliases. | More mapping tables to maintain. |
| 5 | `src/services/financeSync.js` / `householdFinanceSync.js` | Two storage strategies: local-only vs Back4App; personal vs household targets. | **Strategy** or **Template Method** | Load/save paths branch on configuration and target; shared steps are “load → normalize → cache locally.” | **Template Method** could extract common sequencing with overrides for personal vs household. **Strategy** could swap `StorageBackend` implementations for testing. | Abstraction overhead if only two branches ever exist (YAGNI). |
| 6 | `src/services/parseClient.js` | One Parse app configuration for the whole SPA. | **Singleton** (process-wide) | Module initializes `Parse` once when env vars exist. | **Already approximated:** single initialization point. | Global state complicates multi-tenant or multi-app tests unless mocked. |
| 7 | `src/services/overspendEmailWebhook.js` | Overspend handling should not hard-code email; external automation receives JSON. | **Bridge** or **Adapter** (integration boundary) | Decouples “alert fired” from “how email is sent” (Zapier/Make/IFTTT). | Swap providers without changing `overspendNotify.js` beyond URL/config. | Depends on third-party uptime and CORS/network policies for `fetch`. |
| 8 | `src/components/Dashboard.jsx` | Many subsystems: auth, finance load, bank connect, alerts, household scope. | **Mediator** (conceptual) | Dashboard coordinates child panels and services; a stricter Mediator would centralize all cross-panel events. | Could reduce prop drilling and scattered `useEffect` chains if the app grew. | For current size, a formal Mediator may be heavier than composition + hooks. |

---

## 3. Cross-cutting principles (brief)

| Principle | Where it shows up in SmartBudget | Notes |
| --------- | -------------------------------- | ----- |
| **Single Responsibility** | `userFinance.js` applies mutations; `financeSync.js` handles persistence concerns; charts stay presentational. | Keeps domain rules testable without React. |
| **Open/Closed** | New bank providers implement the same provider interface; export formats extend via `exportReports.js` without changing chart code. | Adding Plaid means new class, not editing every caller if the interface stays fixed. |
| **Dependency Inversion** | UI depends on `getDefaultBankProvider()` and named service functions, not on Parse internals; tests mock `householdCloud` and sync. | Higher-level modules depend on abstractions (service facades), not low-level Parse details in components. |
| **DRY** | Budget alert math in `utils/budgetAlerts.js`; shared money formatting in `formatMoney.js`; bundle normalization in `userFinance.js`. | Avoids duplicating thresholds and date logic across panels. |

---

## 4. Summary (for your report)

**Patterns most likely to add value without a large rewrite**

- **Strategy** for `bankProvider`: already structured; formalizing the interface and switching on env would make Plaid integration a contained change.
- **Template Method** (or a small `FinanceStorage` interface) across `financeSync` / `householdFinanceSync`: would document the shared load/normalize/persist pipeline and simplify tests.

**Patterns already approximated in the current design**

- **Facade:** `householdCloud.js` over `householdParseClient.js`.
- **Singleton:** Parse client initialization in `parseClient.js`.
- **Adapter:** CSV import and household/client normalization of Parse fields.

**Patterns to defer (YAGNI) and why**

- **Full Mediator** for Dashboard: coordination is manageable with hooks; introduce only if cross-panel coupling grows.
- **Command** with undo/redo for every finance action: high implementation cost for a budgeting MVP unless the product explicitly requires undo history.
- **Event Sourcing / CQRS:** disproportionate for a client-heavy Parse app unless reporting and audit become core requirements.

---
