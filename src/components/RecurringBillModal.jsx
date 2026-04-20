import { useState, useEffect } from "react";
import { defaultNextDueFromPostedDate, isValidRecurring } from "../utils/recurring.js";

/**
 * @param {{
 *   transaction: object,
 *   onClose: () => void,
 *   onSave: (recurring: { cadence: 'weekly'|'monthly'|'yearly', nextDue: string, endDate?: string } | null) => void,
 * }} props
 */
export default function RecurringBillModal({ transaction, onClose, onSave }) {
  const [cadence, setCadence] = useState(/** @type {'weekly'|'monthly'|'yearly'} */ ("monthly"));
  const [nextDue, setNextDue] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    const r = transaction.recurring;
    if (r && isValidRecurring(r)) {
      setCadence(r.cadence);
      setNextDue(r.nextDue);
      setEndDate(r.endDate || "");
    } else {
      setCadence("monthly");
      setNextDue(defaultNextDueFromPostedDate(transaction.date, "monthly"));
      setEndDate("");
    }
    setError(null);
  }, [transaction]);

  const handleSave = () => {
    const payload = {
      cadence,
      nextDue: nextDue.trim(),
      ...(endDate.trim() ? { endDate: endDate.trim() } : {}),
    };
    if (!isValidRecurring(payload)) {
      setError("Choose a valid cadence and next due date (YYYY-MM-DD).");
      return;
    }
    onSave(payload);
    onClose();
  };

  const handleClear = () => {
    onSave(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card-narrow" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Recurring bill / subscription</div>
        <div className="modal-sub">
          {transaction.name} · {formatLedgerHint(transaction.amount)} — we&apos;ll list upcoming due dates from the next due date you set.
        </div>

        <div className="recurring-form">
          <div className="field">
            <label htmlFor="rec-cadence">Repeat</label>
            <select id="rec-cadence" value={cadence} onChange={(e) => setCadence(e.target.value)}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="rec-next">Next due date</label>
            <input id="rec-next" type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="rec-end">End date (optional)</label>
            <input id="rec-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        {error && <div className="error-msg recurring-modal-error">⚠️ {error}</div>}

        <div className="modal-actions">
          <button type="button" className="btn-ghost-danger" onClick={handleClear}>
            Clear recurring
          </button>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" style={{ flex: 2 }} onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function formatLedgerHint(amount) {
  if (typeof amount !== "number") return "—";
  const sign = amount < 0 ? "-" : "+";
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
}
