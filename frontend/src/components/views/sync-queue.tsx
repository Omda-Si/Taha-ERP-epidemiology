"use client";

import { Link } from "@/components/link";
import { useState } from "react";
import { useClinic } from "@/lib/clinic-store";
import type { SyncStatus } from "@/lib/types";
import { formatWhen } from "@/lib/format";
import { Button, PageHeader, StatusPill } from "@/components/ui";

const FILTERS: Array<SyncStatus | "all"> = ["all", "pending", "failed", "synced", "rejected"];

export function SyncQueue() {
  const { state, flushQueue, retryOne } = useClinic();
  const [filter, setFilter] = useState<SyncStatus | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const rows = state.queue.filter((row) => filter === "all" || row.status === filter);
  const actionable = state.queue.some((row) => row.status === "pending" || row.status === "failed");

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Offline queue"
        title="Sync"
        lede="Durable anonymized rows. 2xx marks synced. Transport errors stay failed and retry. A 4xx validation reject stays rejected."
        actions={
          <Button onClick={flushQueue} disabled={!actionable}>
            {state.facility.online ? "Flush pending and failed" : "Attempt flush (offline)"}
          </Button>
        }
      />
      <p className="rounded-md border border-line bg-sand px-4 py-3 text-sm leading-6">
        Demo worker. Flush does not open a socket. It applies the same status rules the cron would: online clinic moves
        pending and failed rows to synced; offline clinic increments attempts and keeps the row. Rejected rows are left
        alone. Contract: <span className="font-mono text-xs">{state.facility.apiUrl}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={
              filter === item
                ? "rounded-full bg-ink px-3 py-1 text-xs text-paper"
                : "rounded-full border border-line px-3 py-1 text-xs text-muted"
            }
          >
            {item}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {rows.map((row) => {
          const diagnosis = state.diagnoses.find((item) => item.id === row.diagnosisId);
          const person = diagnosis ? state.patients.find((item) => item.id === diagnosis.patientId) : undefined;
          return (
            <article key={row.eventId} className="rounded-md border border-line bg-card">
              <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={row.status} />
                    <span className="font-mono text-xs text-muted">{row.eventId}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium">
                    {row.payload.diagnosis_code} · {row.payload.diagnosis_name}
                  </p>
                  <p className="text-sm text-muted">
                    Chart: {person?.name ?? "unknown"} · queued {formatWhen(row.createdAt)} · attempts {row.attempts}
                  </p>
                  {row.lastError ? <p className="mt-1 text-sm text-clay">{row.lastError}</p> : null}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setOpen(open === row.eventId ? null : row.eventId)}>
                    {open === row.eventId ? "Hide payload" : "Payload"}
                  </Button>
                  {row.status === "pending" || row.status === "failed" ? (
                    <Button variant="ghost" onClick={() => retryOne(row.eventId)}>
                      Retry
                    </Button>
                  ) : null}
                  {diagnosis ? (
                    <Link
                      href={`/clinic/patients/${diagnosis.patientId}`}
                      className="inline-flex items-center rounded-md border border-line px-3 py-2 text-sm hover:bg-sand"
                    >
                      Chart
                    </Link>
                  ) : null}
                </div>
              </div>
              {open === row.eventId ? (
                <pre className="overflow-x-auto border-t border-line bg-sand px-4 py-3 text-xs leading-5">
                  {JSON.stringify(row.payload, null, 2)}
                </pre>
              ) : null}
            </article>
          );
        })}
        {rows.length === 0 ? <p className="text-sm text-muted">No rows in this state.</p> : null}
      </div>
    </div>
  );
}
