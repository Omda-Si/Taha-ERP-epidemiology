"use client";

import { Link } from "@/components/link";
import { Logo } from "@/components/logo";
import { cx } from "@/lib/format";

const DESK_NAV = [
  { href: "/desk/diagnose", label: "Record diagnosis" },
  { href: "/desk/sync", label: "Sync queue" },
  { href: "/desk/signals", label: "Disease signals" },
] as const;

export type DeskActiveHref = (typeof DESK_NAV)[number]["href"];

export function DeskShellNav({ active }: { active: string }) {
  return (
    <header className="shrink-0 border-b border-[#e8edf3] bg-white px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" title="Home" aria-label="Taha Clinic home">
          <Logo compact />
        </Link>
        <nav className="flex flex-wrap gap-1 sm:justify-end" aria-label="Desk sections">
          {DESK_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "rounded-md px-2 py-1 text-[11px] font-medium leading-tight transition",
                item.href === active
                  ? "bg-clinic text-white shadow-[0_4px_14px_rgba(0,86,255,0.25)]"
                  : "text-[#64748b] hover:bg-[#f4f7fb] hover:text-clinic",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function DeskPageHeader({
  kicker,
  title,
  lede,
  actions,
  children,
}: {
  kicker: string;
  title: string;
  lede?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col py-4 sm:py-5">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-[#e8edf3] pb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-clinic">{kicker}</p>
          <h1 className="mt-0.5 text-lg font-semibold tracking-tight text-[#0f172a] sm:text-xl">{title}</h1>
          {lede ? <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[#64748b]">{lede}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 text-[11px]">{actions}</div> : null}
      </div>
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pb-4">{children}</div>
    </div>
  );
}

/** @deprecated Use DeskShell + DeskPageHeader */
export function DeskChrome({
  active: _active,
  ...rest
}: {
  active: DeskActiveHref;
  kicker: string;
  title: string;
  lede?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return <DeskPageHeader {...rest} />;
}