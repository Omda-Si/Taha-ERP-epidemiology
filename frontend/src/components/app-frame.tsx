"use client";

import { ClinicShell, HqShell } from "@/components/shell";
import { HomeView } from "@/components/views/home";
import { useNav } from "@/lib/nav";
import { usePathname } from "next/navigation";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const { path, instant } = useNav();
  const pathname = usePathname();

  if (path === "/") return <HomeView />;

  if (instant && path.startsWith("/clinic")) {
    return pathname.startsWith("/clinic") ? children : <ClinicShell />;
  }
  if (instant && path.startsWith("/hq")) {
    return pathname.startsWith("/hq") ? children : <HqShell />;
  }

  if (!instant) return children;
  return children;
}
