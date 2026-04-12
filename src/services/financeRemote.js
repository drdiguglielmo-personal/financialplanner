import Parse from "./parseClient.js";

const CLASS_NAME = "UserFinance";

let UserFinanceClass;
function getUserFinanceClass() {
  if (!UserFinanceClass) UserFinanceClass = Parse.Object.extend(CLASS_NAME);
  return UserFinanceClass;
}

/**
 * @returns {Promise<{ budgets: object, manualExpenses: object[], goals: object[], bankConnected?: boolean } | null>}
 */
export async function fetchUserFinanceState() {
  const user = Parse.User.current();
  if (!user) return null;
  const UF = getUserFinanceClass();
  const q = new Parse.Query(UF);
  q.equalTo("user", user);
  const obj = await q.first();
  if (!obj) return null;
  return {
    budgets: obj.get("budgets") || {},
    manualExpenses: obj.get("manualExpenses") || [],
    goals: obj.get("goals") || [],
    bankConnected: Boolean(obj.get("bankConnected")),
  };
}

/**
 * Creates or updates the current user's finance document on Back4App.
 * @param {{ budgets: object, manualExpenses: object[], goals: object[], bankConnected?: boolean }} bundle
 */
export async function saveUserFinanceState(bundle) {
  const user = Parse.User.current();
  if (!user) throw new Error("Not signed in");

  const UF = getUserFinanceClass();
  const q = new Parse.Query(UF);
  q.equalTo("user", user);
  let obj = await q.first();

  if (!obj) {
    obj = new UF();
    obj.set("user", user);
    const acl = new Parse.ACL(user);
    obj.setACL(acl);
  }

  obj.set("budgets", bundle.budgets || {});
  obj.set("manualExpenses", bundle.manualExpenses || []);
  obj.set("goals", bundle.goals || []);
  obj.set("bankConnected", Boolean(bundle.bankConnected));
  await obj.save();
}
