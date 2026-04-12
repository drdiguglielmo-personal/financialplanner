import { useState, useEffect, useMemo, useCallback } from "react";
import { AuthService } from "../services/auth.js";
import { BankService } from "../services/bank.js";
import {
  applySetCategoryBudget,
  applyAddManualExpense,
  applyDeleteManualExpense,
  applyUpdateGoal,
  applyAddGoal,
  applyRemoveGoal,
} from "../services/userFinance.js";
import { loadPersistedFinance, persistFinance } from "../services/financeSync.js";
import { MONTHLY_SPENDING_DB } from "../data/mockData.js";
import { mergeTransactions, spendingByCategoryForMonth, totalSpendingForMonth } from "../utils/finance.js";
import { formatUsd } from "../utils/formatMoney.js";
import { NAV, NAV_ITEMS, secondaryPageTitle } from "../constants/navigation.js";
import LineChart from "./charts/LineChart.jsx";
import DonutChart from "./charts/DonutChart.jsx";
import BarChart from "./charts/BarChart.jsx";
import BankModal from "./BankModal.jsx";
import BudgetsPanel from "./BudgetsPanel.jsx";
import TransactionsPanel from "./TransactionsPanel.jsx";
import GoalsPanel from "./GoalsPanel.jsx";
import AccountsPanel from "./AccountsPanel.jsx";
import TransactionListItem from "./TransactionListItem.jsx";

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function previousYearMonth(ym) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function Dashboard({ user }) {
  const [bankConnected, setBankConnected] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("Jun");
  const [activeNav, setActiveNav] = useState(NAV.DASHBOARD);
  const [budgets, setBudgets] = useState(() => ({}));
  const [manualExpenses, setManualExpenses] = useState(() => []);
  const [goals, setGoals] = useState(() => []);
  const [budgetMonth, setBudgetMonth] = useState(currentYearMonth);
  const [financeReady, setFinanceReady] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setFinanceReady(false);
      try {
        const bundle = await loadPersistedFinance(user.id);
        if (cancelled) return;
        setBudgets(bundle.budgets);
        setManualExpenses(bundle.manualExpenses);
        setGoals(bundle.goals);
        const connected = Boolean(bundle.bankConnected);
        setBankConnected(connected);
        if (connected) {
          const [acc, txs] = await Promise.all([BankService.getAccounts(), BankService.getTransactions()]);
          if (cancelled) return;
          setAccounts(acc);
          setTransactions(txs);
        } else {
          setAccounts([]);
          setTransactions([]);
        }
      } finally {
        if (!cancelled) setFinanceReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const persist = useCallback(
    async (overrides = {}) => {
      await persistFinance(user.id, {
        budgets,
        manualExpenses,
        goals,
        bankConnected,
        ...overrides,
      });
    },
    [user.id, budgets, manualExpenses, goals, bankConnected]
  );

  const mergedTransactions = useMemo(
    () => mergeTransactions(transactions, manualExpenses),
    [transactions, manualExpenses]
  );

  const liveMonth = currentYearMonth();
  const spentThisMonth = useMemo(
    () => totalSpendingForMonth(mergedTransactions, liveMonth),
    [mergedTransactions, liveMonth]
  );
  const spentPrevMonth = useMemo(
    () => totalSpendingForMonth(mergedTransactions, previousYearMonth(liveMonth)),
    [mergedTransactions, liveMonth]
  );

  const handleBankConnect = async (result) => {
    setBankConnected(true);
    setShowBankModal(false);
    setAccounts(result.accounts);
    const txs = await BankService.getTransactions();
    setTransactions(txs);
    await persist({ bankConnected: true });
  };

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const monthSpendChange =
    spentPrevMonth > 0 ? (((spentThisMonth - spentPrevMonth) / spentPrevMonth) * 100).toFixed(1) : null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const nonDashboardTitle = secondaryPageTitle(activeNav);

  const categoryBudgets = budgets[budgetMonth] || {};
  const spendingByCategoryForBudgetMonth = useMemo(
    () => spendingByCategoryForMonth(mergedTransactions, budgetMonth),
    [mergedTransactions, budgetMonth]
  );

  const handleBudgetChange = async (category, amount) => {
    const nextBudgets = applySetCategoryBudget(budgets, budgetMonth, category, amount);
    setBudgets(nextBudgets);
    await persist({ budgets: nextBudgets });
  };

  const handleAddExpense = async (payload) => {
    const { manualExpenses: nextManual } = applyAddManualExpense(manualExpenses, payload);
    setManualExpenses(nextManual);
    await persist({ manualExpenses: nextManual });
  };

  const handleDeleteManual = async (id) => {
    const nextManual = applyDeleteManualExpense(manualExpenses, id);
    setManualExpenses(nextManual);
    await persist({ manualExpenses: nextManual });
  };

  const handleUpdateGoalCurrent = async (id, current) => {
    const next = applyUpdateGoal(goals, id, { current });
    setGoals(next);
    await persist({ goals: next });
  };

  const handleUpdateGoalTarget = async (id, target) => {
    const next = applyUpdateGoal(goals, id, { target });
    setGoals(next);
    await persist({ goals: next });
  };

  const handleAddGoal = async (payload) => {
    const next = applyAddGoal(goals, payload);
    setGoals(next);
    await persist({ goals: next });
  };

  const handleRemoveGoal = async (id) => {
    const next = applyRemoveGoal(goals, id);
    setGoals(next);
    await persist({ goals: next });
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">💸</div>
          <div className="sidebar-logo-text">SmartBudget</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Menu</div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeNav === item.id ? "active" : ""}`}
              onClick={() => setActiveNav(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">New Graduate</div>
          </div>
          <button
            className="btn-logout"
            title="Sign out"
            onClick={async () => {
              await AuthService.logout();
              window.location.reload();
            }}
          >
            ↩
          </button>
        </div>
      </aside>

      <main className={`main-content ${!financeReady ? "finance-locked" : ""}`}>
        {!financeReady && (
          <div className="finance-loading-banner" role="status">
            <span className="loading-spin" /> Syncing your budgets and goals…
          </div>
        )}
        <div className="page-header">
          <div className="page-greeting">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <div className="page-title">
            {activeNav === NAV.DASHBOARD ? (
              <>
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},&nbsp;
                <span>{user.name.split(" ")[0]}</span> 👋
              </>
            ) : (
              nonDashboardTitle
            )}
          </div>
        </div>

        {activeNav === NAV.DASHBOARD && (
          <>
            <div className="bank-banner">
              <div className="bank-banner-left">
                <div className="bank-icon">🏦</div>
                <div>
                  <div className="bank-banner-title">{bankConnected ? "Bank Connected" : "Connect Your Bank Account"}</div>
                  <div className="bank-banner-sub">
                    {bankConnected
                      ? `${accounts.length} account(s) synced — transactions imported automatically`
                      : "Link your bank to automatically import and categorize transactions"}
                  </div>
                </div>
              </div>
              {bankConnected ? (
                <div className="connected-badge">
                  <span>✓</span> Connected
                </div>
              ) : (
                <button className="btn-connect" onClick={() => setShowBankModal(true)}>
                  Connect Bank
                </button>
              )}
            </div>

            <div className="stats-row">
              {[
                {
                  label: "Total Balance",
                  value: bankConnected ? formatUsd(totalBalance) : "—",
                  color: "green",
                  change: bankConnected ? "↑ $210 this month" : "Connect bank to view",
                  changeClass: "up",
                },
                {
                  label: "Spending (this month)",
                  value: formatUsd(spentThisMonth),
                  color: "blue",
                  change:
                    monthSpendChange != null
                      ? `${Number(monthSpendChange) > 0 ? "↑" : "↓"} ${Math.abs(Number(monthSpendChange))}% vs last month`
                      : spentPrevMonth <= 0
                        ? "First month of tracking"
                        : "—",
                  changeClass: Number(monthSpendChange) > 0 ? "down" : "up",
                },
                { label: "Savings Rate", value: "24%", color: "pink", change: "↑ 3% from last month", changeClass: "up" },
                { label: "Net Income", value: "$3,500", color: "orange", change: "Direct deposit Jun 1", changeClass: "" },
              ].map((s, i) => (
                <div key={i} className={`stat-card ${s.color}`} style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className={`stat-change ${s.changeClass}`}>{s.change}</div>
                </div>
              ))}
            </div>

            <div className="charts-grid">
              <div className="chart-card full">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Monthly Spending Trend</div>
                    <div className="chart-sub">6-month history with hover to explore</div>
                  </div>
                  <div className="month-tabs">
                    {MONTHLY_SPENDING_DB.map((d) => (
                      <button
                        key={d.month}
                        className={`month-tab ${selectedMonth === d.month ? "active" : ""}`}
                        onClick={() => setSelectedMonth(d.month)}
                      >
                        {d.month}
                      </button>
                    ))}
                  </div>
                </div>
                <LineChart data={MONTHLY_SPENDING_DB} selectedMonth={selectedMonth} />
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Spending by Category</div>
                    <div className="chart-sub">{selectedMonth} breakdown — hover to explore</div>
                  </div>
                </div>
                <DonutChart selectedMonth={selectedMonth} />
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Month Comparison</div>
                    <div className="chart-sub">Total spending per month</div>
                  </div>
                </div>
                <BarChart data={MONTHLY_SPENDING_DB} />
              </div>
            </div>

            <div className="bottom-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Recent Transactions</div>
                    <div className="chart-sub">
                      {mergedTransactions.length} total
                      {bankConnected ? ` · ${transactions.length} from bank` : ""}
                      {manualExpenses.length > 0 ? ` · ${manualExpenses.length} manual` : ""}
                    </div>
                  </div>
                </div>
                <div className="tx-list">
                  {mergedTransactions.length === 0 && (
                    <div className="tx-empty">No transactions yet. Log an expense or connect your bank.</div>
                  )}
                  {mergedTransactions.slice(0, 7).map((tx) => (
                    <TransactionListItem key={tx.id} tx={tx} />
                  ))}
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <div className="chart-title">Savings Goals</div>
                    <div className="chart-sub">Track progress toward your targets</div>
                  </div>
                </div>
                {goals.slice(0, 4).map((g) => {
                  const pct = g.target > 0 ? Math.round((g.current / g.target) * 100) : 0;
                  return (
                    <div key={g.id} className="goal-item">
                      <div className="goal-header">
                        <div className="goal-name">
                          {g.icon} {g.name}
                        </div>
                        <div className="goal-amounts">
                          <span style={{ color: "var(--text)", fontWeight: 500 }}>${g.current.toLocaleString()}</span>
                          <span style={{ color: "var(--text3)" }}> / ${g.target.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="goal-bar-track">
                        <div className="goal-bar-fill" style={{ width: `${Math.min(100, pct)}%`, background: g.color }} />
                      </div>
                      <div className="goal-pct">
                        {pct}% complete · ${Math.max(0, g.target - g.current).toLocaleString()} to go
                      </div>
                    </div>
                  );
                })}
                {goals.length > 4 && (
                  <button type="button" className="btn-link-nav" onClick={() => setActiveNav(NAV.GOALS)}>
                    View all goals →
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {activeNav === NAV.BUDGETS && (
          <BudgetsPanel
            yearMonth={budgetMonth}
            onYearMonthChange={setBudgetMonth}
            categoryBudgets={categoryBudgets}
            spendingByCategory={spendingByCategoryForBudgetMonth}
            onBudgetChange={handleBudgetChange}
          />
        )}

        {activeNav === NAV.TRANSACTIONS && (
          <TransactionsPanel
            transactions={mergedTransactions}
            onAddExpense={handleAddExpense}
            onDeleteManual={handleDeleteManual}
            bankConnected={bankConnected}
          />
        )}

        {activeNav === NAV.GOALS && (
          <GoalsPanel
            goals={goals}
            onUpdateCurrent={handleUpdateGoalCurrent}
            onUpdateTarget={handleUpdateGoalTarget}
            onAddGoal={handleAddGoal}
            onRemoveGoal={handleRemoveGoal}
          />
        )}

        {activeNav === NAV.ACCOUNTS && (
          <AccountsPanel accounts={accounts} bankConnected={bankConnected} onConnectBank={() => setShowBankModal(true)} />
        )}
      </main>

      {showBankModal && <BankModal onClose={() => setShowBankModal(false)} onConnect={handleBankConnect} />}
    </div>
  );
}
