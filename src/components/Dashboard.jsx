import { useState } from "react";
import { AuthService } from "../services/auth.js";
import { BankService } from "../services/bank.js";
import { MONTHLY_SPENDING_DB, GOALS_DB } from "../data/mockData.js";
import LineChart from "./charts/LineChart.jsx";
import DonutChart from "./charts/DonutChart.jsx";
import BarChart from "./charts/BarChart.jsx";
import BankModal from "./BankModal.jsx";

export default function Dashboard({ user }) {
  const [bankConnected, setBankConnected] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("Jun");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [loadingTx, setLoadingTx] = useState(false);

  const handleBankConnect = async (result) => {
    setBankConnected(true);
    setShowBankModal(false);
    setAccounts(result.accounts);
    setLoadingTx(true);
    const txs = await BankService.getTransactions();
    setTransactions(txs);
    setLoadingTx(false);
  };

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const monthData =
    MONTHLY_SPENDING_DB.find((d) => d.month === selectedMonth) ||
    MONTHLY_SPENDING_DB[MONTHLY_SPENDING_DB.length - 1];
  const prevMonth = MONTHLY_SPENDING_DB[MONTHLY_SPENDING_DB.findIndex((d) => d.month === selectedMonth) - 1];
  const spendChange = prevMonth ? (((monthData.total - prevMonth.total) / prevMonth.total) * 100).toFixed(1) : null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const navItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "transactions", icon: "💳", label: "Transactions" },
    { id: "goals", icon: "🎯", label: "Goals" },
    { id: "accounts", icon: "🏦", label: "Accounts" },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">💸</div>
          <div className="sidebar-logo-text">SmartBudget</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Menu</div>
          {navItems.map((item) => (
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

      <main className="main-content">
        <div className="page-header">
          <div className="page-greeting">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <div className="page-title">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},&nbsp;
            <span>{user.name.split(" ")[0]}</span> 👋
          </div>
        </div>

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
              value: bankConnected ? `$${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—",
              color: "green",
              change: bankConnected ? "↑ $210 this month" : "Connect bank to view",
              changeClass: "up",
            },
            {
              label: "Monthly Spending",
              value: `$${monthData.total.toLocaleString()}`,
              color: "blue",
              change: spendChange
                ? `${spendChange > 0 ? "↑" : "↓"} ${Math.abs(spendChange)}% vs last month`
                : "First month",
              changeClass: spendChange > 0 ? "down" : "up",
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
                <div className="chart-sub">{bankConnected ? `${transactions.length} imported` : "Connect bank to view"}</div>
              </div>
            </div>
            <div className="tx-list">
              {!bankConnected && (
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text3)" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🏦</div>
                  <div style={{ fontSize: 14 }}>Connect your bank to import transactions</div>
                </div>
              )}
              {bankConnected && loadingTx && (
                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text2)" }}>
                  <span className="loading-spin" />
                  Importing transactions…
                </div>
              )}
              {bankConnected &&
                !loadingTx &&
                transactions.slice(0, 7).map((tx) => (
                  <div key={tx.id} className="tx-item">
                    <div className="tx-icon" style={{ background: `${tx.color}18` }}>
                      {tx.icon}
                    </div>
                    <div className="tx-info">
                      <div className="tx-name">{tx.name}</div>
                      <div className="tx-cat">{tx.category}</div>
                    </div>
                    <div className={`tx-amount ${tx.amount < 0 ? "neg" : "pos"}`}>
                      {tx.amount < 0 ? "-" : "+"}${Math.abs(tx.amount).toFixed(2)}
                    </div>
                  </div>
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
            {GOALS_DB.map((g) => {
              const pct = Math.round((g.current / g.target) * 100);
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
                    <div className="goal-bar-fill" style={{ width: `${pct}%`, background: g.color }} />
                  </div>
                  <div className="goal-pct">
                    {pct}% complete · ${(g.target - g.current).toLocaleString()} to go
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {showBankModal && <BankModal onClose={() => setShowBankModal(false)} onConnect={handleBankConnect} />}
    </div>
  );
}
