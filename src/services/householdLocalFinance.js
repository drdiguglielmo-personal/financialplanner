import { bundleForPersistence, normalizeFinanceBundle } from "./userFinance.js";

const PREFIX = "smartbudget";

function bundleKey(userId, householdId) {
  return `${PREFIX}:${userId}:hh:${householdId}:financeBundle`;
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

/**
 * @param {string} userId
 * @param {string} householdId
 * @returns {ReturnType<typeof normalizeFinanceBundle> | null}
 */
export function loadHouseholdLocalBundle(userId, householdId) {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(bundleKey(userId, householdId));
  if (!raw) return null;
  const o = safeParse(raw, null);
  if (!o || typeof o !== "object") return null;
  return normalizeFinanceBundle(o);
}

/**
 * @param {string} userId
 * @param {string} householdId
 * @param {object} bundle
 */
export function saveHouseholdLocalBundle(userId, householdId, bundle) {
  if (typeof localStorage === "undefined") return;
  const n = bundleForPersistence(bundle);
  localStorage.setItem(bundleKey(userId, householdId), JSON.stringify(n));
}
