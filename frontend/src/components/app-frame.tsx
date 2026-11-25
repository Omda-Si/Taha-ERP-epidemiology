"use client";

import { ClinicShell, HqShell } from "@/components/shell";
import { HomeView } from "@/components/views/home";
import { useNav } from "@/lib/nav";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const { path, instant } = useNav();
  if (!instant) return children;
  if (path === "/") return <HomeView />;
  if (path.startsWith("/clinic")) return <ClinicShell />;
  if (path.startsWith("/hq")) return <HqShell />;
  return children;
}
