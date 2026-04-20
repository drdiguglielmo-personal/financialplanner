import { useState, useMemo, useCallback } from "react";
import { EXPENSE_CATEGORIES } from "../data/mockData.js";
import TransactionListItem from "./TransactionListItem.jsx";
import RecurringBillModal from "./RecurringBillModal.jsx";
import { parseCsv, buildTransactionsFromMappedRows } from "../utils/csvImport.js";
import { formatLedgerAmount } from "../utils/formatMoney.js";
import { buildUpcomingRecurringOccurrences } from "../utils/recurring.js";

/**
 * @param {string[]} cells
 */
function guessColumnIndices(cells) {
  const lower = cells.map((c) => String(c).toLowerCase().trim());
  const find = (re) => {
    const i = lower.findIndex((h) => re.test(h));
    return i >= 0 ? i : null;
  };
  return {
    colDate: find(/\b(date|posted|trans\s*date)\b/) ?? 0,
    colName: find(/\b(name|description|memo|merchant|payee)\b/) ?? Math.min(1, Math.max(0, cells.length - 1)),
    colAmount: find(/\b(amount|debit|credit)\b/) ?? Math.min(2, Math.max(0, cells.length - 1)),
    colCategory: find(/\b(category|type)\b/),
  };
}

/**
 * @param {{
 *   transactions: Array<{ id: string, name: string, category: string, amount: number, date: string, icon?: string, color?: string, source?: string }>,
 *   persistedTransactions: object[],
 *   onAddExpense: (payload: { name: string, amount: number, category: string, date: string }) => void,
 *   onDeletePersisted?: (id: string) => void,
 *   onImportCsv: (incoming: object[]) => void | Promise<void>,
 *   onUpdateRecurring: (id: string, recurring: object | null) => void | Promise<void>,
 *   bankConnected: boolean,
 * }} props
 */
