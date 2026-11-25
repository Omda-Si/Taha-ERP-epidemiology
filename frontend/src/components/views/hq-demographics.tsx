"use client";

import { useMemo, useState } from "react";
import { BarList } from "@/components/charts";
import { PageHeader, Panel } from "@/components/ui";
import { AGE_BRACKETS, ICD } from "@/lib/catalog";
import { countBy, lastDays } from "@/lib/stats";
import { useCentralEvents } from "@/lib/use-central-events";

export function HqDemographics() {
  const events = useCentralEvents();
  const [code, setCode] = useState("all");
  const recent = useMemo(() => lastDays(events, 28), [events]);
  const subset = useMemo(
    () => (code === "all" ? recent : recent.filter((event) => event.diagnosis_code === code)),
    [recent, code],
  );
  const ages = useMemo(() => {
    const rows = countBy(subset, (event) => event.age_bracket);
    return AGE_BRACKETS.map((label) => ({ label, value: rows.find((row) => row.label === label)?.value ?? 0 }));
  }, [subset]);
  const jobs = useMemo(() => countBy(subset, (event) => event.occupation), [subset]);
  const cross = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of subset) {
      const key = `${event.occupation} · ${event.diagnosis_name}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [subset]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Age bracket and work · 28 days"
        title="People"
        lede="Brackets, not birthdays. Occupation is the category the clinic stored, with the name removed."
        actions={
          <select
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="rounded-md border border-line bg-white px-3 py-2 text-sm"
          >
            <option value="all">All diagnoses</option>
            {ICD.map((row) => (
              <option key={row.code} value={row.code}>
                {row.name}
              </option>
            ))}
          </select>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Age bracket">
          <BarList rows={ages} tone="#1f3892" />
        </Panel>
        <Panel title="Occupation">
          <BarList rows={jobs} tone="#00dee3" />
        </Panel>
      </div>
      <Panel title="Occupation × diagnosis">
        <BarList rows={cross} />
      </Panel>
    </div>
  );
}
