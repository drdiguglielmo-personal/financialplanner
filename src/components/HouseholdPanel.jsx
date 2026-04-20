import { useState, useEffect, useCallback } from "react";
import { isBack4AppConfigured } from "../services/parseClient.js";
import {
  cloudHouseholdApproveJoinRequest,
  cloudHouseholdCreate,
  cloudHouseholdInvite,
  cloudHouseholdLeave,
  cloudHouseholdListMine,
  cloudHouseholdListPendingJoinRequestsForAdmin,
  cloudHouseholdRejectJoinRequest,
  cloudHouseholdRequestJoin,
} from "../services/householdCloud.js";

/**
 * @param {{
 *   user: { id: string, name: string, email: string },
 *   financeTarget: { type: 'personal' } | { type: 'household', householdId: string, name: string },
 *   onSelectPersonal: () => void,
 *   onSelectHousehold: (h: { householdId: string, name: string }) => void,
 *   onHouseholdsChanged: () => void,
 * }} props
 */
export default function HouseholdPanel({
  user,
  financeTarget,
  onSelectPersonal,
  onSelectHousehold,
  onHouseholdsChanged,
}) {
  const [households, setHouseholds] = useState(/** @type {Array<{ householdId: string, name: string, role: string }>} */ ([]));
  const [joinRequests, setJoinRequests] = useState(
    /** @type {Array<{ requestId: string, householdId: string, householdName: string, requesterName: string, requesterEmail: string, role: string }>} */ ([])
  );
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [info, setInfo] = useState(/** @type {string | null} */ (null));
  const [busy, setBusy] = useState(false);
  const [createName, setCreateName] = useState("");
  const [inviteHouseholdId, setInviteHouseholdId] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [lastInvite, setLastInvite] = useState(/** @type {{ inviteId: string, inviteToken: string } | null} */ (null));
  const [acceptInviteId, setAcceptInviteId] = useState("");
  const [acceptToken, setAcceptToken] = useState("");

  const refresh = useCallback(async () => {
    if (!isBack4AppConfigured()) {
      setHouseholds([]);
      setJoinRequests([]);
      setError("Back4App is not configured.");
      return;
    }
    setError(null);
    try {
      const [h, jr] = await Promise.all([cloudHouseholdListMine(), cloudHouseholdListPendingJoinRequestsForAdmin()]);
      setHouseholds(Array.isArray(h) ? h : []);
      setJoinRequests(Array.isArray(jr) ? jr : []);
    } catch (e) {
      setHouseholds([]);
      setJoinRequests([]);
      setError(e instanceof Error ? e.message : "Could not load households.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [user.id, refresh]);

  useEffect(() => {
    const admins = households.filter((x) => x.role === "admin");
    if (!admins.length) return;
    if (!inviteHouseholdId || !admins.some((x) => x.householdId === inviteHouseholdId)) {
      setInviteHouseholdId(admins[0].householdId);
    }
  }, [households, inviteHouseholdId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = createName.trim();
    if (!name) return;
    setBusy(true);
    setError(null);
    try {
      const created = await cloudHouseholdCreate(name);
      setCreateName("");
      await refresh();
      onHouseholdsChanged();
      onSelectHousehold({ householdId: created.householdId, name: created.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email || !inviteHouseholdId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await cloudHouseholdInvite({
        householdId: inviteHouseholdId,
        email,
        role: inviteRole === "admin" ? "admin" : "member",
      });
      setInviteEmail("");
      setLastInvite({ inviteId: res.inviteId, inviteToken: res.inviteToken });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleRequestJoin = async (e) => {
    e.preventDefault();
    const id = acceptInviteId.trim();
    const tok = acceptToken.trim();
    if (!id || !tok) return;
    setBusy(true);
    setError(null);
    try {
      await cloudHouseholdRequestJoin(id, tok);
      setAcceptInviteId("");
      setAcceptToken("");
      await refresh();
      onHouseholdsChanged();
      setInfo("Request sent. Ask the household admin to approve it in SmartBudget.");
    } catch (err) {
      setInfo(null);
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async (requestId) => {
    setBusy(true);
    setError(null);
    try {
      const res = await cloudHouseholdApproveJoinRequest(requestId);
      setJoinRequests((prev) => prev.filter((j) => j.requestId !== requestId));
      await refresh();
      onHouseholdsChanged();
      onSelectHousehold({ householdId: res.householdId, name: res.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (requestId) => {
    setBusy(true);
    setError(null);
    try {
      await cloudHouseholdRejectJoinRequest(requestId);
      setJoinRequests((prev) => prev.filter((j) => j.requestId !== requestId));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reject failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async (householdId) => {
    if (!window.confirm("Leave this household? You will lose access to its shared budget data.")) return;
    setBusy(true);
    setError(null);
    try {
      await cloudHouseholdLeave(householdId);
      if (financeTarget.type === "household" && financeTarget.householdId === householdId) {
        onSelectPersonal();
      }
      await refresh();
      onHouseholdsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Leave failed.");
    } finally {
      setBusy(false);
    }
  };

  const adminHouseholds = households.filter((h) => h.role === "admin");

  return (
    <div className="panel-stack">
      <div className="chart-card">
        <div className="chart-header">
          <div>
            <div className="chart-title">Household sharing</div>
            <div className="chart-sub">
              Share one budget with a partner using your Back4App database only—no Cloud Code required. Invites use a secret code;
              the partner requests access and a household admin approves in this app.
            </div>
          </div>
        </div>
        {error && <div className="error-msg household-panel-error">⚠️ {error}</div>}
        {info && !error && (
          <div className="chart-sub" style={{ marginBottom: 12, color: "var(--text)" }}>
            {info}
          </div>
        )}
        <div className="household-active-row">
          <span className="household-active-label">Viewing</span>
          <strong>{financeTarget.type === "personal" ? "Personal budget" : financeTarget.name}</strong>
          {financeTarget.type === "household" && (
            <button type="button" className="btn-ghost-sm" onClick={onSelectPersonal}>
              Switch to personal
            </button>
          )}
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <div>
            <div className="chart-title">Your households</div>
            <div className="chart-sub">Role is set when you join or create a household (creator is admin).</div>
          </div>
          <button type="button" className="btn-secondary" style={{ flex: "0 0 auto", padding: "8px 14px" }} onClick={() => void refresh()} disabled={busy}>
            Refresh
          </button>
        </div>
        {households.length === 0 ? (
          <div className="upcoming-empty">No households yet. Create one below.</div>
        ) : (
          <ul className="household-member-list">
            {households.map((h) => (
              <li key={h.householdId} className="household-member-row">
                <div>
                  <div className="household-member-name">{h.name}</div>
                  <div className="household-member-meta">
                    {h.role === "admin" ? "Admin" : "Member"} · {h.householdId}
                  </div>
                </div>
                <div className="household-member-actions">
                  <button type="button" className="btn-primary" style={{ padding: "8px 14px" }} onClick={() => onSelectHousehold({ householdId: h.householdId, name: h.name })}>
                    Open budget
                  </button>
                  <button type="button" className="btn-ghost-danger" onClick={() => void handleLeave(h.householdId)} disabled={busy}>
                    Leave
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <div>
            <div className="chart-title">Join requests (admins)</div>
            <div className="chart-sub">When someone uses an invite code, they appear here until you approve or reject.</div>
          </div>
        </div>
        {joinRequests.length === 0 ? (
          <div className="upcoming-empty">No pending join requests.</div>
        ) : (
          <ul className="household-invite-list">
            {joinRequests.map((jr) => (
              <li key={jr.requestId} className="household-invite-row">
                <div>
                  <div className="household-member-name">{jr.householdName}</div>
                  <div className="household-member-meta">
                    {jr.requesterName} ({jr.requesterEmail}) · role: {jr.role}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="btn-primary" style={{ padding: "8px 14px" }} disabled={busy} onClick={() => void handleApprove(jr.requestId)}>
                    Approve
                  </button>
                  <button type="button" className="btn-ghost-danger" disabled={busy} onClick={() => void handleReject(jr.requestId)}>
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <div>
            <div className="chart-title">Accept an invite</div>
            <div className="chart-sub">
              Your partner sends an <strong>Invite ID</strong> and <strong>invite code</strong> from SmartBudget. Enter them here (you must use the same email they
              invited).
            </div>
          </div>
        </div>
        <form className="household-inline-form" onSubmit={handleRequestJoin} style={{ flexWrap: "wrap", gap: 12 }}>
          <input
            className="household-text-input"
            value={acceptInviteId}
            onChange={(e) => setAcceptInviteId(e.target.value)}
            placeholder="Invite ID"
            autoComplete="off"
            style={{ minWidth: 200 }}
          />
          <input
            className="household-text-input"
            value={acceptToken}
            onChange={(e) => setAcceptToken(e.target.value)}
            placeholder="Invite code"
            autoComplete="off"
            style={{ minWidth: 200 }}
          />
          <button className="btn-primary" type="submit" disabled={busy || !acceptInviteId.trim() || !acceptToken.trim()}>
            Request access
          </button>
        </form>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <div>
            <div className="chart-title">Create a household</div>
            <div className="chart-sub">Creates a shared HouseholdFinance row and makes you admin.</div>
          </div>
        </div>
        <form className="household-inline-form" onSubmit={handleCreate}>
          <input
            className="household-text-input"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="Household name"
            maxLength={80}
          />
          <button className="btn-primary" type="submit" disabled={busy || !createName.trim()}>
            Create
          </button>
        </form>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <div>
            <div className="chart-title">Invite a partner</div>
            <div className="chart-sub">
              Enter their SmartBudget account email. After you send, copy the <strong>Invite ID</strong> and <strong>code</strong> to them—they need both to request
              access.
            </div>
          </div>
        </div>
        {adminHouseholds.length === 0 ? (
          <div className="upcoming-empty">You need to be a household admin to send invites.</div>
        ) : (
          <form className="household-invite-form" onSubmit={handleInvite}>
            <div className="field">
              <label htmlFor="inv-hh">Household</label>
              <select id="inv-hh" value={inviteHouseholdId} onChange={(e) => setInviteHouseholdId(e.target.value)}>
                {adminHouseholds.map((h) => (
                  <option key={h.householdId} value={h.householdId}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="inv-em">Partner email</label>
              <input id="inv-em" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="partner@email.com" required />
            </div>
            <div className="field">
              <label htmlFor="inv-role">Role</label>
              <select id="inv-role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                <option value="member">Member (edit shared budget)</option>
                <option value="admin">Admin (invite and remove others)</option>
              </select>
            </div>
            <button className="btn-primary" type="submit" disabled={busy || !inviteEmail.trim()}>
              Create invite
            </button>
          </form>
        )}
        {lastInvite && (
          <div className="chart-sub" style={{ marginTop: 16, padding: 12, background: "var(--surface2)", borderRadius: 8 }}>
            <div>
              <strong>Send to your partner:</strong>
            </div>
            <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: 13 }}>
              Invite ID: {lastInvite.inviteId}
            </div>
            <div style={{ marginTop: 4, fontFamily: "monospace", fontSize: 13 }}>
              Code: {lastInvite.inviteToken}
            </div>
            <button type="button" className="btn-ghost-sm" style={{ marginTop: 8 }} onClick={() => setLastInvite(null)}>
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
