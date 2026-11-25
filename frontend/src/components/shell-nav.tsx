"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@/components/link";
import { cx } from "@/lib/format";
import { useNav } from "@/lib/nav";

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

export function NavItem({
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