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

export function MiniBars({ values, tone = "#0056ff" }: { values: number[]; tone?: string }) {
  const width = 88;
  const height = 48;
  const max = Math.max(1, ...values);
  const barW = Math.max(6, Math.floor((width - 8) / values.length) - 4);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-9 w-20 shrink-0" aria-hidden="true">
      {values.map((value, index) => {
        const h = (value / max) * (height - 8);
        const x = 4 + index * (barW + 4);
        return (
          <rect key={index} x={x} y={height - 4 - h} width={barW} height={h} rx="3" fill={tone} opacity={index === values.length - 1 ? 1 : 0.55} />
        );
      })}
    </svg>
  );
}

export function QueueMeter({ left, right, leftLabel, rightLabel }: { left: number; right: number; leftLabel: string; rightLabel: string }) {
  const total = Math.max(1, left + right);
  const leftPct = (left / total) * 100;
  return (
    <div className="w-[5.5rem] shrink-0">
      <div className="flex h-3 overflow-hidden rounded-full bg-[#edf1f7]">
        <div className="h-full bg-clinic" style={{ width: `${leftPct}%` }} />
        <div className="h-full bg-[#c8d6e8]" style={{ width: `${100 - leftPct}%` }} />
      </div>
      <div className="mt-1 space-y-0.5 text-[9px] leading-tight text-[#8b98ab]">
        <p className="truncate">
          <span className="text-clinic">●</span> {leftLabel} {left}
        </p>
        <p className="truncate">
          <span className="text-[#94a8c4]">●</span> {rightLabel} {right}
        </p>
      </div>
    </div>
  );
}

export function UtilizationBars({ values, tone = "#0056ff" }: { values: number[]; tone?: string }) {
  const width = 88;
  const height = 52;
  const max = Math.max(1, ...values);
  const barW = Math.max(5, Math.floor((width - 10) / values.length) - 3);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-9 w-20 shrink-0" aria-hidden="true">
      {values.map((value, index) => {
        const h = (value / max) * (height - 6);
        const x = 5 + index * (barW + 3);
        return <rect key={index} x={x} y={height - 3 - h} width={barW} height={h} rx="2" fill={tone} opacity={0.45 + (value / max) * 0.55} />;
      })}
    </svg>
  );
}

export function Sparkline({ values, tone = "#0056ff", className }: { values: number[]; tone?: string; className?: string }) {
  const width = 132;
  const height = 40;
  const max = Math.max(1, ...values);
  const points = values.map((value, index) => {
    const x = values.length <= 1 ? width / 2 : (index / (values.length - 1)) * (width - 4) + 2;
    const y = height - 4 - (value / max) * (height - 10);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = points.at(-1)?.split(",") ?? ["0", "0"];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className ?? "h-10 w-full"} aria-hidden="true">
      <polyline fill="none" stroke={tone} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={points.join(" ")} />
      <circle cx={last[0]} cy={last[1]} r="3" fill={tone} />
    </svg>
  );
}

export function TrendChart({ series }: { series: CountRow[] }) {
  const width = 680;
  const height = 240;
  const pad = { l: 36, r: 12, t: 18, b: 32 };
  const max = Math.max(1, ...series.map((row) => row.value));
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const points = series.map((row, index) => {
    const x = pad.l + (series.length <= 1 ? innerW / 2 : (index / (series.length - 1)) * innerW);
    const y = pad.t + innerH - (row.value / max) * innerH;
    return { ...row, x, y };
  });
  const peak = points.reduce((best, point) => (point.value > best.value ? point : best), points[0]);
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const area =
    points.length > 0
      ? `${line} L${points[points.length - 1].x.toFixed(1)},${pad.t + innerH} L${points[0].x.toFixed(1)},${pad.t + innerH} Z`
      : "";
  const ticks = [0, Math.round(max / 2), max];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Diagnoses by week">
      {ticks.map((tick) => {
        const y = pad.t + innerH - (tick / max) * innerH;
        return (
          <g key={tick}>
            <line x1={pad.l} x2={width - pad.r} y1={y} y2={y} stroke="#e7eef6" strokeWidth="1" />
            <text x={pad.l - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#8b98ab">
              {tick}
            </text>
          </g>
        );
      })}
      {peak && peak.value > 0 ? <rect x={peak.x - 7} y={peak.y} width="14" height={pad.t + innerH - peak.y} rx="7" fill="#0056ff" /> : null}
      <path d={area} fill="#0056ff" opacity="0.12" />
      <path d={line} fill="none" stroke="#1f3892" strokeWidth="2" />
      {points.map((point) => (
        <text key={point.label} x={point.x} y={height - 10} textAnchor="middle" fontSize="10" fill="#8b98ab">
          {point.label}
        </text>
      ))}
      {peak && peak.value > 0 ? (
        <g>
          <rect x={Math.min(peak.x + 12, width - 128)} y={Math.max(peak.y - 36, 8)} width="112" height="36" rx="8" fill="#ffffff" stroke="#e7eef6" />
          <text x={Math.min(peak.x + 22, width - 118)} y={Math.max(peak.y - 22, 22)} fontSize="10" fill="#5c6d8f">
            {peak.label}
          </text>
          <text x={Math.min(peak.x + 22, width - 118)} y={Math.max(peak.y - 8, 36)} fontSize="12" fontWeight="600" fill="#10215c">
            {peak.value} diagnoses
          </text>
        </g>
      ) : null}
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
