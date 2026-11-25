"use client";

import { useNav } from "@/lib/nav";
import { prefetchRoute } from "@/lib/prefetch-route";

export function Link({
  href,
  className,
  children,
  title,
  "aria-label": ariaLabel,
  onClick,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  title?: string;
  "aria-label"?: string;
  onClick?: () => void;
}) {
  const { push } = useNav();
  return (
    <a
      href={href}
      className={className}
      title={title}
      aria-label={ariaLabel}
      onMouseEnter={() => {
        if (href.startsWith("/")) prefetchRoute(href);
      }}
      onFocus={() => {
        if (href.startsWith("/")) prefetchRoute(href);
      }}
      onClick={(event) => {
        if (event.defaultPrevented) return;
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (!href.startsWith("/")) return;
        event.preventDefault();
        prefetchRoute(href);
        onClick?.();
        push(href);
      }}
    >
      {children}
    </a>
  );
}
