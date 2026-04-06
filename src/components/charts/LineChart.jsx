import { useState, useRef } from "react";

export default function LineChart({ data, selectedMonth }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  const W = 600,
    H = 200,
    PAD = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map((d) => d.total)) * 1.15;
  const xStep = chartW / (data.length - 1);

  const px = (i) => PAD.left + i * xStep;
  const py = (v) => PAD.top + chartH - (v / maxVal) * chartH;

  const pathD = data.map((d, i) => `${i === 0 ? "M" : "L"} ${px(i)} ${py(d.total)}`).join(" ");
  const fillD = pathD + ` L ${px(data.length - 1)} ${PAD.top + chartH} L ${px(0)} ${PAD.top + chartH} Z`;

  const selectedIdx = data.findIndex((d) => d.month === selectedMonth);

  const handleMouseMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (W / rect.width);
    let closest = 0,
      minDist = Infinity;
    data.forEach((_, i) => {
      const d = Math.abs(mouseX - px(i));
      if (d < minDist) {
        minDist = d;
        closest = i;
      }
    });
    setTooltip({ idx: closest, x: px(closest), y: py(data[closest].total) });
  };

  const yTicks = [0, 500, 1000, 1500, 2000, 2500];

  return (
    <div style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="chart-svg-wrap"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        style={{ cursor: "crosshair" }}
      >
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map(
          (v) =>
            v <= maxVal && (
              <g key={v}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + chartW}
                  y1={py(v)}
                  y2={py(v)}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
                <text x={PAD.left - 8} y={py(v) + 4} textAnchor="end" fill="#4a5a70" fontSize="10">
                  ${v >= 1000 ? v / 1000 + "k" : v}
                </text>
              </g>
            )
        )}

        <path d={fillD} fill="url(#lineGrad)" />

        {selectedIdx >= 0 && (
          <rect
            x={px(selectedIdx) - xStep / 2}
            width={xStep}
            y={PAD.top}
            height={chartH}
            fill="rgba(74,222,128,0.05)"
            rx="4"
          />
        )}

        <path
          d={pathD}
          fill="none"
          stroke="#4ade80"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {data.map((d, i) => (
          <g key={i}>
            <circle cx={px(i)} cy={py(d.total)} r="4" fill="#0a0f1e" stroke="#4ade80" strokeWidth="2" />
            <text
              x={px(i)}
              y={PAD.top + chartH + 22}
              textAnchor="middle"
              fill="#4a5a70"
              fontSize="11"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              {d.month}
            </text>
          </g>
        ))}

        {tooltip && <circle cx={tooltip.x} cy={tooltip.y} r="6" fill="#4ade80" opacity="0.9" />}
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
          <div className="tooltip-label">{data[tooltip.idx].month} Spending</div>
          <div className="tooltip-val">${data[tooltip.idx].total.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}
