"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "@/components/link";
import {
  IconBell,
  IconCalendar,
  IconGrid,
  IconMenu,
  IconNotes,
  IconPin,
  IconPulse,
  IconQueue,
  IconSearch,
  IconSidebarToggle,
  IconUsers,
} from "@/components/clinic-icons";
import { Logo } from "@/components/logo";
import { HqScreen } from "@/components/hq-screens";
import { NavItem } from "@/components/shell-nav";
import { cx } from "@/lib/format";
import { useNav } from "@/lib/nav";
import { useCentralEvents } from "@/lib/use-central-events";
import { outbreaks } from "@/lib/stats";

const HQ_SIDEBAR_KEY = "teedss.hq.sidebarCollapsed";

export function HqShell({ children: _children }: { children?: React.ReactNode }) {
  const events = useCentralEvents();
  const [flagCount, setFlagCount] = useState(0);
  const { path, search, push } = useNav();
  const body = <HqScreen key={`${path}${search}`} path={path} search={search} />;
  const mainRef = useRef<HTMLElement>(null);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navCompact = collapsed && !mobileNavOpen;

  useEffect(() => {
    const run = () => setFlagCount(outbreaks(events).length);
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(run);
      return () => cancelIdleCallback(id);
    }
    const timer = window.setTimeout(run, 0);
    return () => window.clearTimeout(timer);
  }, [events]);

  useLayoutEffect(() => {
    try {
      const saved = localStorage.getItem(HQ_SIDEBAR_KEY);
      if (saved === "1") setCollapsed(true);
    } catch {
      /* private mode */
    }
  }, []);

  useLayoutEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 });
  }, [path, search]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [path, search]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function toggleSidebar() {
    setCollapsed((value) => {
      const next = !value;
      try {
        localStorage.setItem(HQ_SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div className="h-full min-h-0 overflow-x-hidden bg-white">
      <div className="mx-auto flex h-full w-full max-w-[1440px] flex-col bg-white">
        <div className="flex shrink-0 flex-col border-b border-[#eef2f6] bg-white lg:flex-row lg:items-stretch">
          <div className="flex min-w-0 items-center gap-2 px-3 py-2.5 sm:gap-1.5 sm:py-3 lg:w-[220px] lg:shrink-0 lg:border-r lg:border-[#eef2f6]">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#e8edf3] text-[#64748b] lg:hidden"
              aria-label="Open menu"
            >
              <IconMenu />
            </button>
            <Link href="/" className="min-w-0 flex-1" title="Back to home" aria-label="Taha Clinic home">
              <Logo compact />
            </Link>
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#e8edf3] text-[#64748b] transition hover:border-clinic/30 hover:bg-[#f4f7fb] hover:text-clinic lg:grid"
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <IconSidebarToggle collapsed={collapsed} />
            </button>
          </div>
          <div className="flex min-h-[3.5rem] min-w-0 flex-1 flex-col gap-2 border-t border-[#eef2f6] bg-[#f8fafc] px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:px-4 sm:py-3 lg:min-h-[4.25rem] lg:border-t-0 lg:px-5">
            <form
              className="flex w-full min-w-0 flex-1 items-center gap-2 rounded-full border border-[#e8edf3] bg-white px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5 lg:min-w-[200px]"
              onSubmit={(event) => {
                event.preventDefault();
                const query = String(new FormData(event.currentTarget).get("q") ?? "").trim();
                push(query ? `/hq/events?q=${encodeURIComponent(query)}` : "/hq/events");
              }}
            >
              <span className="text-[#94a3b8]">
                <IconSearch />
              </span>
              <input
                name="q"
                placeholder="Search surveillance ledger"
                aria-label="Search surveillance ledger"
                className="min-w-0 flex-1 bg-transparent text-sm text-[#334155] outline-none placeholder:text-[#94a3b8]"
              />
            </form>
            <div className="flex w-full items-center justify-end gap-1.5 sm:ml-auto sm:w-auto sm:gap-2">
              <span className="hidden rounded-full bg-[#e8f0ff] px-2.5 py-1 text-xs font-medium text-clinic-deep sm:inline">
                Anonymized feed
              </span>
              <Link
                href="/hq/diseases"
                className="relative grid h-10 w-10 place-items-center rounded-full border border-[#e8edf3] bg-white text-[#64748b]"
                aria-label="Outbreak flags"
              >
                <IconBell />
                {flagCount > 0 ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-clay" /> : null}
              </Link>
              <span className="flex items-center gap-2 rounded-full border border-[#e8edf3] bg-white py-1.5 pl-1.5 pr-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-navy text-xs font-semibold text-white">HQ</span>
                <span className="hidden text-left text-xs leading-tight sm:block">
                  <span className="block font-semibold text-[#0f172a]">Surveillance</span>
                  <span className="text-[#94a3b8]">Headquarters</span>
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1">
          {mobileNavOpen ? (
            <button
              type="button"
              className="fixed inset-0 z-40 bg-[#0f172a]/40 lg:hidden"
              aria-label="Close menu"
              onClick={() => setMobileNavOpen(false)}
            />
          ) : null}
          <aside
            className={cx(
              "fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col border-r border-[#eef2f6] bg-white shadow-xl transition-transform duration-200 ease-out lg:static lg:z-30 lg:min-h-0 lg:shrink-0 lg:shadow-none lg:transition-[width]",
              mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
              collapsed ? "lg:w-[68px] lg:overflow-visible" : "lg:w-[220px]",
            )}
          >
            <div className="flex items-center justify-between border-b border-[#eef2f6] px-3 py-3 lg:hidden">
              <span className="text-sm font-semibold text-[#0f172a]">Headquarters</span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-[#e8edf3] text-[#64748b]"
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <div
              className={cx(
                "flex min-h-0 flex-1 flex-col overscroll-contain",
                collapsed ? "overflow-x-visible overflow-y-auto" : "overflow-y-auto",
              )}
            >
              {!navCompact ? (
                <p className="mt-3 px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">Surveillance</p>
              ) : null}
              <nav className={cx("mt-2 flex flex-col gap-0.5", navCompact ? "px-1.5" : "px-2.5")}>
                <NavItem href="/hq" label="Surveillance desk" icon={<IconGrid />} match="path-only" compact={navCompact} />
                <NavItem
                  href="/hq/diseases"
                  label="Diseases"
                  icon={<IconPulse />}
                  match="prefix"
                  compact={navCompact}
                  badge={flagCount || undefined}
                />
                <NavItem href="/hq/geography" label="Geography" icon={<IconPin />} match="prefix" compact={navCompact} />
                <NavItem href="/hq/demographics" label="People" icon={<IconUsers />} match="prefix" compact={navCompact} />
                <NavItem href="/hq/facilities" label="Facilities" icon={<IconNotes />} match="prefix" compact={navCompact} />
                <NavItem href="/hq/events" label="Ledger" icon={<IconQueue />} match="prefix" compact={navCompact} />
              </nav>
            </div>

            <div className={cx("sticky bottom-0 shrink-0 border-t border-[#eef2f6] bg-white py-3", navCompact ? "px-1.5" : "px-2.5")}>
              <NavItem href="/clinic" label="Clinic" icon={<IconCalendar />} compact={navCompact} />
            </div>
          </aside>

          <main
            ref={mainRef}
            className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-[#f8fafc] px-3 py-3 pb-5 sm:px-4 md:px-5"
          >
            {body}
          </main>
        </div>
      </div>
    </div>
  );
}