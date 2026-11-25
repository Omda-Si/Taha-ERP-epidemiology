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
  IconSearch,
  IconSidebarToggle,
  IconUser,
  IconUsers,
} from "@/components/clinic-icons";
import { Logo, Mark } from "@/components/logo";
import { ClinicScreen, HqScreen } from "@/components/screens";
import { cx } from "@/lib/format";
import { useClinic } from "@/lib/clinic-store";
import { useNav } from "@/lib/nav";

const SIDEBAR_KEY = "teedss.clinic.sidebarCollapsed";

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
  const onBoard = path === "/clinic";
  const mainRef = useRef<HTMLElement>(null);

  const [collapsed, setCollapsed] = useState(false);

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
    <div className="h-dvh min-h-dvh bg-white">
      <div className="mx-auto flex h-full w-full max-w-[1440px] bg-white">
        <aside
          className={cx(
            "sticky top-0 z-30 flex h-dvh shrink-0 flex-col border-r border-[#eef2f6] bg-white transition-[width] duration-200 ease-out",
            collapsed ? "w-[68px] overflow-visible" : "w-[220px]",
          )}
        >
          <div className={cx("sticky top-0 z-10 shrink-0 border-b border-transparent bg-white", collapsed ? "px-2 pt-4 pb-2" : "px-3 pt-4 pb-2")}>
            <div className={cx("flex items-center", collapsed ? "flex-col gap-2" : "gap-1")}>
              <Link href="/" className={cx("min-w-0", collapsed ? "grid place-items-center" : "inline-block flex-1")} title="Taha Clinic">
                {collapsed ? <Mark className="h-8 w-8 shrink-0" /> : <Logo />}
              </Link>
              <button
                type="button"
                onClick={toggleSidebar}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#e8edf3] text-[#64748b] transition hover:border-clinic/30 hover:bg-[#f4f7fb] hover:text-clinic"
                aria-expanded={!collapsed}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <IconSidebarToggle collapsed={collapsed} />
              </button>
            </div>
          </div>

          <div
            className={cx(
              "flex min-h-0 flex-1 flex-col overscroll-contain",
              collapsed ? "overflow-x-visible overflow-y-auto" : "overflow-y-auto",
            )}
          >
            <nav className={cx("mt-2 flex flex-col gap-0.5", collapsed ? "px-1.5" : "px-2.5")}>
              <NavItem href="/clinic" label="Dashboard" icon={<IconGrid />} match="path-only" compact={collapsed} />
              <NavItem href="/clinic/appointments" label="Calendar" icon={<IconCalendar />} match="path-only" compact={collapsed} />
              <NavItem href="/clinic/patients" label="Patient Directory" icon={<IconUsers />} match="prefix" compact={collapsed} />
              <NavItem href="/clinic/appointments?view=book" label="Book Appt" icon={<IconUser />} compact={collapsed} />
              <NavItem href="/clinic/diagnose" label="Consultation Notes" icon={<IconNotes />} match="path-only" compact={collapsed} />
              <NavItem href="/clinic/settings?view=locations" label="Locations" icon={<IconPin />} compact={collapsed} />
              <NavItem href="/clinic/sync" label="Communications" icon={<IconPulse />} badge={waiting || undefined} match="path-only" compact={collapsed} />
              <NavItem href="/clinic/settings?view=billing" label="Billing" icon={<IconQueue />} compact={collapsed} />
            </nav>

            {!collapsed ? (
              <p className="mt-4 px-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">Account</p>
            ) : (
              <div className="mx-3 mt-4 border-t border-[#eef2f6]" aria-hidden="true" />
            )}
            <nav className={cx("mt-2 flex flex-col gap-0.5 pb-2", collapsed ? "px-1.5" : "px-2.5")}>
              <NavItem href="/clinic/settings?view=information" label="Information" icon={<IconUsers />} compact={collapsed} />
              <NavItem href="/clinic/settings" label="Setting" icon={<IconGear />} match="path-only" compact={collapsed} />
            </nav>
          </div>

          <div className={cx("sticky bottom-0 shrink-0 border-t border-[#eef2f6] bg-white py-3", collapsed ? "px-1.5" : "px-2.5")}>
            <NavItem href="/hq" label="Headquarters" icon={<IconUsers />} compact={collapsed} />
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#f8fafc]">
          <header className="sticky top-0 z-10 flex shrink-0 flex-wrap items-center gap-3 border-b border-[#f3f4f6] bg-white px-5 py-4 md:px-6">
            {onBoard ? (
              <div className="min-h-[42px] min-w-[220px] flex-1" aria-hidden />
            ) : (
              <form
                className="flex min-w-[220px] flex-1 items-center gap-3 rounded-full border border-[#e8edf3] bg-[#f8fafc] px-4 py-2.5"
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
            )}
            <div className="ml-auto flex items-center gap-2">
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
                <span className="text-left text-xs leading-tight">
                  <span className="block font-semibold text-[#0f172a]">Reception</span>
                  <span className="text-[#94a3b8]">Taha Clinic</span>
                </span>
              </Link>
            </div>
          </header>
          <main
            ref={mainRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-5 md:px-5"
          >
            {body}
          </main>
        </div>
      </div>
    </div>
  );
}

export function HqShell({ children: _children }: { children?: React.ReactNode }) {
  const { path, search } = useNav();
  const body = <HqScreen key={path} path={path} search={search} />;
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
        <div className="px-5 py-6">{body}</div>
      </div>
    </div>
  );
}

function HqLink({ href, label, exact }: { href: string; label: string; exact?: boolean }) {
  const { path } = useNav();
  const active = exact ? path === href : path === href || path.startsWith(`${href}/`);
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