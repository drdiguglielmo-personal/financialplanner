import Parse from "./parseClient.js";

const CLASS_NAME = "HouseholdFinance";

let HFClass;
function getHouseholdFinanceClass() {
  if (!HFClass) HFClass = Parse.Object.extend(CLASS_NAME);
  return HFClass;
}

/**
 * @param {string} householdId
 * @returns {Promise<{ budgets: object, transactions: object[], manualExpenses: object[], goals: object[], bankConnected?: boolean } | null>}
 */
export async function fetchHouseholdFinanceState(householdId) {
  const user = Parse.User.current();
  if (!user || !householdId) return null;
  const HF = getHouseholdFinanceClass();
  const q = new Parse.Query(HF);
  q.equalTo("household", Parse.Object.createWithoutData("Household", householdId));
  const obj = await q.first();
  if (!obj) return null;
  return {
    budgets: obj.get("budgets") || {},
    transactions: obj.get("transactions") || [],
    manualExpenses: obj.get("manualExpenses") || [],
    goals: obj.get("goals") || [],
    bankConnected: Boolean(obj.get("bankConnected")),
  };
}

/**
 * @param {string} householdId
 * @param {{ budgets: object, transactions?: object[], manualExpenses?: object[], goals: object[], bankConnected?: boolean }} bundle
 */
export async function saveHouseholdFinanceState(householdId, bundle) {
  const user = Parse.User.current();
  if (!user) {
    console.warn(
      "SmartBudget: skipped household cloud save — Parse has no current user (session may be missing). Data was still saved locally."
    );
    return;
  }
  if (!householdId || String(householdId).trim() === "") {
    console.warn(
      "SmartBudget: skipped household cloud save — no household id. Data was still saved locally."
    );
    return;
  }

  const HF = getHouseholdFinanceClass();
  const q = new Parse.Query(HF);
  q.equalTo("household", Parse.Object.createWithoutData("Household", householdId));
  const obj = await q.first();
  if (!obj) {
    throw new Error(
      "HouseholdFinance not found for this household. Create the household from the Household page first, or check your Back4App data."
    );
  }

  obj.set("budgets", bundle.budgets || {});
  obj.set("transactions", bundle.transactions || []);
  obj.set("manualExpenses", bundle.manualExpenses || []);
  obj.set("goals", bundle.goals || []);
  obj.set("bankConnected", Boolean(bundle.bankConnected));
  await obj.save();
}
