const PREFIX = "smartbudget";

function key(userId) {
  return `${PREFIX}:${userId}:activeFinanceTarget`;
}

/**
 * @returns {{ type: 'personal' } | { type: 'household', householdId: string, name: string }}
 */
export function readActiveFinanceTarget(userId) {
  if (typeof localStorage === "undefined" || !userId) return { type: "personal" };
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return { type: "personal" };
    const o = JSON.parse(raw);
    if (o && o.type === "household" && typeof o.householdId === "string" && o.householdId) {
      return { type: "household", householdId: o.householdId, name: typeof o.name === "string" ? o.name : "Household" };
    }
    return { type: "personal" };
  } catch {
    return { type: "personal" };
  }
}

/**
 * @param {string} userId
 * @param {{ type: 'personal' } | { type: 'household', householdId: string, name: string }} target
 */
export function writeActiveFinanceTarget(userId, target) {
  if (typeof localStorage === "undefined" || !userId) return;
  if (!target || target.type === "personal") {
    localStorage.setItem(key(userId), JSON.stringify({ type: "personal" }));
    return;
  }
  localStorage.setItem(
    key(userId),
    JSON.stringify({
      type: "household",
      householdId: target.householdId,
      name: target.name || "Household",
    })
  );
}

/**
 * @param {{ type: 'personal' } | { type: 'household', householdId: string, name?: string }} target
 * @returns {string} storage scope for budget-dismissals etc.
 */
export function financeAlertScopeKey(target) {
  if (!target || target.type === "personal") return "personal";
  return `hh_${target.householdId}`;
}
