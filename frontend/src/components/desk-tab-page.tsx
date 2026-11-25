"use client";

import { useSearchParams } from "next/navigation";
import { DeskRouter } from "@/components/desk-router";

export function DeskTab({ tab }: { tab: string }) {
  const searchParams = useSearchParams();
  const q = searchParams.toString();
  const search = q ? `?${q}` : "";
  return <DeskRouter path={`/desk/${tab}`} search={search} />;
}