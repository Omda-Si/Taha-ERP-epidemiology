"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AreaChart, BarList } from "@/components/charts";
import { PageHeader, Panel, inputClass } from "@/components/ui";
import { ICD } from "@/lib/catalog";
import { countBy, weeklySeries } from "@/lib/stats";
import { useCentralEvents } from "@/lib/use-central-events";

export function HqDiseases({ code: codeProp }: { code?: string | null } = {}) {
  if (codeProp !== undefined) return <HqDiseasesBody initial={codeProp} />;
  return <HqDiseasesFromRoute />;
}

function HqDiseasesFromRoute() {
  const params = useSearchParams();
  return <HqDiseasesBody initial={params.get("code")} />;
}

function HqDiseasesBody({ initial }: { initial: string | null }) {
  const events = useCentralEvents();
  const [code, setCode] = useState(ICD.some((row) => row.code === initial) ? initial! : ICD[0].code);
  const disease = ICD.find((row) => row.code === code) ?? ICD[0];
  const subset = useMemo(() => events.filter((event) => event.diagnosis_code === code), [events, code]);
  const series = useMemo(() => weeklySeries(subset), [subset]);
  const regions = useMemo(() => countBy(subset, (event) => event.region), [subset]);
  const totals = useMemo(() => countBy(events, (event) => `${event.diagnosis_code} ${event.diagnosis_name}`), [events]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Disease trends"
        title={disease.name}
        lede={`${subset.length} anonymized events carry ${disease.code}. Weekly buckets are diagnosis time, not ingest time.`}
        actions={
          <select value={code} onChange={(event) => setCode(event.target.value)} className={`${inputClass} w-auto min-w-56`}>
            {ICD.map((row) => (
              <option key={row.code} value={row.code}>
                {row.code} · {row.name}
              </option>
            ))}
          </select>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Eight-week series">
          <AreaChart series={series} />
        </Panel>
        <Panel title="By region">
          <BarList rows={regions} tone="#1f3892" />
        </Panel>
      </div>
      <Panel title="All codes in the ledger">
        <BarList rows={totals} />
      </Panel>
    </div>
  );
}
