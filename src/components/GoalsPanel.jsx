import { useState } from "react";

const PRESET_COLORS = ["#4ade80", "#60a5fa", "#f472b6", "#fb923c", "#a78bfa", "#34d399", "#fbbf24"];

/**
 * @param {{
 *   goals: Array<{ id: string, name: string, target: number, current: number, color: string, icon: string }>,
 *   onUpdateCurrent: (id: string, current: number) => void,
 *   onUpdateTarget: (id: string, target: number) => void,
 *   onAddGoal: (payload: { name: string, target: number, current?: number, color?: string, icon?: string }) => void,
 *   onRemoveGoal: (id: string) => void,
 * }} props
 */
export default function GoalsPanel({ goals, onUpdateCurrent, onUpdateTarget, onAddGoal, onRemoveGoal }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const handleAdd = (e) => {
    e.preventDefault();
    const t = parseFloat(target);
    if (!name.trim() || !Number.isFinite(t) || t <= 0) return;
    onAddGoal({ name: name.trim(), target: t, current: 0, color, icon: icon.trim() || "🎯" });
    setName("");
    setTarget("");
  };

  return (
    <div className="panel-stack">
      <div className="chart-card">
        <div className="chart-header">
          <div>
            <div className="chart-title">Savings goals</div>
            <div className="chart-sub">Set targets and update your saved amount as you go</div>
          </div>
        </div>

        {goals.map((g) => {
          const pct = g.target > 0 ? Math.round((g.current / g.target) * 100) : 0;
          const remaining = Math.max(0, g.target - g.current);
          return (
            <div key={g.id} className="goal-item goal-item-editable">
              <div className="goal-header">
                <div className="goal-name">
                  {g.icon} {g.name}
                </div>
                <button type="button" className="btn-ghost-danger" onClick={() => onRemoveGoal(g.id)}>
                  Remove
                </button>
              </div>
              <div className="goal-edit-row">
                <div className="field goal-field">
                  <label>Saved ($)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={g.current}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (Number.isFinite(v)) onUpdateCurrent(g.id, Math.max(0, v));
                    }}
                  />
                </div>
                <div className="field goal-field">
                  <label>Target ($)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={g.target}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (Number.isFinite(v) && v > 0) onUpdateTarget(g.id, v);
                    }}
                  />
                </div>
              </div>
              <div className="goal-bar-track">
                <div className="goal-bar-fill" style={{ width: `${Math.min(100, pct)}%`, background: g.color }} />
              </div>
              <div className="goal-pct">
                {pct}% complete · ${remaining.toLocaleString()} to go
              </div>
            </div>
          );
        })}

        <form className="goal-add-form" onSubmit={handleAdd}>
          <div className="chart-title" style={{ fontSize: 15, marginBottom: 12 }}>
            New goal
          </div>
          <div className="goal-add-grid">
            <div className="field">
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vacation fund" required />
            </div>
            <div className="field">
              <label>Target ($)</label>
              <input type="number" min={0} step={1} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="1000" required />
            </div>
            <div className="field">
              <label>Icon</label>
              <input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} />
            </div>
            <div className="field">
              <label>Color</label>
              <div className="color-presets">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-dot ${color === c ? "selected" : ""}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </div>
          <button className="btn-primary" type="submit" style={{ width: "auto", marginTop: 8 }}>
            Add goal
          </button>
        </form>
      </div>
    </div>
  );
}
