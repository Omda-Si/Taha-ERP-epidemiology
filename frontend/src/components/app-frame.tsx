"use client";

import { HomeView } from "@/components/views/home";
import { useNav } from "@/lib/nav";

export function AppFrame({ children }: { children: React.ReactNode }) {
  const { path, instant } = useNav();
  if (!instant) return children;
  if (path === "/") return <HomeView />;
  /** Keep layout-mounted ClinicShell/HqShell — only swap the inner view via useNav(). */
  return children;
}
