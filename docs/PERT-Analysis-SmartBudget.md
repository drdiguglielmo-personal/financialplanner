# PERT Analysis — SmartBudget (Sprint 3)

**Units:** person-**hours** (single developer).  
**Scope:** Major deliverables aligned with this repository (CSV import, budget alerts, recurring bills, household sharing without Cloud Code, bank-provider scaffold, integration/tests/docs).

---

## Methodology (from course material)

### Step 1 — Three-point estimates (per task)

| Symbol | Meaning |
|--------|--------|
| **O** | **Optimistic** — best case (no surprises). |
| **M** | **Most likely** — realistic based on similar work. |
| **P** | **Pessimistic** — worst case (integrations, ACL bugs, merge issues). |

### Step 2 — Expected time (Beta PERT)

Weights **most likely** 4× more than **O** or **P**:

$$
T_e = \frac{O + 4M + P}{6}
$$

### Step 3 — Uncertainty

$$
\sigma = \frac{P - O}{6}, \qquad V = \sigma^2
$$

### Step 4 — Confidence intervals (Normal approximation)

| Confidence | Interval |
|------------|----------|
| **68.3%** | $T_e \pm 1\sigma$ |
| **95.4%** | $T_e \pm 2\sigma$ |
| **99.7%** | $T_e \pm 3\sigma$ |

---

## Rationale for O / M / P choices

| Task | Why **O** is low | Why **M** is mid | Why **P** is high |
|------|------------------|------------------|-------------------|
| **A** | Parser + table mapping works first try | Extra edge cases (dates, signs) | Messy real-world CSVs, dedupe bugs |
| **B** | Pure UI + math | Dismissal persistence + month scope | Household scope, edge months |
| **C** | Simple recurrence rules | UI modal + ledger fields | Month-end date bugs, DST |
| **D** | Happy-path ACL | Invites + join requests | Parse ACL/CLP, no Cloud Code redesign |
| **E** | Thin interface | Mock provider | Plaid-shaped stubs, future API drift |
| **F** | Smoke tests pass | Vitest + mocks | Flaky CI, Dashboard race conditions |

---

## Per-task calculations

### Task A — CSV import (parse, map, preview, dedupe, `TransactionsPanel`)

| | Hours |
|---|------:|
| O | 8 |
| M | 16 |
| P | 40 |

$$
T_e = \frac{8 + 4(16) + 40}{6} = \frac{112}{6} \approx \mathbf{18.67\ h}
$$

$$
\sigma = \frac{40 - 8}{6} = \frac{32}{6} \approx \mathbf{5.33\ h}, \quad V \approx \mathbf{28.44}
$$

**68% interval:** ≈ **13.3–24.0 h** **95% interval:** ≈ **8.0–29.3 h**

---

### Task B — Budget alerts (80% / over), dismissals, scope (`personal` vs household)

| | Hours |
|---|------:|
| O | 4 |
| M | 8 |
| P | 20 |

$$
T_e = \frac{4 + 32 + 20}{6} = \frac{56}{6} \approx \mathbf{9.33\ h}, \quad \sigma = \frac{16}{6} \approx \mathbf{2.67\ h}, \quad V \approx \mathbf{7.11}
$$

**95% interval:** ≈ **4.0–14.7 h**

---

### Task C — Recurring metadata + “Upcoming bills” (~45 days)

| | Hours |
|---|------:|
| O | 6 |
| M | 12 |
| P | 28 |

$$
T_e = \frac{6 + 48 + 28}{6} = \frac{82}{6} \approx \mathbf{13.67\ h}, \quad \sigma = \frac{22}{6} \approx \mathbf{3.67\ h}, \quad V \approx \mathbf{13.44}
$$

**95% interval:** ≈ **6.3–21.0 h**

---

### Task D — Household sharing (Parse client-only, invites, join requests, ACL, `householdNameSnapshot`, `notifyAdminIds`)

| | Hours |
|---|------:|
| O | 12 |
| M | 28 |
| P | 60 |

$$
T_e = \frac{12 + 112 + 60}{6} = \frac{184}{6} \approx \mathbf{30.67\ h}, \quad \sigma = \frac{48}{6} = \mathbf{8.00\ h}, \quad V = \mathbf{64.00}
$$

