import { EXPENSE_CATEGORIES, CATEGORY_COLORS } from "../data/mockData.js";
import { downloadCsv, openPrintableReport } from "../utils/exportReports.js";

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
  const exportRows = EXPENSE_CATEGORIES.map((cat) => {
    const cap = categoryBudgets[cat] ?? 0;
    const spent = spendingByCategory[cat] ?? 0;
    return { category: cat, budget: cap, spent };
  }).filter((r) => r.budget > 0 || r.spent > 0);

  const totalSpent = exportRows.reduce((s, r) => s + r.spent, 0);

  const handleExportCsv = () => {
    const fn = `smartbudget-spending-by-category-${yearMonth}.csv`;
    downloadCsv(
      fn,
      ["Month", "Category", "Budget", "Spent"],
      exportRows.map((r) => [
        yearMonth,
        r.category,
        r.budget.toFixed(2),
        r.spent.toFixed(2),
      ])
    );
  };

  const handleExportPdf = () => {
    openPrintableReport({
      title: "Monthly spending by category",
      subtitle: `${yearMonth} • Total spent: $${totalSpent.toFixed(2)}`,
      columns: ["Category", "Budget", "Spent"],
      rows: exportRows.map((r) => [r.category, `$${r.budget.toFixed(2)}`, `$${r.spent.toFixed(2)}`]),
    });
  };

  return (
    <div className="panel-stack">
      <div className="chart-card">
        <div className="chart-header">
          <div>
            <div className="chart-title">Monthly budgets</div>
            <div className="chart-sub">Set a spending cap per category and compare to actual spending this month</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", justifyContent: "flex-end" }}>
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
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn-secondary" style={{ padding: "10px 12px", flex: "0 0 auto" }} onClick={handleExportCsv} disabled={exportRows.length === 0}>
                Export CSV
              </button>
              <button type="button" className="btn-secondary" style={{ padding: "10px 12px", flex: "0 0 auto" }} onClick={handleExportPdf} disabled={exportRows.length === 0}>
                Export PDF
              </button>
            </div>
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
