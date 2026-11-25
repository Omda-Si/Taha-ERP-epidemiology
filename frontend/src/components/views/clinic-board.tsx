"use client";

import { useMemo, useState } from "react";
import { Link } from "@/components/link";
import { MiniBars, Sparkline, UtilizationBars } from "@/components/charts";
import { DEMO_DAY, TZ } from "@/lib/catalog";
import { useClinic } from "@/lib/clinic-store";
import { cx, formatFee, formatWhen, khartoumDate } from "@/lib/format";
import { weeklySeries } from "@/lib/stats";
import type { Appointment, AppointmentState, Doctor } from "@/lib/types";

function initials(name: string) {
  return name
    .replace(/^Dr\.\s*/, "")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: TZ,
  }).format(new Date(iso));
}

function weekDelta(values: number[]) {
  const last = values.at(-1) ?? 0;
  const prev = values.at(-2) ?? 0;
  if (prev === 0) return last > 0 ? `+${last}%` : "0%";
  const pct = Math.round(((last - prev) / prev) * 1000) / 10;
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

function formatRevenueCompact(amount: number) {
  if (amount >= 1000) return `SDG ${(amount / 1000).toFixed(1)}k`;
  return formatFee(amount);
}

function statusMeta(state: AppointmentState): { label: string; kind: "in" | "confirmed" | "pending" } {
  if (state === "checked_in" || state === "completed") return { label: "Checked-In", kind: "in" };
  if (state === "scheduled") return { label: "Confirmed", kind: "confirmed" };
  return { label: "Pending", kind: "pending" };
}

function doctorShift(doctorId: string) {
  const seed = doctorId.split("").reduce((n, c) => n + c.charCodeAt(0), 0);
  const startH = 8 + (seed % 3);
  const endH = startH + 4 + (seed % 2);
  const nextH = startH + 1 + (seed % 3);
  const pad = (h: number, m: number) =>
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ }).format(
      new Date(`2026-11-25T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+02:00`),
    );
  return { shift: `${pad(startH, 0)} – ${pad(endH, 30)}`, next: pad(nextH, 0) };
}

const AVATAR_TONES = ["#0056ff", "#1f3892", "#5db4ff", "#00dee3", "#003ec4", "#7ec8ff"];

