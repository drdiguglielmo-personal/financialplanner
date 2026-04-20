# Function Point Analysis (FPA) — SmartBudget

**Application boundary:** The SmartBudget web client (React + Vite) plus its persistence layer (Back4App / Parse, `localStorage` cache). The analysis treats **elementary processes** users trigger and **logical files** the application maintains or references across the Sprint 3–era feature set (personal + household budgets, CSV import, alerts, recurring bills, mock bank, household sharing without Cloud Code).

**IFP note:** Counts are **estimates** based on IFP definitions (EI / EO / EQ / ILF / EIF). Different certified counters can reasonably disagree ±15–25% on boundaries (e.g., merging vs splitting household flows).

---

## Step 1 — Count components and assign complexity

### Reasoning for complexity (Low / Average / High)

| IFP type | Meaning here | How we judged complexity |
|----------|----------------|---------------------------|
| **EI** | Data enters the boundary and **updates** an ILF (submit, import, approve). | **DET/RET:** number of user-supplied fields and logical record types touched (e.g., CSV mapping = many DETs → **High**). |
| **EO** | Data sent **out** with **derived** values (calculations, aggregations beyond simple retrieve). | Charts, month-over-month %, alert levels use formulas → **Avg–High**. |
| **EQ** | Input produces **output** with **no** (or minimal) derived processing—mostly retrieval/listing. | Filtered lists, read-only panels. |
| **ILF** | Logical group of data **maintained inside** the application boundary. | Parse classes / bundles the app owns and writes. |
| **EIF** | Logical file **maintained outside** the boundary but **referenced** read/write from our side. | External provider or system of record we do not define (used sparingly). |

---

### Component inventory (counts × complexity)

#### External Inputs (EI)

| ID | Elementary process | Complexity | Rationale |
|----|-------------------|------------|-----------|
| EI-1 | Register / sign in | **Average** | Email, password, name—moderate DETs; updates user ILF. |
| EI-2 | Save monthly **budgets** (per-category caps) | **Average** | Structured caps per month; updates personal finance ILF. |
| EI-3 | Add **manual** expense / remove ledger row | **Average** | Amount, date, category, source; updates transactions in ILF. |
| EI-4 | **CSV import** (map columns, preview, commit, dedupe) | **High** | Many DETs (date, description, amount, category), validation rules, file handling. |
| EI-5 | **Goals** create / update / remove | **Average** | Few fields; updates goals on ILF. |
| EI-6 | **Mock bank** connect + persist `bankConnected` | **Low** | Single effective toggle + side effects; small DET count. |
| EI-7 | **Dismiss** budget alert (per category / scope) | **Low** | Small payload; updates local dismissal store tied to scope. |
| EI-8 | **Household** create | **Average** | Name; creates household-related ILFs. |
| EI-9 | **Invite** partner (email, role) | **Average** | Multiple fields + invite record. |
| EI-10 | **Request access** (invite id + code) | **Average** | Join request creation. |
| EI-11 | **Approve** join request | **Average** | Updates membership + finance ACL + request status. |
| EI-12 | **Reject** join request | **Low** | Status update only. |
| EI-13 | **Leave** household | **Low** | Membership + ACL cleanup. |
| EI-14 | **Recurring** metadata on transaction | **Average** | Cadence, dates—updates transaction records. |

**EI summary**

| Complexity | Count | Weight | Subtotal |
|------------|-------|--------|----------|
| Low | 4 | 3 | 12 |
| Average | 9 | 4 | 36 |
| High | 1 | 6 | 6 |
| **EI total** | **14** | | **54** |

---

#### External Outputs (EO)

| ID | Elementary process | Complexity | Rationale |
|----|-------------------|------------|-----------|
| EO-1 | **Dashboard** analytics (trends, donut, bar, prior-month comparison %) | **High** | Multiple derived series, aggregations by category/month. |
| EO-2 | **Budget alerts** (80% warn / over cap) with visible list | **Average** | Derived `ratio = spent/cap`, levels, sorting—not a simple pass-through query. |
| EO-3 | **Upcoming bills** (recurring projection ~45 days) | **Average** | Date roll-forward logic + list output. |

**EO summary**

| Complexity | Count | Weight | Subtotal |
|------------|-------|--------|----------|
| Average | 2 | 5 | 10 |
| High | 1 | 7 | 7 |
| **EO total** | **3** | | **17** |

---

#### External Inquiries (EQ)

| ID | Elementary process | Complexity | Rationale |
|----|-------------------|------------|-----------|
| EQ-1 | **Transactions** list (merged bank + ledger, filters) | **Average** | Mostly retrieval + light merge; limited derivation vs EO. |
| EQ-2 | **Accounts** (mock linked accounts) | **Low** | Small read set. |
| EQ-3 | **Household** lists (mine, join requests for admin) | **Average** | Multiple queries, includes pointers. |
| EQ-4 | **Goals** list | **Low** | Simple retrieval. |

**EQ summary**

