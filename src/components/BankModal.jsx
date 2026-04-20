import { useState } from "react";
import { getDefaultBankProvider } from "../services/bankProvider/index.js";

export default function BankModal({ onClose, onConnect }) {
  const [selected, setSelected] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const banks = [
    { id: "chase", name: "Chase", type: "Checking & Savings", icon: "🏦" },
    { id: "ally", name: "Ally Bank", type: "High-yield Savings", icon: "🟩" },
    { id: "bofa", name: "Bank of America", type: "Checking & Credit", icon: "🔴" },
    { id: "wellsfargo", name: "Wells Fargo", type: "Checking & Savings", icon: "🟡" },
  ];

  const handleConnect = async () => {
    if (!selected) return;
    setConnecting(true);
    const result = await getDefaultBankProvider().connect(selected);
    onConnect(result);
    setConnecting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Connect Your Bank</div>
        <div className="modal-sub">
          Select your bank. This is a demo — no real credentials are needed. Your data stays private and encrypted.
        </div>

        {banks.map((b) => (
          <div
            key={b.id}
            className={`bank-option ${selected === b.id ? "selected" : ""}`}
            onClick={() => setSelected(b.id)}
          >
            <div className="bank-option-icon">{b.icon}</div>
            <div>
              <div className="bank-option-name">{b.name}</div>
              <div className="bank-option-type">{b.type}</div>
            </div>
            {selected === b.id && <div className="bank-option-check">✓</div>}
          </div>
        ))}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            style={{ flex: 2 }}
            onClick={handleConnect}
            disabled={!selected || connecting}
          >
            {connecting && <span className="loading-spin" />}
            {connecting ? "Connecting…" : "Connect Bank"}
          </button>
        </div>
      </div>
    </div>
  );
}
