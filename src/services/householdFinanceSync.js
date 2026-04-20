import { isBack4AppConfigured } from "./parseClient.js";
import { fetchHouseholdFinanceState, saveHouseholdFinanceState } from "./householdFinanceRemote.js";
import { loadHouseholdLocalBundle, saveHouseholdLocalBundle } from "./householdLocalFinance.js";
import {
  bundleForPersistence,
  createDefaultFinanceBundle,
  getDefaultGoals,
  normalizeFinanceBundle,
} from "./userFinance.js";

/**
 * @param {string} userId
 * @param {string} householdId
 */
export async function loadHouseholdFinanceBundle(userId, householdId) {
  if (!isBack4AppConfigured()) {
    return loadHouseholdLocalBundle(userId, householdId) || createDefaultFinanceBundle();
  }

  try {
    const remote = await fetchHouseholdFinanceState(householdId);
    if (!remote) {
      const local = loadHouseholdLocalBundle(userId, householdId);
      return local || createDefaultFinanceBundle();
    }

    let goals = Array.isArray(remote.goals) && remote.goals.length > 0 ? remote.goals : getDefaultGoals();
    const bundle = normalizeFinanceBundle({
      budgets: remote.budgets && typeof remote.budgets === "object" ? remote.budgets : {},
      manualExpenses: Array.isArray(remote.manualExpenses) ? remote.manualExpenses : [],
      transactions: Array.isArray(remote.transactions) ? remote.transactions : [],
      goals,
      bankConnected: Boolean(remote.bankConnected),
    });
    saveHouseholdLocalBundle(userId, householdId, bundle);
    return bundle;
  } catch (e) {
    console.warn("SmartBudget: household finance load failed, using local cache.", e);
    return loadHouseholdLocalBundle(userId, householdId) || createDefaultFinanceBundle();
  }
}

/**
 * @param {string} userId
 * @param {string} householdId
 * @param {object} bundle
 */
export async function persistHouseholdFinanceBundle(userId, householdId, bundle) {
  const normalized = bundleForPersistence(bundle);
  saveHouseholdLocalBundle(userId, householdId, normalized);
  if (!isBack4AppConfigured()) return;

  try {
    await saveHouseholdFinanceState(householdId, normalized);
  } catch (e) {
    console.warn("SmartBudget: household cloud save failed (saved locally).", e);
  }
}
