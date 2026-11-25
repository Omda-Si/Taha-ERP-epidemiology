"use client";

import { ClinicProvider } from "@/lib/clinic-store";
import { NavProvider } from "@/lib/nav";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClinicProvider>
      <NavProvider>{children}</NavProvider>
    </ClinicProvider>
  );
}
