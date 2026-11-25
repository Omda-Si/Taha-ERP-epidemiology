import type { Metadata } from "next";
import { Suspense } from "react";
import { DeskShell } from "@/components/desk-shell";

export const metadata: Metadata = { title: "TEEDSS desk" };

export default function DeskLayout() {
  return (
    <Suspense fallback={null}>
      <DeskShell />
    </Suspense>
  );
}