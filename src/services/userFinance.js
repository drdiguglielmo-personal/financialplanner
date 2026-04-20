import { GOALS_DB, CATEGORY_COLORS } from "../data/mockData.js";

const PREFIX = "smartbudget";

function key(userId, kind) {
  return `${PREFIX}:${userId}:${kind}`;
}

function safeParse(json, fallback) {
  try {
    if (json == null || json === "") return fallback;
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function roundMoney(n) {
  return Math.round(n * 100) / 100;
}

export function getDefaultGoals() {
  return GOALS_DB.map((g) => ({ ...g }));
}

/** Fresh user / no remote row — single factory avoids duplicated default shapes in loaders. */
export function createDefaultFinanceBundle() {
  return {
    budgets: {},
    transactions: [],
    goals: getDefaultGoals(),
    bankConnected: false,
  };
}

/**
 * Canonical bundle: `transactions` holds manual + CSV (and later Plaid) rows.
 * Legacy `manualExpenses` is migrated on read; saves still mirror manual rows to `manualExpenses` on Parse for older rows.
 * @param {object} input
 * @returns {{ budgets: object, transactions: object[], goals: object[], bankConnected: boolean }}
 */
export function normalizeFinanceBundle(input) {
  const budgets = input.budgets && typeof input.budgets === "object" ? input.budgets : {};
  const goals = Array.isArray(input.goals) ? input.goals : [];
  const bankConnected = Boolean(input.bankConnected);
  let transactions = Array.isArray(input.transactions) ? [...input.transactions] : [];
  const legacyManual = Array.isArray(input.manualExpenses) ? input.manualExpenses : [];

  if (transactions.length === 0 && legacyManual.length > 0) {
    transactions = legacyManual.map((tx) => ({
      ...tx,
      source: tx.source || "manual",
    }));
  }

  return { budgets, transactions, goals, bankConnected };
}

/**
 * Shape written to Parse / localStorage helpers (includes legacy manualExpenses mirror).
 * @param {object} bundle normalized or partial
 */
export function bundleForPersistence(bundle) {
  const n = normalizeFinanceBundle(bundle);
  const manualExpenses = n.transactions.filter((t) => t.source === "manual");
  return { ...n, manualExpenses };
}

/**
 * Full bundle from localStorage (device-only fallback when Back4App is not configured).
 * @param {string} userId
 * @returns {{ budgets: Record<string, Record<string, number>>, transactions: object[], goals: object[], bankConnected: boolean }}
 */
export function loadLocalFinance(userId) {
  if (typeof localStorage === "undefined") {
    return { budgets: {}, transactions: [], goals: getDefaultGoals(), bankConnected: false };
  }
  const budgets = safeParse(localStorage.getItem(key(userId, "budgets")), {});
  const rawTransactions = localStorage.getItem(key(userId, "transactions"));
  let transactions;
  if (rawTransactions != null) {
    transactions = safeParse(rawTransactions, []);
    if (!Array.isArray(transactions)) transactions = [];
  } else {
    const legacy = safeParse(localStorage.getItem(key(userId, "expenses")), []);
    transactions = Array.isArray(legacy)
      ? legacy.map((tx) => ({
          ...tx,
          source: tx.source || "manual",
        }))
      : [];
  }
  const rawGoals = localStorage.getItem(key(userId, "goals"));
  let goals = rawGoals ? safeParse(rawGoals, null) : null;
  if (!Array.isArray(goals) || goals.length === 0) goals = getDefaultGoals();
  const bcRaw = localStorage.getItem(key(userId, "bankConnected"));
  const bankConnected = bcRaw === "1" || bcRaw === "true";
  return normalizeFinanceBundle({ budgets, transactions, goals, bankConnected });
}

/**
 * @param {string} userId
 * @param {{ budgets: object, transactions?: object[], manualExpenses?: object[], goals: object[], bankConnected?: boolean }} bundle
 */
export function saveLocalFinance(userId, bundle) {
  if (typeof localStorage === "undefined") return;
  const n = bundleForPersistence(bundle);
  localStorage.setItem(key(userId, "budgets"), JSON.stringify(n.budgets || {}));
  localStorage.setItem(key(userId, "transactions"), JSON.stringify(n.transactions || []));
  localStorage.setItem(key(userId, "expenses"), JSON.stringify(n.manualExpenses || []));
  localStorage.setItem(key(userId, "goals"), JSON.stringify(n.goals || []));
  localStorage.setItem(key(userId, "bankConnected"), n.bankConnected ? "1" : "0");
}

/** True if this browser has ever saved finance data for this user. */
export function hasPersistedLocalFinance(userId) {
  if (typeof localStorage === "undefined") return false;
  return ["budgets", "expenses", "transactions", "goals", "bankConnected"].some((kind) => localStorage.getItem(key(userId, kind)) != null);
}

/**
 * @param {Record<string, Record<string, number>>} budgets
 * @param {string} yearMonth YYYY-MM
 * @param {string} category
 * @param {number} amount non-negative budget cap; 0 removes category for that month
 */
export function applySetCategoryBudget(budgets, yearMonth, category, amount) {
  const month = { ...(budgets[yearMonth] || {}) };
  if (amount <= 0) delete month[category];
  else month[category] = roundMoney(amount);
  const next = { ...budgets, [yearMonth]: month };
  if (Object.keys(next[yearMonth]).length === 0) delete next[yearMonth];
  return next;
}

/**
 * @param {object[]} transactions
 * @param {{ name: string, amount: number, category: string, date: string, icon?: string, color?: string }} payload
 */
export function applyAddManualExpense(transactions, payload) {
  const id = `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  const color = payload.color || CATEGORY_COLORS[payload.category] || "#8899b0";
  const expense = {
    id,
    name: payload.name.trim(),
    category: payload.category,
    amount: -roundMoney(Math.abs(payload.amount)),
    date: payload.date,
    icon: payload.icon || "📝",
    color,
    source: "manual",
  };
  return { expense, transactions: [expense, ...transactions] };
}

/** Removes a persisted transaction by id (manual, CSV, etc.). */
export function applyDeleteManualExpense(transactions, expenseId) {
  return transactions.filter((e) => e.id !== expenseId);
}

/**
 * Set or clear `recurring` on a persisted transaction (manual / CSV).
 * @param {object[]} transactions
 * @param {string} id
 * @param {object | null | undefined} recurring pass `null` to clear
 */
export function applyUpdateTransactionRecurring(transactions, id, recurring) {
  return transactions.map((t) => {
    if (t.id !== id) return t;
    if (recurring == null) {
      const { recurring: _r, ...rest } = t;
      return rest;
    }
    return { ...t, recurring: { ...recurring } };
  });
}

/** @param {object[]} goals */
export function applyUpdateGoal(goals, goalId, patch) {
  return goals.map((g) => (g.id === goalId ? { ...g, ...patch } : g));
}

/**
 * @param {object[]} goals
 * @param {{ name: string, target: number, current?: number, color?: string, icon?: string }} payload
 */
export function applyAddGoal(goals, { name, target, current = 0, color = "#60a5fa", icon = "🎯" }) {
  const id = `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const row = {
    id,
    name: name.trim(),
    target: roundMoney(Math.max(0, target)),
    current: roundMoney(Math.max(0, current)),
    color,
    icon: (icon && String(icon).trim()) || "🎯",
  };
  return [...goals, row];
}

/** @param {object[]} goals */
export function applyRemoveGoal(goals, goalId) {
  return goals.filter((g) => g.id !== goalId);
}
