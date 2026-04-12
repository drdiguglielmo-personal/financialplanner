import { CATEGORY_COLORS } from "../data/mockData.js";
import { formatLedgerAmount } from "../utils/formatMoney.js";

/**
 * @param {{
 *   tx: { id: string, name: string, category: string, amount: number, date?: string, icon?: string, color?: string, source?: string },
 *   showDate?: boolean,
 *   onDeleteManual?: (id: string) => void,
 * }} props
 */
export default function TransactionListItem({ tx, showDate = false, onDeleteManual }) {
  const bg = tx.color || CATEGORY_COLORS[tx.category] || "#8899b0";
  const manual = tx.source === "manual";

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
        </div>
        {showDate && tx.date && <div className="tx-date">{tx.date}</div>}
      </div>
      <div className={`tx-amount ${tx.amount < 0 ? "neg" : "pos"}`}>{formatLedgerAmount(tx.amount)}</div>
      {manual && onDeleteManual && (
        <button type="button" className="btn-icon-delete" title="Remove manual entry" onClick={() => onDeleteManual(tx.id)}>
          ✕
        </button>
      )}
    </div>
  );
}
