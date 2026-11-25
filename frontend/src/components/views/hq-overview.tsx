"use client";

import { Link } from "@/components/link";
import { useMemo, useState } from "react";
import { AreaChart, MiniBars, Sparkline, UtilizationBars } from "@/components/charts";
import { DEMO_DAY, TZ } from "@/lib/catalog";
import { cx, formatWhen, khartoumDate } from "@/lib/format";
import { useCentralEvents } from "@/lib/use-central-events";
import { countBy, lastDays, outbreaks, ratioLabel, weeklySeries } from "@/lib/stats";
import type { CentralEvent } from "@/lib/types";

const DESK_SHORTCUTS = [
  { href: "/hq/diseases", label: "Diseases", hint: "ICD counts & flags" },
  { href: "/hq/geography", label: "Geography", hint: "Regions & cities" },
  { href: "/hq/demographics", label: "People", hint: "Age & occupation" },
  { href: "/hq/facilities", label: "Facilities", hint: "Reporting sites" },
  { href: "/hq/events", label: "Ledger", hint: "Full event stream" },
] as const;

const AVATAR_TONES = ["#0056ff", "#1f3892", "#5db4ff", "#00dee3", "#003ec4", "#7ec8ff"];

function weekDelta(values: number[]) {
  const last = values.at(-1) ?? 0;
  const prev = values.at(-2) ?? 0;
  if (prev === 0) return last > 0 ? `+${last}%` : "0%";
  const pct = Math.round(((last - prev) / prev) * 1000) / 10;
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

function surveillanceRangeLabel() {
  const end = new Date(`${DEMO_DAY}T12:00:00+02:00`);
  const start = new Date(end);
  start.setDate(start.getDate() - 14);
  const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

function diseaseInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function HqOverview() {
  const events = useCentralEvents();
  const [query, setQuery] = useState("");
  const [focusKey, setFocusKey] = useState<string | null>(null);

  const recent = useMemo(() => lastDays(events, 14), [events]);
  const series = useMemo(() => weeklySeries(events), [events]);
  const seriesValues = useMemo(() => series.map((row) => row.value), [series]);
  const flags = useMemo(() => outbreaks(events).slice(0, 5), [events]);
  const allFlags = useMemo(() => outbreaks(events), [events]);
  const facilityCount = useMemo(() => new Set(recent.map((event) => event.facility_code)).size, [recent]);
  const regionCount = useMemo(() => new Set(recent.map((event) => event.region)).size, [recent]);
  const todayCount = useMemo(
    () => recent.filter((event) => khartoumDate(event.diagnosed_at) === DEMO_DAY).length,
    [recent],
  );

  const latest = useMemo(
    () => [...events].sort((a, b) => b.received_at.localeCompare(a.received_at)).slice(0, 12),
    [events],
  );

  const filteredLatest = latest.filter((row) => {
    if (!query.trim()) return true;
    const hay = `${row.diagnosis_name} ${row.diagnosis_code} ${row.region} ${row.facility_name} ${row.facility_code}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

  const activeKey =
    focusKey ??
    (filteredLatest[0]
      ? `${filteredLatest[0].facility_code}-${filteredLatest[0].diagnosed_at}-${filteredLatest[0].diagnosis_code}`
      : null);

  const facilityBars = useMemo(() => {
    const counts = countBy(recent, (event) => event.facility_code).slice(0, 6);
    return counts.map((row) => Math.min(100, 24 + row.value * 10));
  }, [recent]);

  const regionSeries = useMemo(() => {
    const byWeek = weeklySeries(
      recent.map((event) => ({
        diagnosed_at: event.diagnosed_at,
      })),
    );
    return byWeek.map((row) => row.value);
  }, [recent]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-[-0.02em] text-[#0f172a]">Surveillance Overview</h1>
          <p className="mt-0.5 text-xs text-[#64748b]">
            Anonymized diagnosis signals, outbreak flags, and facility reporting — no identifiers in this ledger
          </p>
        </div>
        <div className="flex w-full flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
          <label className="hidden min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-[#e8edf3] bg-white px-2.5 py-1.5 md:flex md:max-w-[190px] md:flex-none">
            <SearchIcon />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="min-w-0 flex-1 bg-transparent text-[13px] text-[#334155] outline-none placeholder:text-[#94a3b8]"
              aria-label="Search surveillance"
            />
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-lg border border-[#e8edf3] bg-white px-2.5 py-1.5 text-xs text-[#475569]">
              {surveillanceRangeLabel()}
            </span>
            <select className="rounded-lg border border-[#e8edf3] bg-white px-2.5 py-1.5 text-xs text-[#475569] outline-none" defaultValue="14">
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
            </select>
            <Link
              href="/hq/events"
              className="w-full rounded-lg bg-clinic px-3 py-1.5 text-center text-xs font-semibold text-white shadow-[0_4px_14px_rgba(0,86,255,0.28)] hover:bg-clinic-deep sm:w-auto"
            >
              Export Surveillance Report
            </Link>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Events, 14 days"
          value={recent.length.toLocaleString("en-GB")}
          delta={weekDelta(seriesValues)}
          chart={<Sparkline values={seriesValues} className="h-9 w-20" />}
        />
        <MetricCard
          label="Ingested today"
          value={String(todayCount)}
          delta={weekDelta(seriesValues)}
          chart={<MiniBars values={seriesValues.slice(-7)} />}
        />
        <MetricCard
          label="Facilities reporting"
          value={String(facilityCount)}
          delta={`${regionCount} regions`}
          deltaMuted
          chart={<UtilizationBars values={facilityBars.length ? facilityBars : [40, 55, 70]} />}
        />
        <MetricCard
          label="Outbreak flags"
          value={String(allFlags.length)}
          delta="Live watch"
          deltaLive
          chart={<MiniBars values={regionSeries.slice(-7)} tone="#c45a32" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_min(100%,17.5rem)]">
        <section className="rounded-xl border border-[#e8edf3] bg-white p-3 shadow-sm">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-[#0f172a]">Latest ingested events</h2>
            <label className="flex max-w-[14rem] items-center gap-2 rounded-lg border border-[#e8edf3] bg-[#f8fafc] px-2.5 py-1.5">
              <SearchIcon className="text-[#94a3b8]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter events..."
                className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[#94a3b8]"
                aria-label="Filter ingested events"
              />
            </label>
          </div>
          <ul className="flex flex-col gap-1.5">
            {filteredLatest.map((row, index) => (
              <IngestRow
                key={`${row.facility_code}-${row.diagnosed_at}-${row.diagnosis_code}`}
                row={row}
                avatarTone={AVATAR_TONES[index % AVATAR_TONES.length]}
                active={activeKey === `${row.facility_code}-${row.diagnosed_at}-${row.diagnosis_code}`}
                onFocus={() =>
                  setFocusKey(`${row.facility_code}-${row.diagnosed_at}-${row.diagnosis_code}`)
                }
              />
            ))}
            {filteredLatest.length === 0 ? (
              <li className="rounded-lg border border-dashed border-[#e8edf3] py-8 text-center text-xs text-[#94a3b8]">
                No events match.
              </li>
            ) : null}
          </ul>
        </section>

        <div className="flex flex-col gap-3">
          <section className="rounded-xl border border-[#e8edf3] bg-white p-3 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-[#0f172a]">Outbreak flags</h2>
            <ul className="flex flex-col gap-1.5">
              {flags.map((flag, index) => (
                <li key={flag.id}>
                  <Link
                    href={`/hq/diseases?code=${encodeURIComponent(flag.diagnosisCode)}`}
                    className="flex items-center gap-2 rounded-lg border border-[#eef2f6] px-2.5 py-2 transition hover:bg-[#f8fafc]"
                  >
                    <FlagAvatar name={flag.diagnosisName} tone={AVATAR_TONES[index % AVATAR_TONES.length]} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-[#0f172a]">
                        {flag.diagnosisName} · {flag.region}
                      </p>
                      <p className="truncate text-[11px] text-[#64748b]">
                        {flag.recent} recent · {ratioLabel(flag.recent, flag.prior)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-clay/15 px-2 py-0.5 text-[10px] font-semibold text-clay">Flag</span>
                  </Link>
                </li>
              ))}
              {flags.length === 0 ? (
                <li className="py-3 text-center text-xs text-[#94a3b8]">No active flags in ledger.</li>
              ) : null}
            </ul>
          </section>

          <section className="rounded-xl border border-[#e8edf3] bg-white p-3 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-[#0f172a]">Desk shortcuts</h2>
            <ul className="flex flex-col gap-2">
              {DESK_SHORTCUTS.map((item, index) => (
                <li key={item.href} className="flex gap-2 border-b border-[#eef2f6] pb-2 last:border-0 last:pb-0">
                  <FlagAvatar name={item.label} tone={AVATAR_TONES[index % AVATAR_TONES.length]} />
                  <div className="min-w-0 flex-1">
                    <Link href={item.href} className="truncate text-xs font-semibold text-[#0f172a] hover:text-clinic">
                      {item.label}
                    </Link>
                    <p className="text-[11px] text-[#64748b]">{item.hint}</p>
                  </div>
                </li>
              ))}
              <li>
                <Link
                  href="/clinic"
                  className="mt-1 block rounded-lg border border-dashed border-[#e8edf3] px-2.5 py-2 text-center text-xs font-medium text-clinic hover:bg-[#f8fafc]"
                >
                  Return to clinic
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <section className="rounded-xl border border-[#e8edf3] bg-white p-3 shadow-sm">
        <ChartSectionHeader />
        <div className="mt-3">
          <AreaChart series={series} />
        </div>
      </section>

      <p className="text-center text-[11px] text-[#94a3b8]">
        Privacy guardrail: only diagnosis, demographics, geography, timestamps, and facility codes ·{" "}
        <Link href="/hq/events" className="font-medium text-clinic hover:underline">
          Open full ledger
        </Link>
      </p>
    </div>
  );
}

function ChartSectionHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-[#0f172a]">Weekly diagnosis volume</h2>
      <span className="text-xs text-[#64748b]">Eight-week trend from anonymized ingest</span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  delta,
  deltaLive,
  deltaMuted,
  chart,
}: {
  label: string;
  value: string;
  delta: string;
  deltaLive?: boolean;
  deltaMuted?: boolean;
  chart: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#e8edf3] bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-[#64748b]">{label}</p>
          <p className="mt-0.5 text-xl font-semibold leading-none tracking-tight text-[#0f172a]">{value}</p>
          <p
            className={cx(
              "mt-1 flex items-center gap-1 text-[11px] font-medium",
              deltaLive ? "text-clinic" : deltaMuted ? "text-[#64748b]" : "text-emerald-600",
            )}
          >
            {!deltaLive && !deltaMuted ? <span aria-hidden="true">↑</span> : null}
            {delta}
          </p>
        </div>
        <div className="shrink-0">{chart}</div>
      </div>
    </section>
  );
}

function IngestRow({
  row,
  avatarTone,
  active,
  onFocus,
}: {
  row: CentralEvent;
  avatarTone: string;
  active: boolean;
  onFocus: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onFocus}
        className={cx(
          "flex w-full flex-col gap-2 rounded-xl px-2.5 py-2 text-left transition sm:flex-row sm:items-center sm:gap-3 md:px-3",
          active
            ? "bg-clinic text-white shadow-[0_6px_16px_rgba(0,86,255,0.28)]"
            : "border border-[#eef2f6] bg-white hover:bg-[#f8fafc]",
        )}
      >
        <time
          className={cx("w-16 shrink-0 text-[11px] font-semibold tabular-nums sm:w-20", active ? "text-white/95" : "text-[#64748b]")}
        >
          {formatWhen(row.received_at)}
        </time>
        <FlagAvatar name={row.diagnosis_name} tone={avatarTone} dim={active} />
        <span className="min-w-0 flex-1">
          <span className={cx("block truncate text-xs font-semibold", active ? "text-white" : "text-[#0f172a]")}>
            {row.diagnosis_name}
          </span>
          <span className={cx("mt-0.5 block truncate text-[11px]", active ? "text-white/80" : "text-[#64748b]")}>
            {row.region} · {row.facility_name}
          </span>
        </span>
        <span
          className={cx(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
            active
              ? "bg-white/20 text-white"
              : "border border-[#b8d4ff] bg-[#e8f0ff] text-clinic-deep",
          )}
        >
          {row.diagnosis_code}
        </span>
      </button>
    </li>
  );
}

function FlagAvatar({ name, tone, dim }: { name: string; tone: string; dim?: boolean }) {
  return (
    <span
      className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white", dim && "ring-2 ring-white/30")}
      style={{ background: tone }}
    >
      {diseaseInitials(name)}
    </span>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cx("h-3.5 w-3.5", className)} fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.5 13.5 17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}