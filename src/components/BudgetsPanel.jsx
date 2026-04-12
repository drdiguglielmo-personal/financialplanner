import { EXPENSE_CATEGORIES, CATEGORY_COLORS } from "../data/mockData.js";

/**
 * @param {{
 *   yearMonth: string,
 *   onYearMonthChange: (ym: string) => void,
 *   categoryBudgets: Record<string, number>,
 *   spendingByCategory: Record<string, number>,
 *   onBudgetChange: (category: string, amount: number) => void,
 * }} props
 */
export default function BudgetsPanel({ yearMonth, onYearMonthChange, categoryBudgets, spendingByCategory, onBudgetChange }) {
  return (
    <div className="panel-stack">
      <div className="chart-card">
        <div className="chart-header">
          <div>
            <div className="chart-title">Monthly budgets</div>
            <div className="chart-sub">Set a spending cap per category and compare to actual spending this month</div>
          </div>
          <div className="field-inline">
            <label htmlFor="budget-month">Month</label>
            <input
              id="budget-month"
              className="input-compact"
              type="month"
              value={yearMonth}
              onChange={(e) => onYearMonthChange(e.target.value)}
            />
          </div>
        </div>

        <div className="budget-table-wrap">
          <table className="budget-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Budget</th>
                <th>Spent</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {EXPENSE_CATEGORIES.map((cat) => {
                const cap = categoryBudgets[cat] ?? 0;
                const spent = spendingByCategory[cat] ?? 0;
                const pct = cap > 0 ? Math.min(100, Math.round((spent / cap) * 100)) : null;
                const over = cap > 0 && spent > cap;
                return (
                  <tr key={cat}>
                    <td>
                      <span className="budget-cat-dot" style={{ background: CATEGORY_COLORS[cat] }} />
                      {cat}
                    </td>
                    <td>
                      <div className="budget-input-wrap">
                        <span className="budget-dollar">$</span>
                        <input
                          className="input-compact budget-input"
                          type="number"
                          min={0}
                          step={1}
                          placeholder="0"
                          value={cap || ""}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            onBudgetChange(cat, Number.isFinite(v) ? v : 0);
                          }}
                        />
                      </div>
                    </td>
                    <td className="budget-spent">${spent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>
                      {cap <= 0 ? (
                        <span className="budget-hint">Set a budget to track</span>
                      ) : (
                        <>
                          <div className="budget-bar-track">
                            <div
                              className="budget-bar-fill"
                              style={{
                                width: `${Math.min(100, cap > 0 ? (spent / cap) * 100 : 0)}%`,
                                background: over ? "var(--danger)" : "var(--accent)",
                              }}
                            />
                          </div>
                          <div className={`budget-pct ${over ? "over" : ""}`}>
                            {pct}% used
                            {over && ` · $${(spent - cap).toFixed(2)} over`}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
