"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { cx } from "@/lib/format";
import { useClinic } from "@/lib/clinic-store";

function NavLink({ href, label, exact }: { href: string; label: string; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cx(
        "rounded-md px-3 py-2 text-sm transition",
        active ? "bg-navy text-white" : "text-ink/80 hover:bg-sand",
      )}
    >
      {label}
    </Link>
  );
}

export function ClinicShell({ children }: { children: React.ReactNode }) {
  const { state } = useClinic();
  const waiting = state.queue.filter((row) => row.status === "pending" || row.status === "failed").length;

  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <aside className="border-b border-line bg-card md:min-h-screen md:border-r md:border-b-0">
        <div className="flex items-center justify-between px-4 py-4 md:block">
          <Link href="/" className="block">
            <Logo />
          </Link>
          <p className="mt-3 hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-clinic md:block">Clinic</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-3">
          <NavLink href="/clinic" label="Board" exact />
          <NavLink href="/clinic/patients" label="Patients" />
          <NavLink href="/clinic/appointments" label="Appointments" />
          <NavLink href="/clinic/diagnose" label="Diagnose" />
          <NavLink href="/clinic/sync" label={waiting ? `Sync queue · ${waiting}` : "Sync queue"} />
          <NavLink href="/clinic/settings" label="Settings" />
        </nav>
      </aside>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3 text-sm">
          <p>
            <span className="font-medium">{state.facility.name}</span>
            <span className="text-muted"> · {state.facility.facilityCode}</span>
          </p>
          <p className={state.facility.online ? "text-clinic" : "text-clay"}>
            {state.facility.online ? "Link up" : "Offline — queue held locally"}
            {!state.facility.syncEnabled ? " · sync disabled" : ""}
          </p>
        </div>
        <div className="px-5 py-6">{children}</div>
      </div>
    </div>
  );
}

export function HqShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <aside className="border-b border-line bg-navy text-white md:min-h-screen md:border-r md:border-b-0">
        <div className="px-4 py-4">
          <Link href="/" className="block">
            <Logo tone="onNavy" />
          </Link>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky">Headquarters</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col">
          <HqLink href="/hq" label="Overview" exact />
          <HqLink href="/hq/diseases" label="Diseases" />
          <HqLink href="/hq/geography" label="Geography" />
          <HqLink href="/hq/demographics" label="People" />
          <HqLink href="/hq/facilities" label="Facilities" />
          <HqLink href="/hq/events" label="Ledger" />
        </nav>
      </aside>
      <div className="min-w-0">
        <div className="border-b border-line px-5 py-3 text-sm text-muted">
          Anonymized surveillance. Names, phones, national IDs, and street addresses are not in this database.
        </div>
        <div className="px-5 py-6">{children}</div>
      </div>
    </div>
  );
}

function HqLink({ href, label, exact }: { href: string; label: string; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cx(
        "rounded-md px-3 py-2 text-sm transition",
        active ? "bg-white text-navy" : "text-white/80 hover:bg-white/10",
      )}
    >
      {label}
    </Link>
  );
}
