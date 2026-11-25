"use client";

import { useNav } from "@/lib/nav";

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
      onClick={(event) => {
        if (event.defaultPrevented) return;
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (!href.startsWith("/")) return;
        event.preventDefault();
        onClick?.();
        push(href);
      }}
    >
      {children}
    </a>
  );
}
