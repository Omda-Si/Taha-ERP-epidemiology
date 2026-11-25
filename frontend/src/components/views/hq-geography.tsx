"use client";

import { useMemo, useState } from "react";
import { SplitBar, BarList } from "@/components/charts";
import { PageHeader, Panel } from "@/components/ui";
import { GEO } from "@/lib/catalog";
import { countBy, lastDays } from "@/lib/stats";
import { useCentralEvents } from "@/lib/use-central-events";

export function HqGeography() {
  const events = useCentralEvents();
  const [region, setRegion] = useState(GEO[0].region);
  const [windowDays, setWindowDays] = useState<14 | 56>(14);
  const windowed = useMemo(() => lastDays(events, windowDays), [events, windowDays]);
  const regions = useMemo(() => countBy(windowed, (event) => event.region), [windowed]);
  const inRegion = useMemo(() => windowed.filter((event) => event.region === region), [windowed, region]);
  const cities = useMemo(() => countBy(inRegion, (event) => event.city), [inRegion]);
  const districts = useMemo(() => countBy(inRegion, (event) => `${event.district}, ${event.city}`), [inRegion]);
  const diseases = useMemo(() => countBy(inRegion, (event) => event.diagnosis_name).slice(0, 5), [inRegion]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Place"
        title="Geography"
        lede="City, district, and region from the whitelist. Street addresses are not collected."
        actions={
          <div className="flex gap-2">
            <FilterChip active={windowDays === 14} onClick={() => setWindowDays(14)} label="14 days" />
            <FilterChip active={windowDays === 56} onClick={() => setWindowDays(56)} label="8 weeks" />
          </div>
        }
      />
      <Panel title="Share by region">
        <SplitBar rows={regions} />
      </Panel>
      <div className="flex flex-wrap gap-2">
        {GEO.map((row) => (
          <FilterChip key={row.region} active={region === row.region} onClick={() => setRegion(row.region)} label={row.region} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Cities">
          <BarList rows={cities} tone="#1f3892" />
        </Panel>
        <Panel title="Districts">
          <BarList rows={districts} tone="#00dee3" />
        </Panel>
        <Panel title="Diseases here">
          <BarList rows={diseases} />
        </Panel>
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active ? "rounded-full bg-navy px-3 py-1 text-xs text-paper" : "rounded-full border border-line px-3 py-1 text-xs text-muted"
      }
    >
      {label}
    </button>
  );
}
