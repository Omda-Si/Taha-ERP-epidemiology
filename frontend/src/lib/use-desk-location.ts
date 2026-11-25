"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useNav } from "@/lib/nav";

export function useDeskLocation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { path, search, instant } = useNav();

  const routerSearch = useMemo(() => {
    const q = searchParams.toString();
    return q ? `?${q}` : "";
  }, [searchParams]);

  if (path.startsWith("/desk") && (instant || path !== pathname)) {
    return { path, search };
  }
  if (pathname.startsWith("/desk")) {
    return { path: pathname, search: routerSearch };
  }
  return { path, search: search || routerSearch };
}