# SmartBudget — Sprint 1 Planning Document

**Project:** SmartBudget (Financial Planner for New Graduates)  
**Team:** Drew DiGuglielmo, Madeline Zitella, Katie Massman  
**Sprint Duration:** 2 Weeks  
**Sprint Goal:** Deliver a working application shell with secure authentication, a visual financial dashboard with spending trends, and a fake-bank database connection layer.

---

## 1. Planning Poker Session

### Story Point Scale (Modified Fibonacci)
`1 | 2 | 3 | 5 | 8 | 13 | 21`

### User Stories Up for Estimation

| # | User Story | Drew | Madeline | Katie | Final SP |
|---|---|---|---|---|---|
| US-01 | As a user, I want a visual dashboard with graphs showing spending categories, savings progress, and financial trends, so that I can clearly understand my financial situation. | 8 | 13 | 8 | **8** |
| US-02 | As a user, I want secure authentication so that my financial data is protected and only I can access my account. | 5 | 5 | 8 | **5** |
| US-03 | As a user, I want to securely connect my bank accounts so transactions are automatically imported and categorized, so that I don't need to manually track spending. | 8 | 8 | 13 | **8** |
| US-04 | Unit & Integration Test Infrastructure (non-functional, required) | 5 | 3 | 5 | **5** |

### Planning Poker Discussion Notes

**US-01 (Dashboard):** Katie initially voted 13 due to complexity of chart rendering and responsive layout. After discussion, the team agreed that using a charting library (Recharts) reduces effort significantly, settling on **8**.

**US-02 (Auth):** Drew and Madeline aligned on 5 immediately. Katie bumped to 8 citing JWT token management and session persistence. Re-vote settled at **5** since Sprint 1 uses a simplified auth model (no OAuth, local JWT).

**US-03 (Bank Connection):** The team split between 8 and 13. The 13 was driven by concern over real API complexity. Agreement reached at **8** since this sprint uses a fake/mock database and no real bank API calls.

**US-04 (Tests):** Team aligned at 5; test infrastructure setup (Jest + React Testing Library) is a one-time cost.

---

## 2. Sprint Velocity

| Metric | Value |
|---|---|
| Estimated Team Capacity (2 weeks, 3 devs, ~6 hrs/dev/week) | ~36 dev-hours |
| Historical Velocity Reference | None (Sprint 1) |
| **Goal Sprint Velocity** | **26 Story Points** |
| Total Sprint Backlog SP | **26 SP** |

**Rationale:** As a first sprint, the team applied a conservative multiplier (approx. 0.72 efficiency) to account for tooling setup, onboarding AI tools, and ramp-up time. All four items fit within this velocity.

---

## 3. Sprint Backlog

| Priority | Story | SP | Acceptance Criteria Summary |
|---|---|---|---|
| 1 | US-02: Secure Authentication | 5 | User can register, log in, log out. JWT stored securely. Protected routes redirect unauthenticated users. All auth unit tests pass. |
| 2 | US-03: Fake Bank Connection | 8 | App fetches transactions from mock DB. Transactions display in UI. Categorization logic runs correctly. Integration tests validate data flow. |
| 3 | US-01: Visual Dashboard | 8 | Dashboard renders spending by category (pie/bar), monthly trend (line), and savings progress. Responsive. Data-driven from mock bank. UAT scenarios pass. |
| 4 | US-04: Test Infrastructure | 5 | Jest configured, React Testing Library installed, ≥1 unit test per component, ≥1 integration test per data flow, all tests pass on `npm test`. |

---

## 4. User Acceptance Tests (UAT)

### US-02: Secure Authentication
| UAT ID | Scenario | Steps | Expected Result | Status |
|---|---|---|---|---|
| UAT-AUTH-01 | Successful registration | Enter name, email, password → Submit | Account created, redirected to dashboard | ✅ Pass |
| UAT-AUTH-02 | Successful login | Enter valid credentials → Submit | JWT issued, dashboard loads | ✅ Pass |
| UAT-AUTH-03 | Invalid login | Enter wrong password → Submit | Error message shown, no token issued | ✅ Pass |
| UAT-AUTH-04 | Protected route redirect | Navigate to /dashboard without login | Redirected to /login | ✅ Pass |
| UAT-AUTH-05 | Logout | Click logout button | Token cleared, redirected to /login | ✅ Pass |

### US-03: Fake Bank Connection
| UAT ID | Scenario | Steps | Expected Result | Status |
|---|---|---|---|---|
| UAT-BANK-01 | Transactions load on login | Log in → view dashboard | Mock transactions appear in list | ✅ Pass |
| UAT-BANK-02 | Categorization correct | View transaction list | Each transaction has correct category label | ✅ Pass |
| UAT-BANK-03 | Balance calculated | View account summary | Balance = sum of all mock transaction amounts | ✅ Pass |
| UAT-BANK-04 | Multiple accounts | Mock data has checking + savings | Both accounts visible and selectable | ✅ Pass |

### US-01: Visual Dashboard
| UAT ID | Scenario | Steps | Expected Result | Status |
|---|---|---|---|---|
| UAT-DASH-01 | Spending by category renders | Log in → view dashboard | Pie/donut chart shows category breakdown | ✅ Pass |
| UAT-DASH-02 | Monthly trend line chart | View dashboard | Line chart shows 6-month spending history | ✅ Pass |
| UAT-DASH-03 | Savings progress bar | View dashboard | Progress bar shows savings vs. goal | ✅ Pass |
| UAT-DASH-04 | Responsive layout | View on mobile viewport | Charts reflow, no overflow | ✅ Pass |
| UAT-DASH-05 | Month filter | Click previous month | Charts update to reflect selected month's data | ✅ Pass |

---

## 5. Definition of Done

A user story is **Done** when:
- [ ] All acceptance criteria are met
- [ ] Unit tests written and passing (`npm test`)
- [ ] Integration tests written and passing
- [ ] All UAT scenarios articulated, constructed, run, and passing
- [ ] Code reviewed by at least one other team member
- [ ] No console errors in development build
- [ ] Component/module documented with JSDoc comments

---

## 6. AI Tools Used

| Tool | Purpose |
|---|---|
| Claude (Anthropic) | Code generation, architecture design, test scaffolding |
| GitHub Copilot | In-editor autocomplete during development |
| Vite | Build tooling |

*All AI-generated code was reviewed, understood, and validated by team members before merging.*
