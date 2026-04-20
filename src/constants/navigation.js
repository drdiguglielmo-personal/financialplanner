/** Sidebar / route ids — avoids stringly-typed nav comparisons across the dashboard. */
export const NAV = {
  DASHBOARD: "dashboard",
  BUDGETS: "budgets",
  TRANSACTIONS: "transactions",
  GOALS: "goals",
  ACCOUNTS: "accounts",
  HOUSEHOLD: "household",
};

export const NAV_ITEMS = [
  { id: NAV.DASHBOARD, icon: "📊", label: "Dashboard" },
  { id: NAV.BUDGETS, icon: "📋", label: "Budgets" },
  { id: NAV.TRANSACTIONS, icon: "💳", label: "Transactions" },
  { id: NAV.GOALS, icon: "🎯", label: "Goals" },
  { id: NAV.ACCOUNTS, icon: "🏦", label: "Accounts" },
  { id: NAV.HOUSEHOLD, icon: "👪", label: "Household" },
];

const SECONDARY_PAGE_TITLES = {
  [NAV.BUDGETS]: "Budgets",
  [NAV.TRANSACTIONS]: "Transactions",
  [NAV.GOALS]: "Savings goals",
  [NAV.ACCOUNTS]: "Accounts",
  [NAV.HOUSEHOLD]: "Household sharing",
};

/** Title shown in the header when a secondary view is active (not the dashboard greeting). */
export function secondaryPageTitle(navId) {
  if (navId === NAV.DASHBOARD) return "Overview";
  return SECONDARY_PAGE_TITLES[navId] ?? "Accounts";
}
