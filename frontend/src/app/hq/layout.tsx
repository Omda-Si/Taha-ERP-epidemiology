import type { Metadata } from "next";
import { Suspense } from "react";
import { HqShell } from "@/components/shell";

export const metadata: Metadata = { title: "HQ analytics" };

export default function HqLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted">Opening headquarters…</p>}>
      <HqShell>{children}</HqShell>
    </Suspense>
  );
}
