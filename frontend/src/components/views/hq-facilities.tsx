"use client";

import { useMemo } from "react";
import { BarList } from "@/components/charts";
import { PageHeader, Panel } from "@/components/ui";
import { FACILITIES } from "@/lib/catalog";
import { countBy, lastDays } from "@/lib/stats";
import { formatWhen } from "@/lib/format";
import { useCentralEvents } from "@/lib/use-central-events";

export function HqFacilities() {
  const events = useCentralEvents();
  const recent = useMemo(() => lastDays(events, 14), [events]);
  const cards = useMemo(() => {
    return FACILITIES.map((facility) => {
      const rows = recent.filter((event) => event.facility_code === facility.code);
      const top = countBy(rows, (event) => event.diagnosis_name)[0];
      const latest = [...rows].sort((a, b) => b.diagnosed_at.localeCompare(a.diagnosed_at))[0];
      return { facility, count: rows.length, top, latest };
    }).sort((a, b) => b.count - a.count);
  }, [recent]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Reporting sites · 14 days"
        title="Facilities"
        lede="Volume is anonymized events attributed to the facility code. It is not a patient census."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Panel key={card.facility.code} title={card.facility.name}>
            <p className="font-mono text-xs text-muted">{card.facility.code}</p>
            <p className="mt-2 text-4xl font-semibold tabular-nums">{card.count}</p>
            <p className="text-sm text-muted">
              {card.facility.city}, {card.facility.region}
            </p>
            <p className="mt-3 text-sm">
              Leading diagnosis: {card.top ? `${card.top.label} (${card.top.value})` : "none in window"}
            </p>
            <p className="text-xs text-muted">
              Latest diagnosis time: {card.latest ? formatWhen(card.latest.diagnosed_at) : "—"}
            </p>
            <div className="mt-4">
              <BarList rows={countBy(recent.filter((event) => event.facility_code === card.facility.code), (event) => event.diagnosis_name).slice(0, 3)} />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
