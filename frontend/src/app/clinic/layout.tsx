import type { Metadata } from "next";
import { Suspense } from "react";
import { ClinicShell } from "@/components/shell";

export const metadata: Metadata = { title: "Clinic" };

export default function ClinicLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted">Opening the clinic…</p>}>
      <ClinicShell>{children}</ClinicShell>
    </Suspense>
  );
}
