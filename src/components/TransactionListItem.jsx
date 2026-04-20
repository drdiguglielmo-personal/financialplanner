import { CATEGORY_COLORS } from "../data/mockData.js";
import { formatLedgerAmount } from "../utils/formatMoney.js";

/**
 * @param {{
 *   tx: { id: string, name: string, category: string, amount: number, date?: string, icon?: string, color?: string, source?: string },
 *   showDate?: boolean,
 *   onDeletePersisted?: (id: string) => void,
 *   onManageRecurring?: (tx: object) => void,
 * }} props
 */
export default function TransactionListItem({ tx, showDate = false, onDeletePersisted, onManageRecurring }) {
  const bg = tx.color || CATEGORY_COLORS[tx.category] || "#8899b0";
  const manual = tx.source === "manual";
  const csv = tx.source === "csv";
  const canDelete = (manual || csv) && onDeletePersisted;
  const canRecurring = (manual || csv) && onManageRecurring;
  const hasRecurring = Boolean(tx.recurring);

  return (
    <div className="tx-item">
      <div className="tx-icon" style={{ background: `${bg}22` }}>
        {tx.icon || "💸"}
      </div>
      <div className="tx-info">
        <div className="tx-name">{tx.name}</div>
        <div className="tx-cat">
          {tx.category}
          {manual && <span className="tx-badge">Manual</span>}
          {csv && <span className="tx-badge">CSV</span>}
          {hasRecurring && <span className="tx-badge tx-badge-recurring">Recurring</span>}
        </div>
        {showDate && tx.date && <div className="tx-date">{tx.date}</div>}
      </div>
      <div className="tx-item-right">
        <div className={`tx-amount ${tx.amount < 0 ? "neg" : "pos"}`}>{formatLedgerAmount(tx.amount)}</div>
        <div className="tx-item-actions">
          {canRecurring && (
            <button
              type="button"
              className="btn-icon-recurring"
              title={hasRecurring ? "Edit recurring schedule" : "Mark as recurring bill"}
              onClick={() => onManageRecurring(tx)}
            >
              🔁
            </button>
          )}
          {canDelete && (
            <button type="button" className="btn-icon-delete" title="Remove this entry" onClick={() => onDeletePersisted(tx.id)}>
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
