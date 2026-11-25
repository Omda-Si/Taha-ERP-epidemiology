"use client";

import { useEffect } from "react";
import { DeskRouter } from "@/components/desk-router";
import { DeskShellNav } from "@/components/views/desk/desk-chrome";
import { prefetchAllDeskPages } from "@/lib/prefetch-route";
import { useDeskLocation } from "@/lib/use-desk-location";

export function DeskShell() {
  const { path, search } = useDeskLocation();

  useEffect(() => {
    prefetchAllDeskPages();
  }, []);

  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f8fafc] text-[#0f172a]">
      <DeskShellNav active={path} />
      <div className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col px-4 sm:px-6 lg:px-8">
        <DeskRouter path={path} search={search} />
      </div>
    </main>
  );
}