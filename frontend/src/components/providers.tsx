"use client";

import { ClinicProvider } from "@/lib/clinic-store";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ClinicProvider>{children}</ClinicProvider>;
}
