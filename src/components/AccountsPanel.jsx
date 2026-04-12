/**
 * @param {{
 *   accounts: Array<{ id: string, name: string, type: string, balance: number, bank?: string }>,
 *   bankConnected: boolean,
 *   onConnectBank: () => void,
 * }} props
 */
export default function AccountsPanel({ accounts, bankConnected, onConnectBank }) {
  const total = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="panel-stack">
      <div className="chart-card">
        <div className="chart-header">
          <div>
            <div className="chart-title">Accounts</div>
            <div className="chart-sub">
              {bankConnected ? `${accounts.length} linked account${accounts.length !== 1 ? "s" : ""}` : "Connect your bank to sync balances"}
            </div>
          </div>
          {!bankConnected && (
            <button type="button" className="btn-connect" onClick={onConnectBank}>
              Connect Bank
            </button>
          )}
        </div>

        {!bankConnected && (
          <div className="accounts-placeholder">
            <div className="accounts-placeholder-icon">🏦</div>
            <p>Link a bank from the banner on the dashboard to see checking and savings balances here.</p>
          </div>
        )}

        {bankConnected && accounts.length > 0 && (
          <>
            <div className="accounts-total">
              <span className="accounts-total-label">Combined balance</span>
              <span className="accounts-total-value">${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <ul className="accounts-list">
              {accounts.map((a) => (
                <li key={a.id} className="accounts-row">
                  <div>
                    <div className="accounts-name">{a.name}</div>
                    <div className="accounts-meta">
                      {a.bank && `${a.bank} · `}
                      {a.type}
                    </div>
                  </div>
                  <div className="accounts-balance">${a.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
