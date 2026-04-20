/** @typedef {'weekly' | 'monthly' | 'yearly'} RecurringCadence */

/**
 * @param {string} ymd YYYY-MM-DD
 * @returns {string} YYYY-MM-DD
 */
export function formatYmdFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * @param {string} dateStr YYYY-MM-DD
 * @param {RecurringCadence} cadence
 * @returns {string} YYYY-MM-DD
 */
export function addCadenceToDate(dateStr, cadence) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (cadence === "weekly") dt.setDate(dt.getDate() + 7);
  else if (cadence === "monthly") dt.setMonth(dt.getMonth() + 1);
  else if (cadence === "yearly") dt.setFullYear(dt.getFullYear() + 1);
  return formatYmdFromDate(dt);
}

/**
 * Roll a due date forward until it is >= `todayStr` (string compare OK for YYYY-MM-DD).
 * @param {string} nextDue
 * @param {RecurringCadence} cadence
 * @param {string} todayStr
 * @param {number} maxSteps safety cap
 */
export function rollDueToPresent(nextDue, cadence, todayStr, maxSteps = 120) {
  let due = nextDue;
  let steps = 0;
  while (due < todayStr && steps < maxSteps) {
    due = addCadenceToDate(due, cadence);
    steps += 1;
  }
  return due;
}

/**
 * @param {object} recurring
 * @returns {recurring is { cadence: RecurringCadence, nextDue: string, endDate?: string }}
 */
export function isValidRecurring(recurring) {
  if (!recurring || typeof recurring !== "object") return false;
  const { cadence, nextDue } = recurring;
  if (cadence !== "weekly" && cadence !== "monthly" && cadence !== "yearly") return false;
  if (typeof nextDue !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(nextDue)) return false;
  if (recurring.endDate != null && recurring.endDate !== "") {
    if (typeof recurring.endDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(recurring.endDate)) return false;
  }
  return true;
}

/**
 * Project upcoming expense occurrences from persisted transactions with `recurring`.
 * @param {Array<object>} transactions
 * @param {{ todayStr: string, horizonDays?: number, maxOccurrencesPerSeries?: number }} opts
 * @returns {Array<{ transactionId: string, name: string, category: string, amount: number, dueDate: string, cadence: RecurringCadence }>}
 */
export function buildUpcomingRecurringOccurrences(transactions, opts) {
  const { todayStr, horizonDays = 45, maxOccurrencesPerSeries = 4 } = opts;
  const [y, m, d] = todayStr.split("-").map(Number);
  const horizonEnd = new Date(y, m - 1, d);
  horizonEnd.setDate(horizonEnd.getDate() + horizonDays);
  const horizonEndStr = formatYmdFromDate(horizonEnd);

  /** @type {Array<{ transactionId: string, name: string, category: string, amount: number, dueDate: string, cadence: RecurringCadence }>} */
  const out = [];

  for (const tx of transactions) {
    if (!tx.recurring || !isValidRecurring(tx.recurring)) continue;
    if (typeof tx.amount === "number" && tx.amount >= 0) continue;
    const { cadence, nextDue: rawNext, endDate } = tx.recurring;
    let due = rollDueToPresent(rawNext, cadence, todayStr);
    let count = 0;
    while (due <= horizonEndStr && count < maxOccurrencesPerSeries) {
      if (endDate && due > endDate) break;
      out.push({
        transactionId: tx.id,
        name: tx.name,
        category: tx.category,
        amount: tx.amount,
        dueDate: due,
        cadence,
      });
      due = addCadenceToDate(due, cadence);
      count += 1;
    }
  }

  out.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name));
  return out;
}

/**
 * Default `nextDue` when user first marks a row recurring (first occurrence after the posted date).
 * @param {string} postedDate YYYY-MM-DD
 * @param {RecurringCadence} cadence
 */
export function defaultNextDueFromPostedDate(postedDate, cadence) {
  return addCadenceToDate(postedDate, cadence);
}
