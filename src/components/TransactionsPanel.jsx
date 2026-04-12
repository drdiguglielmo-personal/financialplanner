import { useState } from "react";
import { EXPENSE_CATEGORIES } from "../data/mockData.js";
import TransactionListItem from "./TransactionListItem.jsx";

/**
 * @param {{
 *   transactions: Array<{ id: string, name: string, category: string, amount: number, date: string, icon?: string, color?: string, source?: string }>,
 *   onAddExpense: (payload: { name: string, amount: number, category: string, date: string }) => void,
 *   onDeleteManual?: (id: string) => void,
 *   bankConnected: boolean,
 * }} props
 */
export default function TransactionsPanel({ transactions, onAddExpense, onDeleteManual, bankConnected }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0] || "Groceries");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

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
              {!bankConnected && " · Connect your bank to import more"}
            </div>
          </div>
        </div>
        <div className="tx-list">
          {transactions.length === 0 && (
            <div className="tx-empty">No transactions yet. Add an expense above or connect your bank from the dashboard.</div>
          )}
          {transactions.map((tx) => (
            <TransactionListItem key={tx.id} tx={tx} showDate onDeleteManual={onDeleteManual} />
          ))}
        </div>
      </div>
    </div>
  );
}
