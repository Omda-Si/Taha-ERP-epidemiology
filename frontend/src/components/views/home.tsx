"use client";

import { Link } from "@/components/link";
import { Logo } from "@/components/logo";
import { WHITELIST } from "@/lib/catalog";

export function HomeView() {
  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-8 md:grid-cols-[1.15fr_0.85fr] md:py-14">
        <div>
          <Logo />
          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-clinic">Epidemiological sync</p>
          <h1 className="mt-3 max-w-xl text-5xl font-semibold leading-[1.05] tracking-tight">
            Disease signal for headquarters. Identifiers stay in the clinic.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted">
            The clinic ERP keeps running if the network does not. A saved diagnosis writes an anonymized row to a local
            queue. The worker posts that row later. HQ charts disease, age bracket, occupation, and place. It never
            receives a name, phone, national ID, street, or clinical note.
          </p>
          <ol className="mt-8 space-y-3 text-sm">
            <li className="grid grid-cols-[auto_1fr] gap-3">
              <span className="font-mono text-xs text-muted">01</span>
              <span>Clinic records the patient, the visit, and the diagnosis. That chart is local.</span>
            </li>
            <li className="grid grid-cols-[auto_1fr] gap-3">
              <span className="font-mono text-xs text-muted">02</span>
              <span>Anonymizer keeps ten whitelist fields and drops everything else into the queue as pending.</span>
            </li>
            <li className="grid grid-cols-[auto_1fr] gap-3">
              <span className="font-mono text-xs text-muted">03</span>
              <span>HQ reads the central ledger: outbreaks, regions, age brackets, occupations. No patient table.</span>
            </li>
          </ol>
          <div className="mt-8 flex flex-wrap gap-2">
            {WHITELIST.map((key) => (
              <span key={key} className="rounded-full border border-line bg-card px-2.5 py-1 font-mono text-[11px] text-muted">
                {key}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Link href="/clinic" className="group rounded-md border border-line bg-card p-5 transition hover:border-clinic">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-clinic">Tier 1</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Clinic workstation</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Register, book, diagnose. Watch the sync queue move from pending to synced without blocking the save.
            </p>
            <p className="mt-4 text-sm font-medium text-clinic group-hover:underline">Open Taha Clinic Khartoum</p>
          </Link>
          <Link href="/hq" className="group rounded-md border border-navy bg-navy p-5 text-paper transition hover:bg-navy/90">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-paper/60">Tier 3</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">HQ analytics</h2>
            <p className="mt-2 text-sm leading-6 text-paper/75">
              Six facilities. Outbreak flags where the last two weeks diverge from the two weeks before.
            </p>
            <p className="mt-4 text-sm font-medium group-hover:underline">Open the surveillance desk</p>
          </Link>
          <p className="text-xs leading-5 text-muted">
            This frontend is the clinic UX and the HQ dashboard from the architecture. The worker and the ingest API are
            simulated in the browser. Nothing is transmitted.
          </p>
        </div>
      </div>
    </main>
  );
}
