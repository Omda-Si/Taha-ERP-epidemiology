"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, startTransition } from "react";

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

function searchFromParams(params: ReturnType<typeof useSearchParams>) {
  const q = params.toString();
  return q ? `?${q}` : "";
}

export function NavProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const routerSearch = useMemo(() => searchFromParams(searchParams), [searchParams]);
  const [override, setOverride] = useState<Loc | null>(null);

  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      if (path === pathnameRef.current && search === routerSearch) setOverride(null);
      else setOverride({ path, search });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [routerSearch]);

  useEffect(() => {
    setOverride(null);
  }, [pathname]);

  const push = useCallback((href: string) => {
    const next = parseHref(href);
    const target = `${next.path}${next.search}`;
    if (`${window.location.pathname}${window.location.search}` === target) return;
    window.history.pushState(null, "", target);
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    startTransition(() => setOverride(next));
  }, []);

  const api = useMemo<NavApi>(
    () => ({
      path: override?.path ?? pathname,
      search: override?.search ?? routerSearch,
      instant: override !== null,
      push,
    }),
    [override, pathname, routerSearch, push],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useNav() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNav must be used inside NavProvider");
  return ctx;
}
