"use client";

import { useId } from "react";
import { cx } from "@/lib/format";

export function Mark({ className }: { className?: string }) {
  const id = `genial-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 72 72" className={className} aria-hidden="true">
      <defs>
        <mask id={id}>
          <rect x="1" y="1" width="70" height="70" rx="24" fill="white" />
          <rect x="32.25" y="1" width="7.5" height="70" rx="3.75" fill="black" />
          <rect x="1" y="32.25" width="70" height="7.5" rx="3.75" fill="black" />
        </mask>
      </defs>
      <g mask={`url(#${id})`}>
        <rect width="36" height="36" fill="#0056ff" />
        <rect x="36" width="36" height="36" fill="#00dee3" />
        <rect y="36" width="36" height="36" fill="#1f3892" />
        <rect x="36" y="36" width="36" height="36" fill="#5db4ff" />
      </g>
    </svg>
  );
}

export function Logo({
  tone = "onLight",
  className,
  compact,
}: {
  tone?: "onLight" | "onNavy";
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cx("inline-flex min-w-0 items-center gap-2 sm:gap-2.5", className)}>
      <Mark className={cx("shrink-0", compact ? "h-8 w-8" : "h-9 w-9")} />
      <span className="min-w-0 leading-none">
        <span
          className={cx(
            "block font-bold tracking-tight",
            compact ? "text-[1rem]" : "text-[1.15rem]",
            tone === "onNavy" ? "text-white" : "text-clinic",
          )}
        >
          Taha Clinic
        </span>
        <span className={cx("mt-0.5 font-semibold text-sky", compact ? "hidden text-[0.62rem] sm:block" : "block text-[0.68rem]")}>
          Khartoum
        </span>
      </span>
    </span>
  );
}