| Complexity | Count | Weight | Subtotal |
|------------|-------|--------|----------|
| Low | 2 | 3 | 6 |
| Average | 2 | 4 | 8 |
| **EQ total** | **4** | | **14** |

---

#### Internal Logical Files (ILF)

| ID | Logical data group | Complexity | Rationale |
|----|---------------------|------------|-----------|
| ILF-1 | **Personal finance** (`UserFinance` + local mirror: budgets, transactions, goals, bank flag, legacy `manualExpenses`) | **Average** | Several record types but one cohesive “my finance” store. |
| ILF-2 | **Household sharing** (`Household`, `HouseholdFinance`, `HouseholdMember`, `HouseholdInvite`, `HouseholdJoinRequest`, denormalized fields) | **High** | Many RET-style relationships, ACL-heavy, cross-object updates. |

**ILF summary**

| Complexity | Count | Weight | Subtotal |
|------------|-------|--------|----------|
| Average | 1 | 10 | 10 |
| High | 1 | 15 | 15 |
| **ILF total** | **2** | | **25** |

---

#### External Interface Files (EIF)

| ID | Logical file | Complexity | Rationale |
|----|--------------|------------|-----------|
| EIF-1 | **Bank provider interface** (mock implementation today; Plaid-shaped stub for future) | **Low** | External “accounts/transactions” contract maintained outside our ILFs; app consumes API-shaped data. |

**EIF summary:** 1 × Low weight 5 = **5**

*(We **do not** count Back4App itself as EIF if we treat deployed Parse classes as part of the delivered system’s persisted ILFs; the **provider** boundary is clearer for Plaid/bank.)*

---

## Step 2 — Unadjusted Function Points (UFP)

$$
UFP = \sum(\text{Count} \times \text{Weight})
$$

| Component type | Subtotal from above |
|------------------|---------------------|
| EI | 54 |
| EO | 17 |
| EQ | 14 |
| ILF | 25 |
| EIF | 5 |
| **UFP** | **115** |

---

## Step 3 — Value Adjustment Factor (VAF)

### General System Characteristics (GSCs), scores 0–5

| # | Characteristic | Score | Reason (SmartBudget) |
|---|------------------|-------|----------------------|
| 1 | Data communications | **4** | HTTPS client ↔ Back4App API; continuous sync. |
| 2 | Distributed data processing | **3** | Browser + BaaS; not full peer-to-peer. |
| 3 | Performance | **2** | Interactive but not hard real-time; mock bank delays acceptable. |
| 4 | Heavily used configuration | **3** | Env keys, category maps, CSV mapping saved per session. |
| 5 | Transaction rate | **3** | Moderate writes (ledger, imports, household updates). |
| 6 | Online data entry | **5** | Primary use is data entry + import. |
| 7 | End-user efficiency | **4** | Dashboard, alerts, shortcuts; still MVP scope. |
| 8 | Online update | **4** | Live persistence to Parse + local cache refresh. |
| 9 | Complex processing | **4** | Budget ratios, recurring dates, dedupe, ACL membership logic. |
| 10 | Reusability | **2** | Some shared utils (`finance.js`, `formatMoney`); not a framework. |
| 11 | Installation ease | **3** | `npm install` + `.env`; Back4App setup adds friction. |
| 12 | Operational ease | **3** | Logs/warnings; no full ops suite. |
| 13 | Multiple sites | **0** | Single-tenant web app deployment assumption. |
| 14 | Facilitate change | **3** | Modular services; household refactor showed change cost. |

**Total Degrees of Influence (TDI):**

$$
TDI = 4+3+2+3+3+5+4+4+4+2+3+3+0+3 = 43
$$

**Value Adjustment Factor:**

$$
VAF = 0.65 + (0.01 \times TDI) = 0.65 + 0.43 = 1.08
$$

---

## Step 4 — Adjusted Function Points (FP)

$$
FP = UFP \times VAF = 115 \times 1.08 = 124.2 \approx \mathbf{124}\ \text{FP (rounded)}
$$

---

## Summary table (exam-style)

| Step | Result |
|------|--------|
| UFP | **115** |
| TDI | **43** |
| VAF | **1.08** |
| **Adjusted FP** | **≈ 124** |

---

## Assumptions & sensitivity

1. **Household flows** split into several EIs; counting them as **one** “household administration” EI (Average) would **lower** UFP ~10–15 points.
2. **EQ vs EO:** If the instructor prefers **all** chart output as **EQ**, UFP drops (EO weights 5–7 are higher than EQ 3–6).
3. **EIF:** If the course treats **Back4App** as EIF instead of part of ILF, add **1 EIF (Avg–High)** and possibly **reduce** ILF count—recalculate UFP accordingly.

---

## References in repo (domain metrics vs IFP)

- **Budget ratios (80% warn, over cap):** `src/utils/budgetAlerts.js` — `ratio = spent / cap`.
- **Spending by category / month:** `src/utils/finance.js` — `spendingByCategoryForMonth`, `totalSpendingForMonth`.

*(Those are **application metrics**; FPA above is **size/complexity** of the delivered system, not the same as “dollars saved.”)*
