"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AreaChart, BarList } from "@/components/charts";
import { PageHeader, Panel, Stat } from "@/components/ui";
import { useCentralEvents } from "@/lib/use-central-events";
import { countBy, lastDays, outbreaks, ratioLabel, weeklySeries } from "@/lib/stats";

export function HqOverview() {
  const events = useCentralEvents();
  const recent = useMemo(() => lastDays(events, 14), [events]);
  const series = useMemo(() => weeklySeries(events), [events]);
  const diseases = useMemo(() => countBy(recent, (event) => event.diagnosis_name).slice(0, 6), [recent]);
  const flags = useMemo(() => outbreaks(events).slice(0, 4), [events]);
  const facilities = useMemo(() => new Set(recent.map((event) => event.facility_code)).size, [recent]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Surveillance desk · 14 days to 25 Nov 2026"
        title="Overview"
        lede="Counts are anonymized diagnosis events. A flag means the last 14 days pulled away from the 14 days before that, in the same disease and region."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Events, 14 days" value={recent.length} note={`${events.length} in the loaded ledger`} />
        <Stat label="Facilities reporting" value={facilities} note="In the current window" />
        <Stat label="Outbreak flags" value={flags.length} note="Disease × region" />
      </div>
      {flags.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {flags.map((flag) => (
            <Link
              key={flag.id}
              href={`/hq/diseases?code=${encodeURIComponent(flag.diagnosisCode)}`}
              className="rounded-md border border-clay/40 bg-card px-4 py-3 hover:border-clay"
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-clay">Flag</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                {flag.diagnosisName} · {flag.region}
              </p>
              <p className="mt-1 text-sm text-muted">
                {flag.recent} in 14 days, {flag.prior} in the prior 14 · {ratioLabel(flag.recent, flag.prior)}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">No disease-region pair crossed the outbreak threshold.</p>
      )}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Panel title="Weekly volume, eight weeks">
          <AreaChart series={series} />
        </Panel>
        <Panel title="Top diseases, last 14 days" action={<Link href="/hq/diseases" className="text-sm text-clinic hover:underline">All</Link>}>
          <BarList rows={diseases} />
        </Panel>
      </div>
    </div>
  );
}
