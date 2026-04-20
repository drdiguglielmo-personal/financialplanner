/* Fake bank database — Sprint 1 mock. In production: replace with real bank API / Plaid */

export const FAKE_USERS_DB = {
  "alex.johnson@email.com": {
    id: "u001",
    name: "Alex Johnson",
    passwordHash: "pass123",
    accounts: ["acc_checking", "acc_savings"],
  },
  "demo@smartbudget.io": {
    id: "u002",
    name: "Demo User",
    passwordHash: "demo",
    accounts: ["acc_checking", "acc_savings"],
  },
};

export const FAKE_ACCOUNTS_DB = {
  acc_checking: {
    id: "acc_checking",
    name: "Chase Checking",
    type: "checking",
    balance: 3842.15,
    bank: "Chase",
  },
  acc_savings: {
    id: "acc_savings",
    name: "Ally Savings",
    type: "savings",
    balance: 8210.0,
    bank: "Ally",
  },
};

export const FAKE_TRANSACTIONS_DB = [
  { id: "t001", name: "Whole Foods Market", category: "Groceries", amount: -89.34, date: "2026-04-05", icon: "🛒", color: "#34d399", source: "bank_mock" },
  { id: "t002", name: "Venmo — Emma", category: "Rent/Housing", amount: -725.0, date: "2026-04-01", icon: "🏠", color: "#60a5fa", source: "bank_mock" },
  { id: "t003", name: "Starbucks", category: "Dining", amount: -6.75, date: "2026-04-06", icon: "☕", color: "#fb923c", source: "bank_mock" },
  { id: "t004", name: "Netflix", category: "Entertainment", amount: -15.99, date: "2026-04-03", icon: "📺", color: "#a78bfa", source: "bank_mock" },
  { id: "t005", name: "Direct Deposit", category: "Income", amount: 3500.0, date: "2026-04-01", icon: "💰", color: "#4ade80", source: "bank_mock" },
  { id: "t006", name: "CTA Transit Pass", category: "Transport", amount: -105.0, date: "2026-04-01", icon: "🚊", color: "#f472b6", source: "bank_mock" },
  { id: "t007", name: "Chipotle", category: "Dining", amount: -12.5, date: "2026-04-07", icon: "🌯", color: "#fb923c", source: "bank_mock" },
  { id: "t008", name: "Amazon", category: "Shopping", amount: -45.99, date: "2026-04-04", icon: "📦", color: "#fbbf24", source: "bank_mock" },
  { id: "t009", name: "Spotify", category: "Entertainment", amount: -9.99, date: "2026-04-03", icon: "🎵", color: "#a78bfa", source: "bank_mock" },
  { id: "t010", name: "ComEd Utility", category: "Utilities", amount: -67.2, date: "2026-04-02", icon: "💡", color: "#e879f9", source: "bank_mock" },
  { id: "t011", name: "Trader Joe's", category: "Groceries", amount: -54.12, date: "2026-04-08", icon: "🛒", color: "#34d399", source: "bank_mock" },
  { id: "t012", name: "Planet Fitness", category: "Health", amount: -24.99, date: "2026-04-01", icon: "🏋️", color: "#2dd4bf", source: "bank_mock" },
];

export const MONTHLY_SPENDING_DB = [
  { month: "Jan", total: 2180, groceries: 310, dining: 290, housing: 725, transport: 105, entertainment: 120, other: 630 },
  { month: "Feb", total: 2050, groceries: 280, dining: 240, housing: 725, transport: 105, entertainment: 95, other: 605 },
  { month: "Mar", total: 2400, groceries: 340, dining: 380, housing: 725, transport: 105, entertainment: 200, other: 650 },
  { month: "Apr", total: 2120, groceries: 295, dining: 260, housing: 725, transport: 105, entertainment: 110, other: 625 },
  { month: "May", total: 2290, groceries: 320, dining: 310, housing: 725, transport: 105, entertainment: 180, other: 650 },
  { month: "Jun", total: 1956, groceries: 143, dining: 190, housing: 725, transport: 105, entertainment: 160, other: 633 },
];

export const GOALS_DB = [
  { id: "g001", name: "Emergency Fund", target: 10000, current: 8210, color: "#4ade80", icon: "🛡️" },
  { id: "g002", name: "Japan Trip 2026", target: 4000, current: 1200, color: "#60a5fa", icon: "✈️" },
  { id: "g003", name: "New MacBook", target: 2500, current: 800, color: "#f472b6", icon: "💻" },
];

export const CATEGORY_COLORS = {
  Groceries: "#34d399",
  Dining: "#fb923c",
  "Rent/Housing": "#60a5fa",
  Transport: "#f472b6",
  Entertainment: "#a78bfa",
  Shopping: "#fbbf24",
  Utilities: "#e879f9",
  Health: "#2dd4bf",
  Uncategorized: "#94a3b8",
  Income: "#4ade80",
};

/** Categories available for budgets and manual expenses (excludes income). */
export const EXPENSE_CATEGORIES = Object.keys(CATEGORY_COLORS).filter((c) => c !== "Income");
