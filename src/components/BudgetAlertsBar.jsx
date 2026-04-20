import { formatUsd } from "../utils/formatMoney.js";

/**
 * @param {{
 *   budgetMonth: string,
 *   alerts: Array<{ category: string, spent: number, cap: number, ratio: number, level: 'warn' | 'over' }>,
 *   onDismiss: (category: string, level: 'warn' | 'over') => void,
 *   onOpenBudgets: () => void,
 * }} props
 */
export default function BudgetAlertsBar({ budgetMonth, alerts, onDismiss, onOpenBudgets }) {
  if (!alerts.length) return null;

  const hasOver = alerts.some((a) => a.level === "over");

  return (
    <div
      className={`budget-alerts-stack${hasOver ? " budget-alerts-stack--danger" : ""}`}
      role="region"
      aria-label="Budget notifications"
    >
      <div className="budget-alerts-title">Budget notifications</div>
      <div className="budget-alerts-sub">
        For <strong>{budgetMonth}</strong> — categories at or above 80% of their cap (or over budget).
      </div>
      <ul className="budget-alerts-list">
        {alerts.map((a) => {
          const pct = Math.round(a.ratio * 100);
          const isOver = a.level === "over";
          return (
            <li key={a.category} className={`budget-alert-row ${isOver ? "budget-alert-over" : "budget-alert-warn"}`} role="alert">
              <div className="budget-alert-body">
                <span className="budget-alert-cat">{a.category}</span>
                <span className="budget-alert-detail">
                  {isOver ? (
                    <>
                      Over budget — {formatUsd(a.spent)} of {formatUsd(a.cap)} ({pct}%)
                    </>
                  ) : (
                    <>
                      {pct}% used — {formatUsd(a.spent)} of {formatUsd(a.cap)}
                    </>
                  )}
                </span>
              </div>
              <div className="budget-alert-actions">
                <button type="button" className="btn-ghost-sm" onClick={() => onDismiss(a.category, a.level)}>
                  Dismiss
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="budget-alerts-footer">
        <button type="button" className="btn-link-nav" onClick={onOpenBudgets}>
          Open budgets →
        </button>
      </div>
    </div>
  );
}
