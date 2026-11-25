"use client";

import { useMemo, useState } from "react";
import { useClinic } from "@/lib/clinic-store";
import type { SyncStatus } from "@/lib/types";
import { cx, formatWhen } from "@/lib/format";
import { DeskPageHeader } from "./desk-chrome";
import { Button, StatusPill } from "@/components/ui";

const STATUS_HELP: Record<SyncStatus, string> = {
  pending: "Waiting for worker flush",
  synced: "Accepted by headquarters",
  failed: "Transport error — retry allowed",
  rejected: "Contract validation failed — manual fix",
};

export function SyncDesk() {
  const { state, flushQueue, retryOne } = useClinic();
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<SyncStatus | "all">("all");
  const actionable = state.queue.some((row) => row.status === "pending" || row.status === "failed");

  const counts = useMemo(() => {
    const tally: Record<SyncStatus, number> = { pending: 0, synced: 0, failed: 0, rejected: 0 };
    for (const row of state.queue) tally[row.status] += 1;
    return tally;
  }, [state.queue]);

  const rows = state.queue.filter((row) => filter === "all" || row.status === filter);
  const lastSynced = useMemo(
    () =>
      [...state.queue]
        .filter((r) => r.syncedAt)
        .sort((a, b) => (b.syncedAt ?? "").localeCompare(a.syncedAt ?? ""))[0],
    [state.queue],
  );

  return (
    <DeskPageHeader
      kicker="Outbound worker"
      title="Sync queue"
      lede="Durable store for anonymized payloads. The clinic chart is already saved — this page only tracks what still needs to reach Taha headquarters."
      actions={
        <Button onClick={flushQueue} disabled={!actionable} className="px-2.5 py-1.5 text-xs">
          {state.facility.online ? "Flush queue" : "Flush (offline)"}
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(["pending", "failed", "synced", "rejected"] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(filter === status ? "all" : status)}
            className={cx(
              "rounded-xl border px-4 py-3 text-left shadow-sm transition",
              filter === status
                ? "border-clinic/40 bg-[#e8f0ff]"
                : "border-[#e8edf3] bg-white hover:border-clinic/25",
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">{status}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-[#0f172a]">{counts[status]}</p>
            <p className="mt-1 text-[11px] leading-4 text-[#64748b]">{STATUS_HELP[status]}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_min(100%,18rem)]">
        <section className="rounded-xl border border-[#e8edf3] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#0f172a]">Queue rows</h2>
            <span
              className={cx(
                "rounded-full px-2.5 py-1 text-[11px] font-medium",
                state.facility.online ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
              )}
            >
              {state.facility.online ? "Link up" : "Link down"}
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {rows.map((row) => (
              <li key={row.eventId} className="rounded-lg border border-[#eef2f6] bg-[#f8fafc] px-3 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={row.status} />
                      <span className="font-mono text-[10px] text-[#94a3b8]">{row.eventId}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-[#0f172a]">
                      {row.payload.diagnosis_code} · {row.payload.diagnosis_name}
                    </p>
                    <p className="text-xs text-[#64748b]">
                      Queued {formatWhen(row.createdAt)} · attempts {row.attempts} · region {row.payload.region}
                    </p>
                    {row.lastError ? <p className="mt-1 text-xs text-clay">{row.lastError}</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOpen(open === row.eventId ? null : row.eventId)}
                      className="rounded-md border border-[#e8edf3] bg-white px-2 py-1 text-[11px] font-medium text-[#64748b] hover:text-clinic"
                    >
                      Payload
                    </button>
                    {(row.status === "pending" || row.status === "failed") && (
                      <button
                        type="button"
                        onClick={() => retryOne(row.eventId)}
                        className="rounded-md bg-clinic px-2 py-1 text-[11px] font-medium text-white"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
                {open === row.eventId ? (
                  <pre className="mt-2 overflow-x-auto rounded-md border border-[#e8edf3] bg-white p-2 text-[10px] leading-5 text-[#1f3892]">
                    {JSON.stringify(row.payload, null, 2)}
                  </pre>
                ) : null}
              </li>
            ))}
            {rows.length === 0 ? <li className="py-6 text-center text-sm text-[#94a3b8]">No rows in this filter.</li> : null}
          </ul>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-[#e8edf3] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[#0f172a]">Worker contract</h2>
            <p className="mt-2 break-all font-mono text-[11px] text-clinic">{state.facility.apiUrl}</p>
            <p className="mt-3 text-xs leading-5 text-[#64748b]">
              Facility code <span className="font-mono text-[#0f172a]">{state.facility.facilityCode}</span>. Rejected rows are
              never retried automatically.
            </p>
          </section>
          <section className="rounded-xl border border-[#e8edf3] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[#0f172a]">Last successful ingest</h2>
            {lastSynced ? (
              <>
                <p className="mt-2 text-sm text-[#0f172a]">{lastSynced.payload.diagnosis_name}</p>
                <p className="text-xs text-[#64748b]">{formatWhen(lastSynced.syncedAt ?? lastSynced.createdAt)}</p>
              </>
            ) : (
              <p className="mt-2 text-xs text-[#94a3b8]">No synced rows yet.</p>
            )}
          </section>
          <section className="rounded-xl border border-dashed border-[#e8edf3] bg-[#f8fafc] p-4">
            <h2 className="text-sm font-semibold text-[#0f172a]">When queue is empty</h2>
            <p className="mt-2 text-xs leading-5 text-[#64748b]">
              Record a diagnosis on the chart desk first. Saving the note always succeeds locally; queueing depends on sync
              being enabled.
            </p>
          </section>
        </aside>
      </div>
    </DeskPageHeader>
  );
}