export function ClinicBoard() {
  const { state } = useClinic();
  const [query, setQuery] = useState("");
  const [focusId, setFocusId] = useState<string | null>(null);

  const visitSeries = useMemo(
    () => weeklySeries(state.appointments.map((row) => ({ diagnosed_at: row.schedule }))),
    [state.appointments],
  );
  const registerSeries = useMemo(
    () => weeklySeries(state.patients.map((row) => ({ diagnosed_at: row.registeredAt }))),
    [state.patients],
  );

  const todayBook = state.appointments
    .filter((row) => khartoumDate(row.schedule) === DEMO_DAY)
    .sort((a, b) => a.schedule.localeCompare(b.schedule));

  const filteredToday = todayBook.filter((row) => {
    if (!query.trim()) return true;
    const person = state.patients.find((p) => p.id === row.patientId);
    const doctor = state.doctors.find((d) => d.id === row.doctorId);
    const hay = `${person?.name ?? ""} ${doctor?.name ?? ""} ${row.reason}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

  const activeId = focusId ?? filteredToday[0]?.id ?? null;

  const feesToday = todayBook.reduce((sum, row) => sum + row.fee, 0);
  const revenueMtd = state.appointments
    .filter((row) => khartoumDate(row.schedule).startsWith("2026-11"))
    .reduce((sum, row) => sum + row.fee, 0);

  const utilizationPct = Math.min(99, Math.round((todayBook.length / Math.max(1, state.doctors.length * 6)) * 100));
  const utilizationBars = state.doctors.map((_, index) => {
    const load = todayBook.filter((row) => row.doctorId === state.doctors[index]?.id).length;
    return Math.min(100, 35 + load * 18 + (index % 3) * 8);
  });

  const requests = state.appointments
    .filter((row) => row.state === "scheduled" && khartoumDate(row.schedule) >= DEMO_DAY)
    .sort((a, b) => a.schedule.localeCompare(b.schedule))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-[-0.02em] text-[#0f172a]">Clinic Overview</h1>
          <p className="mt-0.5 text-xs text-[#64748b]">Real-time appointment management and clinic utilisation metrics</p>
        </div>
        <div className="flex w-full flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
          <label className="hidden min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-[#e8edf3] bg-white px-2.5 py-1.5 md:flex md:max-w-[190px] md:flex-none">
            <span className="text-[#94a3b8]" aria-hidden="true">
              <SearchIcon />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="min-w-0 flex-1 bg-transparent text-[13px] text-[#334155] outline-none placeholder:text-[#94a3b8]"
              aria-label="Search dashboard"
            />
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-lg border border-[#e8edf3] bg-white px-2.5 py-1.5 text-xs text-[#475569]">18 Nov – 25 Nov 2026</span>
            <select className="rounded-lg border border-[#e8edf3] bg-white px-2.5 py-1.5 text-xs text-[#475569] outline-none">
              <option>Last 30 days</option>
              <option>This month</option>
            </select>
            <Link
              href="/clinic/sync"
              className="w-full rounded-lg bg-clinic px-3 py-1.5 text-center text-xs font-semibold text-white shadow-[0_4px_14px_rgba(0,86,255,0.28)] hover:bg-clinic-deep sm:w-auto"
            >
              Export Clinic Report
            </Link>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Patients"
          value={state.patients.length.toLocaleString("en-GB")}
          delta={weekDelta(registerSeries.map((row) => row.value))}
          chart={<Sparkline values={registerSeries.map((row) => row.value)} className="h-9 w-20" />}
        />
        <MetricCard
          label="Revenue MTD"
          value={formatRevenueCompact(revenueMtd)}
          delta={weekDelta(visitSeries.map((row) => row.value))}
          chart={<MiniBars values={visitSeries.slice(-7).map((row) => row.value)} />}
        />
        <MetricCard
          label="Appts Today"
          value={String(todayBook.length)}
          delta={weekDelta(visitSeries.map((row) => row.value))}
          chart={<Sparkline values={visitSeries.map((row) => row.value)} className="h-9 w-20" />}
        />
        <MetricCard
          label="Clinic Utilization"
          value={`${utilizationPct}%`}
          delta="Live"
          deltaLive
          chart={<UtilizationBars values={utilizationBars} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_min(100%,17.5rem)]">
        <section className="rounded-xl border border-[#e8edf3] bg-white p-3 shadow-sm">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-[#0f172a]">Today&apos;s Appointments</h2>
            <label className="flex max-w-[14rem] items-center gap-2 rounded-lg border border-[#e8edf3] bg-[#f8fafc] px-2.5 py-1.5">
              <SearchIcon className="text-[#94a3b8]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search appointments..."
                className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[#94a3b8]"
                aria-label="Search appointments"
              />
            </label>
          </div>
          <ul className="flex flex-col gap-1.5">
            {filteredToday.map((row, index) => (
              <TodayRow
                key={row.id}
                row={row}
                patientName={state.patients.find((p) => p.id === row.patientId)?.name ?? "Unknown"}
                doctorName={state.doctors.find((d) => d.id === row.doctorId)?.name ?? "—"}
                avatarTone={AVATAR_TONES[index % AVATAR_TONES.length]}
                active={row.id === activeId}
                onFocus={() => setFocusId(row.id)}
              />
            ))}
            {filteredToday.length === 0 ? (
              <li className="rounded-lg border border-dashed border-[#e8edf3] py-8 text-center text-xs text-[#94a3b8]">No appointments match.</li>
            ) : null}
          </ul>
        </section>

        <div className="flex flex-col gap-3">
          <section className="rounded-xl border border-[#e8edf3] bg-white p-3 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-[#0f172a]">Appointment Requests</h2>
            <ul className="flex flex-col gap-1.5">
              {requests.map((row, index) => {
                const person = state.patients.find((p) => p.id === row.patientId);
                return (
                  <li key={row.id} className="flex items-center gap-2 rounded-lg border border-[#eef2f6] px-2.5 py-2">
                    <Avatar name={person?.name ?? "?"} tone={AVATAR_TONES[index % AVATAR_TONES.length]} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-[#0f172a]">{person?.name}</p>
                      <p className="truncate text-[11px] text-[#64748b]">{formatWhen(row.schedule)}</p>
                    </div>
                    <span className="flex shrink-0 gap-1.5">
                      <Link
                        href={`/clinic/patients/${row.patientId}`}
                        className="grid h-7 w-7 place-items-center rounded-md bg-clinic text-xs text-white"
                        aria-label="Accept request"
                      >
                        ✓
                      </Link>
                      <button
                        type="button"
                        className="grid h-7 w-7 place-items-center rounded-md border border-[#e8edf3] text-sm text-[#94a3b8]"
                        aria-label="Dismiss request"
                      >
                        ×
                      </button>
                    </span>
                  </li>
                );
              })}
              {requests.length === 0 ? <li className="py-3 text-center text-xs text-[#94a3b8]">No pending requests.</li> : null}
            </ul>
          </section>

          <section className="rounded-xl border border-[#e8edf3] bg-white p-3 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-[#0f172a]">Available Doctors</h2>
            <ul className="flex flex-col gap-2">
              {state.doctors.map((doctor, index) => (
                <AvailableDoctorRow key={doctor.id} doctor={doctor} onDuty={todayBook.some((row) => row.doctorId === doctor.id)} index={index} />
              ))}
            </ul>
          </section>
        </div>
      </div>

      <p className="text-center text-[11px] text-[#94a3b8]">
        Today&apos;s booked revenue {formatFee(feesToday)} ·{" "}
        <Link href="/clinic/diagnose" className="font-medium text-clinic hover:underline">
          Record diagnosis
        </Link>
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  delta,
  deltaLive,
  chart,
}: {
  label: string;
  value: string;
  delta: string;
  deltaLive?: boolean;
  chart: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#e8edf3] bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-[#64748b]">{label}</p>
          <p className="mt-0.5 text-xl font-semibold leading-none tracking-tight text-[#0f172a]">{value}</p>
          <p className={cx("mt-1 flex items-center gap-1 text-[11px] font-medium", deltaLive ? "text-clinic" : "text-emerald-600")}>
            {!deltaLive ? <span aria-hidden="true">↑</span> : null}
            {delta}
          </p>
        </div>
        <div className="shrink-0">{chart}</div>
      </div>
    </section>
  );
}

function TodayRow({
  row,
  patientName,
  doctorName,
  avatarTone,
  active,
  onFocus,
}: {
  row: Appointment;
  patientName: string;
  doctorName: string;
  avatarTone: string;
  active: boolean;
  onFocus: () => void;
}) {
  const status = statusMeta(row.state);
  return (
    <li>
      <button
        type="button"
        onClick={onFocus}
        className={cx(
          "flex w-full flex-col gap-2 rounded-xl px-2.5 py-2 text-left transition sm:flex-row sm:items-center sm:gap-3 md:px-3",
          active ? "bg-clinic text-white shadow-[0_6px_16px_rgba(0,86,255,0.28)]" : "border border-[#eef2f6] bg-white hover:bg-[#f8fafc]",
        )}
      >
        <time className={cx("w-12 shrink-0 text-xs font-semibold tabular-nums", active ? "text-white/95" : "text-[#64748b]")}>{formatTime(row.schedule)}</time>
        <Avatar name={patientName} tone={avatarTone} dim={active} />
        <span className="min-w-0 flex-1">
          <span className={cx("block truncate text-xs font-semibold", active ? "text-white" : "text-[#0f172a]")}>{patientName}</span>
          <span className={cx("mt-0.5 block truncate text-[11px]", active ? "text-white/80" : "text-[#64748b]")}>
            {row.reason} · {doctorName.replace(/^Dr\.\s*/, "Dr ")}
          </span>
        </span>
        <StatusBadge {...status} inverted={active} />
      </button>
    </li>
  );
}

function StatusBadge({ label, kind, inverted }: { label: string; kind: "in" | "confirmed" | "pending"; inverted?: boolean }) {
  if (inverted && kind === "in") {
    return <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">{label}</span>;
  }
  return (
    <span
      className={cx(
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        kind === "in" && "bg-clinic text-white",
        kind === "confirmed" && "border border-[#b8d4ff] bg-[#e8f0ff] text-clinic-deep",
        kind === "pending" && "border border-[#fdba74] bg-[#fff7ed] text-[#ea580c]",
      )}
    >
      {label}
    </span>
  );
}

function AvailableDoctorRow({ doctor, onDuty, index }: { doctor: Doctor; onDuty: boolean; index: number }) {
  const { shift, next } = doctorShift(doctor.id);
  const tone = AVATAR_TONES[index % AVATAR_TONES.length];
  return (
    <li className="flex gap-2 border-b border-[#eef2f6] pb-2 last:border-0 last:pb-0">
      <Avatar name={doctor.name} tone={tone} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-xs font-semibold text-[#0f172a]">{doctor.name}</p>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {onDuty ? "On duty" : "Active"}
          </span>
        </div>
        <p className="text-[11px] text-[#64748b]">{doctor.specialty}</p>
        <p className="mt-0.5 text-[10px] text-[#94a3b8]">{shift}</p>
        <p className="text-[10px] font-medium text-clinic">Next: {next}</p>
      </div>
    </li>
  );
}

function Avatar({ name, tone, dim }: { name: string; tone: string; dim?: boolean }) {
  return (
    <span
      className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white", dim && "ring-2 ring-white/30")}
      style={{ background: tone }}
    >
      {initials(name)}
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