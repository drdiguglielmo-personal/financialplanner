import { isBack4AppConfigured } from "./parseClient.js";
import { fetchUserFinanceState, saveUserFinanceState } from "./financeRemote.js";
import { createDefaultFinanceBundle, getDefaultGoals, hasPersistedLocalFinance, loadLocalFinance, saveLocalFinance } from "./userFinance.js";

/**
 * Load budgets, manual expenses, and goals — from Back4App when configured, else localStorage.
 * Migrates prior local-only data to the cloud once when the remote document is missing.
 * @param {string} userId Parse user objectId
 */
export async function loadPersistedFinance(userId) {
  if (!isBack4AppConfigured()) {
    return loadLocalFinance(userId);
  }

  try {
    const remote = await fetchUserFinanceState();
    if (!remote) {
      if (hasPersistedLocalFinance(userId)) {
        const local = loadLocalFinance(userId);
        await saveUserFinanceState(local);
        saveLocalFinance(userId, local);
        return local;
      }
      return createDefaultFinanceBundle();
    }

    let goals = Array.isArray(remote.goals) && remote.goals.length > 0 ? remote.goals : getDefaultGoals();
    const bundle = {
      budgets: remote.budgets && typeof remote.budgets === "object" ? remote.budgets : {},
      manualExpenses: Array.isArray(remote.manualExpenses) ? remote.manualExpenses : [],
      goals,
      bankConnected: Boolean(remote.bankConnected),
    };
    saveLocalFinance(userId, bundle);
    return bundle;
  } catch (e) {
    console.warn("SmartBudget: cloud finance load failed, using local data.", e);
    return loadLocalFinance(userId);
  }
}

/**
 * Writes to localStorage (cache/offline) and Back4App when configured.
 * Cloud failures are logged; local save still succeeds first.
 * @param {string} userId
 * @param {{ budgets: object, manualExpenses: object[], goals: object[], bankConnected?: boolean }} bundle
 */
export async function persistFinance(userId, bundle) {
  saveLocalFinance(userId, bundle);
  if (!isBack4AppConfigured()) return;

  try {
    await saveUserFinanceState(bundle);
  } catch (e) {
    console.warn("SmartBudget: cloud finance save failed (saved locally).", e);
  }
}
