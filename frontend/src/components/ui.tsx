import Link from "next/link";
import { cx } from "@/lib/format";
import type { SyncStatus } from "@/lib/types";

export function PageHeader({
  kicker,
  title,
  lede,
  actions,
}: {
  kicker: string;
  title: string;
  lede?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div className="max-w-2xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{kicker}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        {lede ? <p className="mt-2 text-sm leading-6 text-muted">{lede}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export const inputClass =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-clinic focus:ring-2 focus:ring-clinic/15";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint ? <p className="mt-1 text-xs leading-5 text-muted">{hint}</p> : null}
    </label>
  );
}

export function Button({
  children,
  variant = "primary",
  tone = "clinic",
  type = "button",
  disabled,
  onClick,
  className,
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "danger";
  tone?: "clinic" | "navy";
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const solid = tone === "navy" ? "bg-navy hover:bg-navy/90" : "bg-clinic hover:bg-clinic-deep";
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" && `${solid} text-white`,
        variant === "ghost" && "border border-line bg-card text-ink hover:bg-sand",
        variant === "danger" && "bg-clay text-white hover:bg-clay/90",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-medium text-clinic underline-offset-2 hover:underline">
      {children}
    </Link>
  );
}

const STATUS: Record<SyncStatus, string> = {
  pending: "bg-amber-100 text-amber-950",
  synced: "bg-emerald-100 text-emerald-950",
  failed: "bg-red-100 text-red-900",
  rejected: "bg-stone-200 text-stone-800",
};

export function StatusPill({ status }: { status: SyncStatus }) {
  return (
    <span className={cx("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide", STATUS[status])}>
      {status}
    </span>
  );
}

export function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <div className="rounded-md border border-line bg-card px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
      {note ? <p className="mt-1 text-xs text-muted">{note}</p> : null}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("rounded-md border border-line bg-card", className)}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-sm font-medium">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}
