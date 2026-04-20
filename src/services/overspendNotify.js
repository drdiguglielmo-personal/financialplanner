import { BUDGET_DISMISS_CLEAR_RATIO } from "../utils/budgetAlerts.js";
import { sendOverspendWebhook } from "./overspendEmailWebhook.js";

const PREFIX = "smartbudget";

/**
 * We only notify when crossing into "over" (ratio >= 1). We clear the sent marker once spending
 * drops below the clear threshold (default 0.75 of cap) or cap disappears.
 *
 * Storage shape per user+scope: { [yearMonth]: { [category]: true } }
 *
 * @param {string} userId
 * @param {string} scopeKey
 */
function storageKey(userId, scopeKey) {
  return `${PREFIX}:${userId}:overspendNotified:${scopeKey}`;
}

function readRaw(userId, scopeKey) {
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

function writeRaw(userId, scopeKey, value) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(storageKey(userId, scopeKey), JSON.stringify(value));
}

/**
 * @param {string} userId
 * @param {string} yearMonth
 * @param {string} scopeKey
 * @param {string} category
 */
function hasSent(userId, yearMonth, scopeKey, category) {
  const all = readRaw(userId, scopeKey);
  return Boolean(all?.[yearMonth]?.[category]);
}

/**
 * @param {string} userId
 * @param {string} yearMonth
 * @param {string} scopeKey
 * @param {string} category
 */
function markSent(userId, yearMonth, scopeKey, category) {
  const all = readRaw(userId, scopeKey);
  const slice = (all[yearMonth] && typeof all[yearMonth] === "object") ? all[yearMonth] : {};
  all[yearMonth] = { ...slice, [category]: true };
  writeRaw(userId, scopeKey, all);
}

/**
 * Clear sent markers once spending cools off (hysteresis) or a cap is removed.
 *
 * @param {string} userId
 * @param {string} yearMonth
 * @param {string} scopeKey
 * @param {Record<string, number>} categoryBudgets
 * @param {Record<string, number>} spendingByCategory
 */
export function pruneOverspendNotified(userId, yearMonth, scopeKey, categoryBudgets, spendingByCategory) {
  const all = readRaw(userId, scopeKey);
  const cur = all[yearMonth];
  if (!cur || typeof cur !== "object") return;

  let changed = false;
  const next = { ...cur };
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
    }
  }
  if (!changed) return;
  all[yearMonth] = next;
  writeRaw(userId, scopeKey, all);
}

/**
 * Send webhook email notification(s) for any category that is currently "over" and has not yet been
 * notified for this month+scope.
 *
 * @param {{
 *   userId: string,
 *   userEmail?: string,
 *   yearMonth: string,
 *   scopeKey: string,
 *   alerts: Array<{ category: string, spent: number, cap: number, ratio: number, level: 'warn' | 'over' }>,
 * }} params
 */
export async function notifyOverspend(params) {
  const over = params.alerts.filter((a) => a.level === "over");
  if (!over.length) return;

  for (const a of over) {
    if (hasSent(params.userId, params.yearMonth, params.scopeKey, a.category)) continue;
    try {
      await sendOverspendWebhook({
        userId: params.userId,
        userEmail: params.userEmail,
        scopeKey: params.scopeKey,
        month: params.yearMonth,
        category: a.category,
        spent: a.spent,
        cap: a.cap,
      });
      markSent(params.userId, params.yearMonth, params.scopeKey, a.category);
    } catch (e) {
      // Keep local state; user still sees in-app alerts. Avoid throwing in UI.
      console.warn("SmartBudget: overspend webhook failed.", e);
    }
  }
}

