"use client";

import { Link } from "@/components/link";
import { useMemo, useState } from "react";
import { AreaChart, BarList } from "@/components/charts";
import { ICD } from "@/lib/catalog";
import { countBy, outbreaks, ratioLabel, weeklySeries } from "@/lib/stats";
import { useCentralEvents } from "@/lib/use-central-events";
import { DeskChrome } from "./desk-chrome";

export function SignalsDesk({ code: initial }: { code?: string | null } = {}) {
  const events = useCentralEvents();
  const [code, setCode] = useState(ICD.some((row) => row.code === initial) ? initial! : ICD[0].code);
  const disease = ICD.find((row) => row.code === code) ?? ICD[0];

  const subset = useMemo(() => events.filter((event) => event.diagnosis_code === code), [events, code]);
  const series = useMemo(() => weeklySeries(subset), [subset]);
  const flags = useMemo(() => outbreaks(events), [events]);
  const leaderboard = useMemo(() => countBy(events, (e) => `${e.diagnosis_code} ${e.diagnosis_name}`).slice(0, 8), [events]);
  const occupations = useMemo(() => countBy(subset, (e) => e.occupation).slice(0, 6), [subset]);
  const ageBands = useMemo(() => countBy(subset, (e) => e.age_bracket).slice(0, 8), [subset]);

  return (
    <DeskChrome
      active="/desk/signals"
      kicker="Headquarters view"
      title="Disease signals"
      lede="Anonymized events only — compare ICD codes, outbreak flags, and who is affected by age and occupation. No patient names in this feed."
      actions={
        <select
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="max-w-[14rem] rounded-lg border border-[#e8edf3] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-clinic"
        >
          {ICD.map((row) => (
            <option key={row.code} value={row.code}>
              {row.code} · {row.name}
            </option>
          ))}
        </select>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[#e8edf3] bg-white p-4 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-[#0f172a]">National ICD leaderboard</h2>
          <p className="mt-0.5 text-xs text-[#64748b]">All facilities · full ledger</p>
          <BarBlock rows={leaderboard} className="mt-4" />
        </div>
        <div className="rounded-xl border border-clay/30 bg-[#fff7f8] p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-clay">Outbreak flags</h2>
          <p className="mt-0.5 text-xs text-[#64748b]">14-day window vs prior 14 days</p>
          <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
            {flags.map((flag) => (
              <li key={flag.id}>
                <Link
                  href={`/desk/signals?code=${encodeURIComponent(flag.diagnosisCode)}`}
                  className="block rounded-lg border border-clay/20 bg-white px-3 py-2 transition hover:border-clay/50"
                >
                  <p className="text-sm font-medium text-[#0f172a]">
                    {flag.diagnosisName} · {flag.region}
                  </p>
                  <p className="text-xs text-[#64748b]">
                    {flag.recent} vs {flag.prior} · {ratioLabel(flag.recent, flag.prior)}
                  </p>
                </Link>
              </li>
            ))}
            {flags.length === 0 ? <li className="text-xs text-[#94a3b8]">No flags above threshold.</li> : null}
          </ul>
        </div>
      </div>

      <ImageSection title={`Focus: ${disease.name}`} code={disease.code} count={subset.length} className="mt-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <SignalPanel title="Eight-week diagnoses">
            <AreaChart series={series} />
          </SignalPanel>
          <div className="space-y-4">
            <SignalPanel title="Age brackets (selected code)">
              <BarList rows={ageBands} tone="#1f3892" />
            </SignalPanel>
            <SignalPanel title="Occupation mix (selected code)">
              <BarList rows={occupations} tone="#0056ff" />
            </SignalPanel>
          </div>
        </div>
      </ImageSection>
    </DeskChrome>
  );
}

function ImageSection({
  title,
  code,
  count,
  className,
  children,
}: {
  title: string;
  code: string;
  count: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={className}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[#0f172a]">{title}</h2>
          <p className="text-xs text-[#64748b]">
            {code} · {count} events in ledger
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

function SignalPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#e8edf3] bg-white p-4 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function BarBlock({ rows, className }: { rows: { label: string; value: number }[]; className?: string }) {
  return (
    <div className={className}>
      <BarList rows={rows} />
    </div>
  );
}