import { BUDGET_DISMISS_CLEAR_RATIO } from "../utils/budgetAlerts.js";

const PREFIX = "smartbudget";

/**
 * @param {string} userId
 * @param {string} [scopeKey] personal | hh_<householdId>
 */
function storageKey(userId, scopeKey = "personal") {
  return `${PREFIX}:${userId}:budgetAlertDismissals:${scopeKey}`;
}

/**
 * Persist dismissals for one calendar month (YYYY-MM). Shape: { [category]: 'warn' | 'over' }.
 * @param {string} userId
 * @param {string} yearMonth
 * @param {Record<string, 'warn' | 'over'>} byCategory
 * @param {string} [scopeKey]
 */
export function writeBudgetAlertDismissalsForMonth(userId, yearMonth, byCategory, scopeKey = "personal") {
  if (typeof localStorage === "undefined") return;
  const all = readBudgetAlertDismissalsRaw(userId, scopeKey);
  all[yearMonth] = byCategory;
  localStorage.setItem(storageKey(userId, scopeKey), JSON.stringify(all));
}

function readBudgetAlertDismissalsRaw(userId, scopeKey = "personal") {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(storageKey(userId, scopeKey));
    if (!raw) return {};
    const o = JSON.parse(raw);
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

/**
 * @param {string} userId
 * @param {string} yearMonth
 * @param {string} [scopeKey]
 * @returns {Record<string, 'warn' | 'over'>}
 */
export function readDismissalsForMonth(userId, yearMonth, scopeKey = "personal") {
  const all = readBudgetAlertDismissalsRaw(userId, scopeKey);
  const slice = all[yearMonth];
  return slice && typeof slice === "object" ? { ...slice } : {};
}

/**
 * @param {string} userId
 * @param {string} yearMonth
 * @param {Record<string, number>} categoryBudgets
 * @param {Record<string, number>} spendingByCategory
 * @param {string} [scopeKey]
 * @returns {Record<string, 'warn' | 'over'>} pruned copy (may be smaller than stored)
 */
export function pruneBudgetAlertDismissalsForMonth(userId, yearMonth, categoryBudgets, spendingByCategory, scopeKey = "personal") {
  const current = readDismissalsForMonth(userId, yearMonth, scopeKey);
  const next = { ...current };
  let changed = false;

  for (const category of Object.keys(next)) {
    const cap = categoryBudgets[category] ?? 0;
    if (!(cap > 0)) {
      delete next[category];
      changed = true;
      continue;
    }
    const spent = spendingByCategory[category] ?? 0;
    const ratio = spent / cap;
    if (ratio < BUDGET_DISMISS_CLEAR_RATIO) {
      delete next[category];
      changed = true;
      continue;
    }
    if (ratio < 1 && next[category] === "over") {
      delete next[category];
      changed = true;
    }
  }

  if (changed) {
    writeBudgetAlertDismissalsForMonth(userId, yearMonth, next, scopeKey);
  }
  return readDismissalsForMonth(userId, yearMonth, scopeKey);
}

/**
 * @param {string} userId
 * @param {string} yearMonth
 * @param {string} category
 * @param {'warn' | 'over'} level
 * @param {string} [scopeKey]
 */
export function dismissBudgetAlert(userId, yearMonth, category, level, scopeKey = "personal") {
  const cur = readDismissalsForMonth(userId, yearMonth, scopeKey);
  writeBudgetAlertDismissalsForMonth(userId, yearMonth, { ...cur, [category]: level }, scopeKey);
}