**95% interval:** ≈ **14.7–46.7 h** (largest uncertainty — **highest risk** task.)

---

### Task E — Bank provider abstraction + mock + Plaid stub

| | Hours |
|---|------:|
| O | 3 |
| M | 6 |
| P | 16 |

$$
T_e = \frac{3 + 24 + 16}{6} = \frac{43}{6} \approx \mathbf{7.17\ h}, \quad \sigma = \frac{13}{6} \approx \mathbf{2.17\ h}, \quad V \approx \mathbf{4.69}
$$

**95% interval:** ≈ **2.8–11.5 h**

---

### Task F — Integration, Vitest, Dashboard load-order fixes, README / `.env`

| | Hours |
|---|------:|
| O | 4 |
| M | 10 |
| P | 24 |

$$
T_e = \frac{4 + 40 + 24}{6} = \frac{68}{6} \approx \mathbf{11.33\ h}, \quad \sigma = \frac{20}{6} \approx \mathbf{3.33\ h}, \quad V \approx \mathbf{11.11}
$$

**95% interval:** ≈ **4.7–18.0 h**

---

## Summary table

| Task | Description | O | M | P | $T_e$ (h) | $\sigma$ (h) | $V$ |
|------|-------------|--:|--:|--:|----------:|---------------:|-----:|
| A | CSV import | 8 | 16 | 40 | 18.67 | 5.33 | 28.44 |
| B | Budget alerts | 4 | 8 | 20 | 9.33 | 2.67 | 7.11 |
| C | Recurring + upcoming | 6 | 12 | 28 | 13.67 | 3.67 | 13.44 |
| D | Household sharing | 12 | 28 | 60 | 30.67 | 8.00 | 64.00 |
| E | Bank provider scaffold | 3 | 6 | 16 | 7.17 | 2.17 | 4.69 |
| F | Tests + docs + wiring | 4 | 10 | 24 | 11.33 | 3.33 | 11.11 |
| **Σ** | | | | | **≈ 90.83** | — | **≈ 128.79** |

---

## Roll-up (optional): total expected effort

If these six work packages are **independent** (different modules, minimal blocking), a common classroom simplification is:

$$
T_{e,\mathrm{total}} \approx \sum T_e \approx \mathbf{90.8\ hours}
$$

For **variance of the sum** of independent-ish tasks, $V_{\mathrm{total}} \approx \sum V_i$:

$$
V_{\mathrm{total}} \approx 28.44 + 7.11 + 13.44 + 64.00 + 4.69 + 11.11 \approx 128.79
$$

$$
\sigma_{\mathrm{total}} = \sqrt{V_{\mathrm{total}}} \approx \sqrt{128.79} \approx \mathbf{11.35\ hours}
$$

**Approximate 95% confidence band for total effort** (Normal approximation):

$$
T_{e,\mathrm{total}} \pm 2\sigma_{\mathrm{total}} \approx 90.8 \pm 22.7 \Rightarrow \mathbf{[68,\ 114]\ hours}
$$

*Caveat:* Real schedules overlap (parallel work reduces **calendar** time); PERT **beta** per task is not exactly **Normal**; summing $T_e$ is an **effort** estimate, not a critical-path duration unless tasks are strictly sequential.

---

## Why use PERT here? (Strategic)

1. **Optimism bias** — Solo + AI-assisted work still underestimates Parse/ACL and integration bugs; **P** forces explicit “bad week” thinking.
2. **Stakeholder language** — Example: *“We’re about **95%** confident household sharing lands between **~15 and ~47** hours”* (Task D alone).
3. **Risk prioritization** — **Task D** has the largest $\sigma$ ($P-O$ gap): deserves earlier spikes, test accounts, and Back4App CLP checklist before coding deep.

---

## Highest-risk item (from PERT spread)

**Household sharing (Task D):** $\sigma = 8$ h → widest absolute uncertainty. Mitigations: document CLP early, test two users, snapshot fields on `HouseholdMember` / invites to avoid pointer read failures.
