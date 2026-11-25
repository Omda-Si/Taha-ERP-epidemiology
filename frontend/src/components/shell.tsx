"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@/components/link";
import {
  IconBell,
  IconCalendar,
  IconGear,
  IconGrid,
  IconNotes,
  IconPin,
  IconPulse,
  IconQueue,
  IconMenu,
  IconSearch,
  IconSidebarToggle,
  IconUser,
  IconUsers,
} from "@/components/clinic-icons";
import { Logo } from "@/components/logo";
import { ClinicScreen, HqScreen } from "@/components/screens";
import { cx } from "@/lib/format";
import { useClinic } from "@/lib/clinic-store";
import { useNav } from "@/lib/nav";
import { useCentralEvents } from "@/lib/use-central-events";
import { outbreaks } from "@/lib/stats";

const SIDEBAR_KEY = "teedss.clinic.sidebarCollapsed";
const HQ_SIDEBAR_KEY = "teedss.hq.sidebarCollapsed";

function navSearchKey(search: string) {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(raw).toString();
}

function parseNavHref(href: string) {
  const url = new URL(href, "http://local");
  return { path: url.pathname, search: url.search };
}

function navIsActive(path: string, search: string, href: string, match: "full" | "prefix" | "path-only") {
  const target = parseNavHref(href);
  if (match === "prefix") {
    return path === target.path || path.startsWith(`${target.path}/`);
  }
  if (path !== target.path) return false;
  if (match === "path-only") return navSearchKey(search) === "";
  return navSearchKey(search) === navSearchKey(target.search);
}

function NavFlyout({
  label,
  badge,
  show,
  anchorRef,
}: {
  label: string;
  badge?: number;
  show: boolean;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (!show) return;
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ x: rect.right + 8, y: rect.top + rect.height / 2 });
  }, [show, anchorRef]);

  if (!show || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="tooltip"
      style={{ position: "fixed", left: pos.x, top: pos.y, transform: "translateY(-50%)" }}
      className="pointer-events-none z-[200] whitespace-nowrap rounded-lg border border-[#e8edf3] bg-[#0f172a] px-2.5 py-1.5 text-xs font-medium text-white shadow-[0_8px_24px_rgba(15,23,42,0.2)]"
    >
      {label}
      {badge ? <span className="ml-1.5 text-[#93c5fd]">({badge})</span> : null}
    </div>,
    document.body,
  );
}

function NavItem({
  href,
  label,
  icon,
  match = "full",
  badge,
  compact,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  match?: "full" | "prefix" | "path-only";
  badge?: number;
  compact?: boolean;
}) {
  const { path, search } = useNav();
  const active = navIsActive(path, search, href, match);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [flyout, setFlyout] = useState(false);

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={() => compact && setFlyout(true)}
      onMouseLeave={() => setFlyout(false)}
      onFocusCapture={() => compact && setFlyout(true)}
      onBlurCapture={() => setFlyout(false)}
    >
      <Link
        href={href}
        title={compact ? label : undefined}
        aria-label={compact ? label : undefined}
        className={cx(
          "relative flex items-center rounded-lg py-2 text-[13px] transition",
          compact ? "justify-center px-2" : "gap-2.5 px-2.5",
          active ? "bg-[#e8f0ff] font-medium text-clinic" : "text-[#64748b] hover:bg-[#f4f7fb]",
        )}
      >
        <span className={active ? "text-clinic" : "text-[#94a3b8]"}>{icon}</span>
        {!compact ? <span className="min-w-0 flex-1 truncate">{label}</span> : null}
        {!compact && badge ? (
          <span className="rounded-md bg-clinic/10 px-1.5 py-0.5 text-[10px] font-semibold text-clinic">{badge}</span>
        ) : null}
        {compact && badge ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-clinic" aria-hidden="true" /> : null}
      </Link>
      {compact ? <NavFlyout label={label} badge={badge} show={flyout} anchorRef={wrapRef} /> : null}
    </div>
  );
}

