"use client";

import dynamic from "next/dynamic";
import { ClinicShell } from "@/components/shell";
import { HqShellFallback } from "@/components/hq-shell-fallback";
import { HomeView } from "@/components/views/home";
import { useNav } from "@/lib/nav";
import { usePathname } from "next/navigation";

const HqShell = dynamic(() => import("@/components/hq-shell").then((m) => m.HqShell), {
  loading: () => <HqShellFallback />,
});

export function AppFrame({ children }: { children: React.ReactNode }) {
  const { path, instant } = useNav();
  const pathname = usePathname();

  let view: React.ReactNode;

  if (path === "/") {
    view = <HomeView />;
  } else if (instant && path.startsWith("/clinic")) {
    view = pathname.startsWith("/clinic") ? children : <ClinicShell />;
  } else if (instant && path.startsWith("/hq")) {
    view = pathname.startsWith("/hq") ? children : <HqShell />;
  } else {
    view = children;
  }

  return (
    <div className="h-dvh min-h-dvh overflow-hidden supports-[height:100dvh]:h-[100dvh] supports-[height:100dvh]:min-h-[100dvh]">
      {view}
    </div>
  );
}