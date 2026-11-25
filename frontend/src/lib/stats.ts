import { DEMO_END_MS } from "./catalog";
import { formatDay } from "./format";
import type { CentralEvent } from "./types";

const WEEK_MS = 7 * 86400000;
const DAY_MS = 86400000;

export type CountRow = { label: string; value: number; hint?: string };

export type Outbreak = {
  id: string;
  diagnosisCode: string;
  diagnosisName: string;
  region: string;
  recent: number;
  prior: number;
};

export function ageDays(iso: string) {
  return (DEMO_END_MS - new Date(iso).getTime()) / DAY_MS;
}

function inRecent(iso: string) {
  const age = ageDays(iso);
  return age < 14;
}

function inPrior(iso: string) {
  const age = ageDays(iso);
  return age >= 14 && age < 28;
}

export function weeklySeries(events: Pick<CentralEvent, "diagnosed_at">[], weeks = 8): CountRow[] {
  const buckets = Array.from({ length: weeks }, (_, index) => {
    const stop = DEMO_END_MS - (weeks - 1 - index) * WEEK_MS;
    const start = stop - WEEK_MS;
    return {
      start,
      stop,
      label: formatDay(new Date(start).toISOString()),
      value: 0,
    };
  });

  for (const event of events) {
    const t = new Date(event.diagnosed_at).getTime();
    const last = buckets[buckets.length - 1];
    if (t >= last.stop) {
      last.value += 1;
      continue;
    }
    for (const bucket of buckets) {
      if (t >= bucket.start && t < bucket.stop) {
        bucket.value += 1;
        break;
      }
    }
  }

  return buckets.map(({ label, value }) => ({ label, value }));
}

export function countBy(events: CentralEvent[], key: (event: CentralEvent) => string): CountRow[] {
  const map = new Map<string, number>();
  for (const event of events) {
    const label = key(event);
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

export function outbreaks(events: CentralEvent[]): Outbreak[] {
  const groups = new Map<string, Outbreak>();
  for (const event of events) {
    const id = `${event.diagnosis_code}|${event.region}`;
    const row = groups.get(id) ?? {
      id,
      diagnosisCode: event.diagnosis_code,
      diagnosisName: event.diagnosis_name,
      region: event.region,
      recent: 0,
      prior: 0,
    };
    if (inRecent(event.diagnosed_at)) row.recent += 1;
    else if (inPrior(event.diagnosed_at)) row.prior += 1;
    groups.set(id, row);
  }

  return [...groups.values()]
    .filter((row) => row.recent >= 6 && (row.prior === 0 || row.recent >= row.prior * 1.75) && row.recent - row.prior >= 4)
    .sort((a, b) => b.recent - b.prior - (a.recent - a.prior));
}

export function lastDays(events: CentralEvent[], days: number) {
  return events.filter((event) => ageDays(event.diagnosed_at) < days);
}

export function ratioLabel(recent: number, prior: number) {
  if (prior === 0) return "new in window";
  const ratio = recent / prior;
  return `${ratio.toFixed(1)}× prior`;
}
