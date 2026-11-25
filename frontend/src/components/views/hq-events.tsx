"use client";

import { useMemo, useState } from "react";
import { AGE_BRACKETS, FACILITIES, GEO } from "@/lib/catalog";
import { useCentralEvents } from "@/lib/use-central-events";
import { ageDays } from "@/lib/stats";
import { formatWhen } from "@/lib/format";
import { PageHeader, inputClass } from "@/components/ui";

export function HqEvents() {
  const events = useCentralEvents();
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("all");
  const [facility, setFacility] = useState("all");
  const [bracket, setBracket] = useState("all");
  const [span, setSpan] = useState<"14" | "28" | "56" | "all">("14");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return events
      .filter((event) => {
        if (span !== "all" && ageDays(event.diagnosed_at) >= Number(span)) return false;
        if (region !== "all" && event.region !== region) return false;
        if (facility !== "all" && event.facility_code !== facility) return false;
        if (bracket !== "all" && event.age_bracket !== bracket) return false;
        if (!needle) return true;
        return `${event.diagnosis_code} ${event.diagnosis_name} ${event.city} ${event.district} ${event.occupation}`
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => b.diagnosed_at.localeCompare(a.diagnosed_at));
  }, [events, q, region, facility, bracket, span]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Central ledger"
        title="Events"
        lede="One row is one anonymized diagnosis. There is no column for a person."
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Code, disease, place, job"
          className={inputClass}
          aria-label="Filter events"
        />
        <select value={span} onChange={(event) => setSpan(event.target.value as typeof span)} className={inputClass}>
          <option value="14">Last 14 days</option>
          <option value="28">Last 28 days</option>
          <option value="56">Last 8 weeks</option>
          <option value="all">Full ledger</option>
        </select>
        <select value={region} onChange={(event) => setRegion(event.target.value)} className={inputClass}>
          <option value="all">All regions</option>
          {GEO.map((row) => (
            <option key={row.region}>{row.region}</option>
          ))}
        </select>
        <select value={facility} onChange={(event) => setFacility(event.target.value)} className={inputClass}>
          <option value="all">All facilities</option>
          {FACILITIES.map((row) => (
            <option key={row.code} value={row.code}>
              {row.name}
            </option>
          ))}
        </select>
        <select value={bracket} onChange={(event) => setBracket(event.target.value)} className={inputClass}>
          <option value="all">All ages</option>
          {AGE_BRACKETS.map((row) => (
            <option key={row}>{row}</option>
          ))}
        </select>
      </div>
      <p className="text-sm text-muted">{rows.length} events</p>
      <div className="overflow-x-auto rounded-md border border-line bg-card">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="px-3 py-3 font-medium">Diagnosed</th>
              <th className="px-3 py-3 font-medium">Code</th>
              <th className="px-3 py-3 font-medium">Disease</th>
              <th className="px-3 py-3 font-medium">Age</th>
              <th className="px-3 py-3 font-medium">Occupation</th>
              <th className="px-3 py-3 font-medium">Place</th>
              <th className="px-3 py-3 font-medium">Facility</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 80).map((event) => (
              <tr key={event.event_id} className="border-b border-line last:border-0">
                <td className="px-3 py-2.5 whitespace-nowrap">{formatWhen(event.diagnosed_at)}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{event.diagnosis_code}</td>
                <td className="px-3 py-2.5">{event.diagnosis_name}</td>
                <td className="px-3 py-2.5 tabular-nums">{event.age_bracket}</td>
                <td className="px-3 py-2.5">{event.occupation}</td>
                <td className="px-3 py-2.5">
                  {event.district}, {event.city}
                  <span className="text-muted"> · {event.region}</span>
                </td>
                <td className="px-3 py-2.5">
                  {event.facility_name}
                  <p className="font-mono text-[11px] text-muted">{event.facility_code}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 80 ? <p className="text-xs text-muted">Showing the 80 most recent matches.</p> : null}
    </div>
  );
}
