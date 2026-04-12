/**
 * Formats a number as USD for display (no sign semantics).
 * @param {number} amount
 * @param {{ minimumFractionDigits?: number, maximumFractionDigits?: number }} [opts]
 */
export function formatUsd(amount, opts = {}) {
  const { minimumFractionDigits = 2, maximumFractionDigits = 2 } = opts;
  return `$${Number(amount).toLocaleString("en-US", { minimumFractionDigits, maximumFractionDigits })}`;
}

/**
 * Ledger-style amount: leading +/- and absolute value to 2 decimals.
 * @param {number} amount negative = outflow
 */
export function formatLedgerAmount(amount) {
  const sign = amount < 0 ? "-" : "+";
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
}