export function ClinicShell({ children: _children }: { children?: React.ReactNode }) {
  const { state } = useClinic();
  const { path, search, push } = useNav();
  const body = <ClinicScreen key={`${path}${search}`} path={path} search={search} />;
  const waiting = state.queue.filter((row) => row.status === "pending" || row.status === "failed").length;
  const mainRef = useRef<HTMLElement>(null);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navCompact = collapsed && !mobileNavOpen;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_KEY);
      if (saved === "1") setCollapsed(true);
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
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
        localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div className="h-dvh min-h-dvh overflow-x-hidden bg-white supports-[height:100dvh]:min-h-[100dvh] supports-[height:100dvh]:h-[100dvh]">
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
                push(query ? `/clinic/patients?q=${encodeURIComponent(query)}` : "/clinic/patients");
              }}
            >
              <span className="text-[#94a3b8]">
                <IconSearch />
              </span>
              <input
                name="q"
                placeholder="Search anything here"
                aria-label="Search anything here"
                className="min-w-0 flex-1 bg-transparent text-sm text-[#334155] outline-none placeholder:text-[#94a3b8]"
              />
            </form>
            <div className="flex w-full items-center justify-end gap-1.5 sm:ml-auto sm:w-auto sm:gap-2">
              <span
                className={cx(
                  "hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline",
                  state.facility.online ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
                )}
              >
                {state.facility.online ? "Online" : "Offline"}
              </span>
              <Link
                href="/clinic/sync"
                className="relative grid h-10 w-10 place-items-center rounded-full border border-[#e8edf3] bg-white text-[#64748b]"
                aria-label="Notifications"
              >
                <IconBell />
                {waiting ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-clinic" /> : null}
              </Link>
              <Link href="/clinic/settings" className="flex items-center gap-2 rounded-full border border-[#e8edf3] bg-white py-1.5 pl-1.5 pr-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-clinic text-xs font-semibold text-white">RN</span>
                <span className="hidden text-left text-xs leading-tight sm:block">
                  <span className="block font-semibold text-[#0f172a]">Reception</span>
                  <span className="text-[#94a3b8]">Taha Clinic</span>
                </span>
              </Link>
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
              <span className="text-sm font-semibold text-[#0f172a]">Menu</span>
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
            <nav className={cx("mt-2 flex flex-col gap-0.5", navCompact ? "px-1.5" : "px-2.5")}>
              <NavItem href="/clinic" label="Dashboard" icon={<IconGrid />} match="path-only" compact={navCompact} />
              <NavItem href="/clinic/appointments" label="Calendar" icon={<IconCalendar />} match="path-only" compact={navCompact} />
              <NavItem href="/clinic/patients" label="Patient Directory" icon={<IconUsers />} match="prefix" compact={navCompact} />
              <NavItem href="/clinic/appointments?view=book" label="Book Appt" icon={<IconUser />} compact={navCompact} />
              <NavItem href="/clinic/diagnose" label="Consultation Notes" icon={<IconNotes />} match="path-only" compact={navCompact} />
              <NavItem href="/clinic/settings?view=locations" label="Locations" icon={<IconPin />} compact={navCompact} />
              <NavItem href="/clinic/sync" label="Communications" icon={<IconPulse />} badge={waiting || undefined} match="path-only" compact={navCompact} />
              <NavItem href="/clinic/settings?view=billing" label="Billing" icon={<IconQueue />} compact={navCompact} />
            </nav>

            {!navCompact ? (
              <p className="mt-4 px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">Account</p>
            ) : (
              <div className="mx-3 mt-4 border-t border-[#eef2f6]" aria-hidden="true" />
            )}
            <nav className={cx("mt-2 flex flex-col gap-0.5 pb-2", navCompact ? "px-1.5" : "px-2.5")}>
              <NavItem href="/clinic/settings?view=information" label="Information" icon={<IconUsers />} compact={navCompact} />
              <NavItem href="/clinic/settings" label="Setting" icon={<IconGear />} match="path-only" compact={navCompact} />
            </nav>
          </div>

          <div className={cx("sticky bottom-0 shrink-0 border-t border-[#eef2f6] bg-white py-3", navCompact ? "px-1.5" : "px-2.5")}>
            <NavItem href="/hq" label="Headquarters" icon={<IconUsers />} compact={navCompact} />
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

export function HqShell({ children: _children }: { children?: React.ReactNode }) {
  const events = useCentralEvents();
  const flagCount = outbreaks(events).length;
  const { path, search, push } = useNav();
  const body = <HqScreen key={`${path}${search}`} path={path} search={search} />;
  const mainRef = useRef<HTMLElement>(null);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navCompact = collapsed && !mobileNavOpen;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HQ_SIDEBAR_KEY);
      if (saved === "1") setCollapsed(true);
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
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
    <div className="h-dvh min-h-dvh overflow-x-hidden bg-white supports-[height:100dvh]:min-h-[100dvh] supports-[height:100dvh]:h-[100dvh]">
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