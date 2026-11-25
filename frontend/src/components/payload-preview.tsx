import type { EpidemiologyPayload } from "@/lib/types";

export function PayloadPreview({
  payload,
  stripped,
}: {
  payload: EpidemiologyPayload;
  stripped: { field: string; value: string; reason: string }[];
}) {
  const sent = Object.entries(payload);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-md border border-clinic/25 bg-sand p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-clinic">Leaves the facility</p>
        <p className="mt-1 text-sm text-ink/80">Whitelist only. This is the body the worker will POST.</p>
        <dl className="mt-3 space-y-1.5">
          {sent.map(([key, value]) => (
            <div key={key} className="grid grid-cols-[9rem_1fr] gap-2 text-sm">
              <dt className="font-mono text-xs text-muted">{key}</dt>
              <dd className="break-all">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="rounded-md border border-clay/30 bg-orange-50/50 p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-clay">Stays in the clinic</p>
        <p className="mt-1 text-sm text-ink/80">Stripped before enqueue. Not present in the payload.</p>
        <ul className="mt-3 space-y-2">
          {stripped.map((row) => (
            <li key={row.field} className="text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-mono text-xs text-muted line-through">{row.field}</span>
                <span className="text-[11px] uppercase tracking-wide text-clay">{row.reason}</span>
              </div>
              <p className="mt-0.5 break-words text-ink/80">{row.value}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