export default function TransactionsPanel({
  transactions,
  persistedTransactions,
  onAddExpense,
  onDeletePersisted,
  onImportCsv,
  onUpdateRecurring,
  bankConnected,
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0] || "Groceries");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [csvFileName, setCsvFileName] = useState("");
  const [csvRows, setCsvRows] = useState(/** @type {string[][]} */ ([]));
  const [headerRow, setHeaderRow] = useState(true);
  const [colDate, setColDate] = useState(0);
  const [colName, setColName] = useState(0);
  const [colAmount, setColAmount] = useState(0);
  const [colCategory, setColCategory] = useState(-1);
  const [expenseAmountsPositive, setExpenseAmountsPositive] = useState(true);
  const [csvMessage, setCsvMessage] = useState(/** @type {string | null} */ (null));
  const [csvImporting, setCsvImporting] = useState(false);
  const [recurringModalTx, setRecurringModalTx] = useState(/** @type {object | null} */ (null));

  const upcomingOccurrences = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return buildUpcomingRecurringOccurrences(persistedTransactions, { todayStr, horizonDays: 45, maxOccurrencesPerSeries: 4 });
  }, [persistedTransactions]);

  const headerCells = csvRows[0] || [];
  const columnCount = useMemo(() => Math.max(0, ...csvRows.map((r) => r.length), 0), [csvRows]);

  const columnOptions = useMemo(() => {
    const labels = headerRow && headerCells.length ? headerCells : csvRows[0] || [];
    const n = Math.max(columnCount, labels.length, 1);
    return Array.from({ length: n }, (_, i) => ({
      value: i,
      label: `${i}: ${labels[i] != null && String(labels[i]).trim() ? String(labels[i]).slice(0, 36) : "(empty)"}`,
    }));
  }, [csvRows, headerRow, headerCells, columnCount]);

  const applyGuess = useCallback(() => {
    if (!headerCells.length) return;
    const g = guessColumnIndices(headerCells);
    setColDate(g.colDate);
    setColName(g.colName);
    setColAmount(g.colAmount);
    setColCategory(g.colCategory != null ? g.colCategory : -1);
  }, [headerCells]);

  const onCsvFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCsvMessage(null);
    setCsvFileName(file.name);
    const text = await file.text();
    const rows = parseCsv(text);
    setCsvRows(rows);
    if (rows.length && rows[0]?.length) {
      const guess = guessColumnIndices(rows[0].map((c) => String(c)));
      setHeaderRow(true);
      setColDate(guess.colDate);
      setColName(guess.colName);
      setColAmount(guess.colAmount);
      setColCategory(guess.colCategory != null ? guess.colCategory : -1);
    } else {
      setHeaderRow(false);
      setColDate(0);
      setColName(0);
      setColAmount(0);
      setColCategory(-1);
    }
  };

  const handleCsvImport = async () => {
    if (!csvRows.length) {
      setCsvMessage("Choose a CSV file first.");
      return;
    }
    setCsvImporting(true);
    setCsvMessage(null);
    try {
      const { transactions: built, skipped, errors } = buildTransactionsFromMappedRows({
        rows: csvRows,
        headerRow,
        colDate,
        colName,
        colAmount,
        colCategory: colCategory < 0 ? null : colCategory,
        expenseAmountsPositive,
        fileName: csvFileName || "import.csv",
      });
      if (!built.length) {
        setCsvMessage(errors[0] || "No valid rows to import. Check column mapping.");
        return;
      }
      await onImportCsv(built);
      setCsvMessage(`Imported ${built.length} row(s).${skipped ? ` Skipped ${skipped}.` : ""}`);
      setCsvRows([]);
      setCsvFileName("");
    } catch (err) {
      setCsvMessage(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setCsvImporting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!name.trim() || !Number.isFinite(n) || n <= 0) return;
    onAddExpense({ name: name.trim(), amount: n, category, date });
    setName("");
    setAmount("");
    setDate(new Date().toISOString().slice(0, 10));
  };

  return (
    <div className="panel-stack">
      <div className="chart-card">
        <div className="chart-header">
          <div>
            <div className="chart-title">Import from bank (CSV)</div>
            <div className="chart-sub">
              Export transactions from your bank&apos;s website, then map columns here. Plaid live linking is scaffolded under{" "}
              <code className="inline-code">src/services/bankProvider/</code> (not wired yet).
            </div>
          </div>
        </div>
        <div className="csv-import-block">
          <div className="field">
            <label htmlFor="csv-file">CSV file</label>
            <input id="csv-file" type="file" accept=".csv,text/csv" onChange={onCsvFile} />
          </div>
          {csvRows.length > 0 && (
            <>
              <div className="expense-form-grid">
                <label className="csv-check">
                  <input type="checkbox" checked={headerRow} onChange={(e) => setHeaderRow(e.target.checked)} />
                  First row is column headers
                </label>
                <label className="csv-check">
                  <input
                    type="checkbox"
                    checked={expenseAmountsPositive}
                    onChange={(e) => setExpenseAmountsPositive(e.target.checked)}
                  />
                  Spending amounts are positive in the file (flip sign for expenses)
                </label>
              </div>
              <div className="expense-form-grid">
                <div className="field">
                  <label htmlFor="csv-date">Date column</label>
                  <select id="csv-date" value={colDate} onChange={(e) => setColDate(Number(e.target.value))}>
                    {columnOptions.map((o) => (
                      <option key={`d-${o.value}`} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="csv-name">Description column</label>
                  <select id="csv-name" value={colName} onChange={(e) => setColName(Number(e.target.value))}>
                    {columnOptions.map((o) => (
                      <option key={`n-${o.value}`} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="csv-amt">Amount column</label>
                  <select id="csv-amt" value={colAmount} onChange={(e) => setColAmount(Number(e.target.value))}>
                    {columnOptions.map((o) => (
                      <option key={`a-${o.value}`} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="csv-cat">Category column (optional)</label>
                  <select id="csv-cat" value={colCategory} onChange={(e) => setColCategory(Number(e.target.value))}>
                    <option value={-1}>— None (use Uncategorized) —</option>
                    {columnOptions.map((o) => (
                      <option key={`c-${o.value}`} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {headerRow && (
                <button type="button" className="btn-secondary csv-guess-btn" onClick={applyGuess}>
                  Auto-detect columns from headers
                </button>
              )}
              <div className="csv-preview-wrap">
                <div className="chart-sub">Preview (first 5 data rows)</div>
                <table className="csv-preview-table">
                  <tbody>
                    {csvRows.slice(headerRow ? 1 : 0, headerRow ? 6 : 5).map((row, i) => (
                      <tr key={i}>
                        {row.slice(0, 8).map((cell, j) => (
                          <td key={j}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" className="btn-primary" disabled={csvImporting} onClick={handleCsvImport}>
                {csvImporting ? "Importing…" : "Import into ledger"}
              </button>
            </>
          )}
          {csvMessage && <div className="csv-import-msg">{csvMessage}</div>}
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <div>
            <div className="chart-title">Upcoming bills & subscriptions</div>
            <div className="chart-sub">
              Mark manual or CSV expenses as recurring (🔁) to see projected due dates for the next 45 days.
            </div>
          </div>
        </div>
        {upcomingOccurrences.length === 0 ? (
          <div className="upcoming-empty">No upcoming recurring items. Add an expense, then tap 🔁 on that row to set cadence and next due date.</div>
        ) : (
          <ul className="upcoming-list">
            {upcomingOccurrences.map((row, idx) => (
              <li key={`${row.transactionId}-${row.dueDate}-${idx}`} className="upcoming-row">
                <div className="upcoming-date">{row.dueDate}</div>
                <div className="upcoming-body">
                  <div className="upcoming-name">{row.name}</div>
                  <div className="upcoming-meta">
                    {row.category} · {row.cadence}
                  </div>
                </div>
                <div className="upcoming-amt">{formatLedgerAmount(row.amount)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <div>
            <div className="chart-title">Log an expense</div>
            <div className="chart-sub">Manual entries sync with your account and combine with imported bank activity</div>
          </div>
        </div>
        <form className="expense-form" onSubmit={handleSubmit}>
          <div className="expense-form-grid">
            <div className="field">
              <label htmlFor="exp-name">Description</label>
              <input id="exp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Coffee, gas, etc." required />
            </div>
            <div className="field">
              <label htmlFor="exp-amt">Amount ($)</label>
              <input
                id="exp-amt"
                type="number"
                min={0.01}
                step={0.01}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="exp-cat">Category</label>
              <select id="exp-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="exp-date">Date</label>
              <input id="exp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>
          <button className="btn-primary expense-submit" type="submit" style={{ width: "auto", marginTop: 0 }}>
            Add expense
          </button>
        </form>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <div>
            <div className="chart-title">All activity</div>
            <div className="chart-sub">
              {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
              {!bankConnected && " · Connect demo bank on the dashboard for mock imports"}
            </div>
          </div>
        </div>
        <div className="tx-list">
          {transactions.length === 0 && (
            <div className="tx-empty">No transactions yet. Import a CSV above, add an expense, or connect your bank from the dashboard.</div>
          )}
          {transactions.map((tx) => (
            <TransactionListItem
              key={tx.id}
              tx={tx}
              showDate
              onDeletePersisted={onDeletePersisted}
              onManageRecurring={tx.source === "manual" || tx.source === "csv" ? () => setRecurringModalTx(tx) : undefined}
            />
          ))}
        </div>
      </div>

      {recurringModalTx && (
        <RecurringBillModal
          transaction={recurringModalTx}
          onClose={() => setRecurringModalTx(null)}
          onSave={(recurring) => {
            void onUpdateRecurring(recurringModalTx.id, recurring);
          }}
        />
      )}
    </div>
  );
}
