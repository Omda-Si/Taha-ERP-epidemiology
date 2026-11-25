"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type Loc = { path: string; search: string };

type NavApi = Loc & {
  instant: boolean;
  push: (href: string) => void;
};

const Ctx = createContext<NavApi | null>(null);

function parseHref(href: string): Loc {
  const url = new URL(href, "http://local");
  return { path: url.pathname, search: url.search };
}

export function NavProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const [override, setOverride] = useState<Loc | null>(null);

  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      setOverride(path === pathnameRef.current ? null : { path, search });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const push = useCallback((href: string) => {
    const next = parseHref(href);
    const target = `${next.path}${next.search}`;
    if (`${window.location.pathname}${window.location.search}` === target) return;
    window.history.pushState(null, "", target);
    window.scrollTo(0, 0);
    setOverride(next.path === pathnameRef.current && next.search === "" ? null : next);
  }, []);

  const api = useMemo<NavApi>(
    () => ({
      path: override?.path ?? pathname,
      search: override?.search ?? "",
      instant: override !== null,
      push,
    }),
    [override, pathname, push],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useNav() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNav must be used inside NavProvider");
  return ctx;
}
