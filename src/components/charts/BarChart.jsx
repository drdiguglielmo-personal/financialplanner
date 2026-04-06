import { useState } from "react";

export default function BarChart({ data }) {
  const [tooltip, setTooltip] = useState(null);
  const W = 600,
    H = 180,
    PAD = { top: 10, right: 20, bottom: 30, left: 50 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const barW = (chartW / data.length) * 0.5;
  const maxVal = Math.max(...data.map((d) => d.total)) * 1.2;
  const px = (i) => PAD.left + (chartW / data.length) * i + (chartW / data.length - barW) / 2;
  const bh = (v) => (v / maxVal) * chartH;
  const by = (v) => PAD.top + chartH - bh(v);

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg-wrap" style={{ cursor: "crosshair" }}>
        {data.map((d, i) => (
          <g
            key={i}
            onMouseEnter={() => setTooltip({ idx: i, x: px(i) + barW / 2, y: by(d.total) })}
            onMouseLeave={() => setTooltip(null)}
          >
            <rect x={px(i)} y={PAD.top + chartH} width={barW} height={0} fill="rgba(255,255,255,0.05)" rx="3" />
            <rect
              x={px(i)}
              y={by(d.total)}
              width={barW}
              height={bh(d.total)}
              fill={tooltip?.idx === i ? "#4ade80" : "rgba(74,222,128,0.4)"}
              rx="4"
              style={{ transition: "fill 0.15s, height 0.6s, y 0.6s" }}
            />
            <text
              x={px(i) + barW / 2}
              y={H - 8}
              textAnchor="middle"
              fill="#4a5a70"
              fontSize="10"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              {d.month}
            </text>
          </g>
        ))}
        <line
          x1={PAD.left}
          x2={PAD.left}
          y1={PAD.top}
          y2={PAD.top + chartH}
          stroke="rgba(255,255,255,0.05)"
        />
      </svg>
      {tooltip && (
        <div
          className="tooltip-box"
          style={{
            left: `${(tooltip.x / W) * 100}%`,
            top: `${(tooltip.y / H) * 100}%`,
            transform: "translate(-50%, -130%)",
          }}
        >
          <div className="tooltip-label">{data[tooltip.idx].month}</div>
          <div className="tooltip-val">${data[tooltip.idx].total.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}
