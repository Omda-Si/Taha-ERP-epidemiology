"use client";

import { Suspense } from "react";
import { ClinicProvider } from "@/lib/clinic-store";
import { NavProvider } from "@/lib/nav";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClinicProvider>
      <Suspense fallback={null}>
        <NavProvider>{children}</NavProvider>
      </Suspense>
    </ClinicProvider>
  );
}
