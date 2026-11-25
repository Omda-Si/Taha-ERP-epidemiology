"use client";

import { useEffect } from "react";
import { Link } from "@/components/link";
import { prefetchAllDeskPages } from "@/lib/prefetch-route";
import { Logo } from "@/components/logo";
import { cx } from "@/lib/format";

const DESK_NAV = [
  { href: "/desk/diagnose", label: "Record diagnosis" },
  { href: "/desk/sync", label: "Sync queue" },
  { href: "/desk/signals", label: "Disease signals" },
] as const;

export function DeskChrome({
  active,
  kicker,
  title,
  lede,
  actions,
  children,
}: {
  active: (typeof DESK_NAV)[number]["href"];
  kicker: string;
  title: string;
  lede?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    prefetchAllDeskPages();
  }, []);

  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f8fafc] text-[#0f172a]">
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
                  "rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
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

      <div className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="flex shrink-0 flex-wrap items-end justify-between gap-4 border-b border-[#e8edf3] pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-clinic">{kicker}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#0f172a] sm:text-3xl">{title}</h1>
            {lede ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748b]">{lede}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>

        <div className="mt-5 min-h-0 flex-1 overflow-y-auto pb-4">{children}</div>
      </div>
    </main>
  );
}