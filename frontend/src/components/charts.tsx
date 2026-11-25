import type { CountRow } from "@/lib/stats";

const TONES = ["#0056ff", "#1f3892", "#00dee3", "#5db4ff", "#003ec4", "#7ec8ff"];

export function AreaChart({ series }: { series: CountRow[] }) {
  const width = 640;
  const height = 200;
  const pad = { l: 32, r: 8, t: 16, b: 28 };
  const max = Math.max(1, ...series.map((row) => row.value));
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const points = series.map((row, index) => {
    const x = pad.l + (series.length <= 1 ? innerW / 2 : (index / (series.length - 1)) * innerW);
    const y = pad.t + innerH - (row.value / max) * innerH;
    return { ...row, x, y };
  });
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const area =
    points.length > 0
      ? `${line} L${points[points.length - 1].x.toFixed(1)},${pad.t + innerH} L${points[0].x.toFixed(1)},${pad.t + innerH} Z`
      : "";
  const ticks = [0, Math.round(max / 2), max];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Weekly diagnoses">
      {ticks.map((tick) => {
        const y = pad.t + innerH - (tick / max) * innerH;
        return (
          <g key={tick}>
            <line x1={pad.l} x2={width - pad.r} y1={y} y2={y} stroke="#d5e3f7" strokeWidth="1" />
            <text x={pad.l - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#5c6d8f">
              {tick}
            </text>
          </g>
        );
      })}
      <path d={area} fill="#0056ff" opacity="0.16" />
      <path d={line} fill="none" stroke="#0056ff" strokeWidth="2" />
      {points.map((point) => (
        <g key={point.label}>
          <circle cx={point.x} cy={point.y} r="3" fill="#ffffff" stroke="#0056ff" strokeWidth="2" />
          <text x={point.x} y={height - 8} textAnchor="middle" fontSize="10" fill="#5c6d8f">
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function BarList({ rows, tone = "#0056ff" }: { rows: CountRow[]; tone?: string }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  if (rows.length === 0) return <p className="text-sm text-muted">Nothing in this window.</p>;
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{row.label}</span>
            <span className="shrink-0 tabular-nums text-muted">
              {row.value}
              {row.hint ? <span className="ml-2 text-xs">{row.hint}</span> : null}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-sand">
            <div className="h-1.5 rounded-full" style={{ width: `${(row.value / max) * 100}%`, background: tone }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SplitBar({ rows }: { rows: CountRow[] }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  return (
    <div>
      <div className="flex h-14 overflow-hidden rounded-md">
        {rows.map((row, index) => (
          <div
            key={row.label}
            style={{ width: `${(row.value / total) * 100}%`, background: TONES[index % TONES.length] }}
            className="flex min-w-0 items-end px-2 py-1.5 text-white"
            title={`${row.label}: ${row.value}`}
          >
            {(row.value / total) * 100 > 12 ? <span className="truncate text-[11px] font-medium">{row.label}</span> : null}
          </div>
        ))}
      </div>
      <ul className="mt-3 grid gap-1 sm:grid-cols-2">
        {rows.map((row, index) => (
          <li key={row.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: TONES[index % TONES.length] }} />
              <span className="truncate">{row.label}</span>
            </span>
            <span className="tabular-nums text-muted">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
