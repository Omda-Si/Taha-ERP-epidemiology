"use client";

import { useNav } from "@/lib/nav";

export function Link({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { push } = useNav();
  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        if (event.defaultPrevented) return;
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (!href.startsWith("/")) return;
        event.preventDefault();
        push(href);
      }}
    >
      {children}
    </a>
  );
}
