/** @param {{ date: string }} tx */
export function transactionMonth(tx) {
  return tx.date.slice(0, 7);
}

/** Spending outflows only (negative amounts), excluding income category. */
export function isExpenseTransaction(tx) {
  return tx.amount < 0 && tx.category !== "Income";
}

/**
 * @param {Array<{ id: string }>} bankTxs
 * @param {Array<{ id: string }>} manualTxs
 */
export function mergeTransactions(bankTxs, manualTxs) {
  const map = new Map();
  for (const t of bankTxs) map.set(t.id, t);
  for (const t of manualTxs) map.set(t.id, t);
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Sum absolute spend per category for a calendar month (YYYY-MM).
 * @param {Array<{ date: string, amount: number, category: string }>} transactions
 * @param {string} yearMonth
 * @returns {Record<string, number>}
 */
export function spendingByCategoryForMonth(transactions, yearMonth) {
  /** @type {Record<string, number>} */
  const out = {};
  for (const t of transactions) {
    if (!isExpenseTransaction(t)) continue;
    if (transactionMonth(t) !== yearMonth) continue;
    const cat = t.category;
    out[cat] = (out[cat] || 0) + Math.abs(t.amount);
  }
  return out;
}

/**
 * Total spending (expenses only) for a month.
 * @param {Array<{ date: string, amount: number, category: string }>} transactions
 * @param {string} yearMonth
 */
export function totalSpendingForMonth(transactions, yearMonth) {
  const byCat = spendingByCategoryForMonth(transactions, yearMonth);
  return Object.values(byCat).reduce((s, n) => s + n, 0);
}
