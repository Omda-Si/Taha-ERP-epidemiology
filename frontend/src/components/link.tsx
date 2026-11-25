"use client";

import { usePathname, useRouter } from "next/navigation";
import { useNav } from "@/lib/nav";
import { prefetchRoute } from "@/lib/prefetch-route";

function deskPath(pathname: string) {
  return pathname === "/desk" || pathname.startsWith("/desk/");
}

function parseHref(href: string) {
  const url = new URL(href, "http://local");
  return { path: url.pathname, search: url.search };
}

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
  const router = useRouter();
  const pathname = usePathname();
  const { push } = useNav();

  const warm = () => {
    if (!href.startsWith("/")) return;
    prefetchRoute(href);
    router.prefetch(href);
  };

  return (
    <a
      href={href}
      className={className}
      title={title}
      aria-label={ariaLabel}
      onPointerEnter={warm}
      onFocus={warm}
      onClick={(event) => {
        if (event.defaultPrevented) return;
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (!href.startsWith("/")) return;
        event.preventDefault();
        warm();
        onClick?.();

        if (deskPath(parseHref(href).path)) {
          router.push(href, { scroll: false });
          return;
        }

        if (pathname === "/") {
          push(href);
          return;
        }

        router.push(href, { scroll: false });
      }}
    >
      {children}
    </a>
  );
}