/** Warn when spending reaches this fraction of the category cap (e.g. 0.8 = 80%). */
export const BUDGET_WARN_RATIO = 0.8;

/** Below this fraction of the cap, a prior dismissal is cleared (hysteresis). */
export const BUDGET_DISMISS_CLEAR_RATIO = 0.75;

/**
 * Categories with a positive cap for the month, where spending is at or over the warn threshold,
 * or over the cap.
 *
 * @param {Record<string, number>} categoryBudgets
 * @param {Record<string, number>} spendingByCategory
 * @returns {Array<{ category: string, spent: number, cap: number, ratio: number, level: 'warn' | 'over' }>}
 */
export function computeBudgetAlerts(categoryBudgets, spendingByCategory) {
  /** @type {Array<{ category: string, spent: number, cap: number, ratio: number, level: 'warn' | 'over' }>} */
  const out = [];
  for (const [category, cap] of Object.entries(categoryBudgets)) {
    if (!(cap > 0)) continue;
    const spent = spendingByCategory[category] ?? 0;
    const ratio = spent / cap;
    if (ratio >= 1) out.push({ category, spent, cap, ratio, level: "over" });
    else if (ratio >= BUDGET_WARN_RATIO) out.push({ category, spent, cap, ratio, level: "warn" });
  }
  out.sort((a, b) => {
    if (a.level !== b.level) return a.level === "over" ? -1 : 1;
    return b.ratio - a.ratio;
  });
  return out;
}

/**
 * @param {Array<{ category: string, level: 'warn' | 'over' }>} alerts
 * @param {Record<string, 'warn' | 'over'>} dismissals keys from `budgetAlertDismissalKey`
 */
export function filterVisibleBudgetAlerts(alerts, dismissals) {
  return alerts.filter((a) => {
    const d = dismissals[a.category];
    if (a.level === "over") return d !== "over";
    return d !== "warn" && d !== "over";
  });
}
