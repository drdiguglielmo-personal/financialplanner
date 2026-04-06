import { useState } from "react";
import { MONTHLY_SPENDING_DB } from "../../data/mockData.js";

export default function DonutChart({ selectedMonth }) {
  const [hovered, setHovered] = useState(null);
  const monthData =
    MONTHLY_SPENDING_DB.find((d) => d.month === selectedMonth) ||
    MONTHLY_SPENDING_DB[MONTHLY_SPENDING_DB.length - 1];
  const cats = [
    { name: "Housing", val: monthData.housing, color: "#60a5fa" },
    { name: "Groceries", val: monthData.groceries, color: "#34d399" },
    { name: "Dining", val: monthData.dining, color: "#fb923c" },
    { name: "Entertainment", val: monthData.entertainment, color: "#a78bfa" },
    { name: "Transport", val: monthData.transport, color: "#f472b6" },
    { name: "Other", val: monthData.other, color: "#fbbf24" },
  ];

  const total = cats.reduce((s, c) => s + c.val, 0);
  const R = 70,
    CX = 90,
    CY = 90,
    strokeW = 28;
  const circ = 2 * Math.PI * R;

  let offset = 0;
  const slices = cats.map((c) => {
    const dash = (c.val / total) * circ;
    const slice = { ...c, dashArray: `${dash - 2} ${circ - dash + 2}`, dashOffset: -offset };
    offset += dash;
    return slice;
  });

  return (
    <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
      <div style={{ flexShrink: 0, position: "relative" }}>
        <svg viewBox="0 0 180 180" width="160" height="160">
          {slices.map((s, i) => (
            <circle
              key={i}
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={strokeW}
              strokeDasharray={s.dashArray}
              strokeDashoffset={s.dashOffset}
              strokeLinecap="butt"
              style={{
                transformOrigin: `${CX}px ${CY}px`,
                transform: "rotate(-90deg)",
                opacity: hovered === null || hovered === i ? 1 : 0.3,
                transition: "opacity 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          <text
            x={CX}
            y={CY - 8}
            textAnchor="middle"
            fill="#f0f4ff"
            style={{ fontFamily: "Syne, sans-serif", fontSize: 18, fontWeight: 700 }}
          >
            ${hovered !== null ? slices[hovered].val : total.toLocaleString()}
          </text>
          <text
            x={CX}
            y={CY + 12}
            textAnchor="middle"
            fill="#4a5a70"
            fontSize="10"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            {hovered !== null ? slices[hovered].name : "Total"}
          </text>
        </svg>
      </div>
      <div className="legend" style={{ flexDirection: "column", gap: "8px" }}>
        {slices.map((s, i) => (
          <div
            key={i}
            className="legend-item"
            style={{ cursor: "pointer", opacity: hovered === null || hovered === i ? 1 : 0.4, transition: "opacity 0.2s" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="legend-dot" style={{ background: s.color }} />
            <span style={{ flex: 1, color: "#8899b0", fontSize: 13 }}>{s.name}</span>
            <span style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 600, color: "#f0f4ff" }}>
              ${s.val.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
