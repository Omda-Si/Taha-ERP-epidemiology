import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DeskFallback } from "@/components/desk-fallback";
import { DeskTab } from "@/components/desk-tab-page";

const TABS = new Set(["diagnose", "sync", "signals"]);

export function generateStaticParams() {
  return [{ tab: "diagnose" }, { tab: "sync" }, { tab: "signals" }];
}

export default async function DeskTabPage({ params }: { params: Promise<{ tab: string }> }) {
  const { tab } = await params;
  if (!TABS.has(tab)) notFound();
  return (
    <Suspense fallback={<DeskFallback />}>
      <DeskTab tab={tab} />
    </Suspense>
  );
}