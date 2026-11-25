import { notFound } from "next/navigation";

const TABS = new Set(["diagnose", "sync", "signals"]);

export function generateStaticParams() {
  return [{ tab: "diagnose" }, { tab: "sync" }, { tab: "signals" }];
}

/** Route segment for URL + metadata only; UI lives in desk layout shell. */
export default async function DeskTabPage({ params }: { params: Promise<{ tab: string }> }) {
  const { tab } = await params;
  if (!TABS.has(tab)) notFound();
  return null;
}