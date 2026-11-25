"use client";

import { Logo } from "@/components/logo";

export function DeskFallback() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f8fafc]">
      <header className="shrink-0 border-b border-[#e8edf3] bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Logo compact />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-7 w-20 animate-pulse rounded-lg bg-[#e8edf3]" />
            ))}
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 space-y-3 px-4 py-6 sm:px-6">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-[#e8edf3]" />
        <div className="h-4 w-full max-w-md animate-pulse rounded bg-[#eef2f6]" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="h-40 animate-pulse rounded-xl bg-white shadow-sm" />
          <div className="h-40 animate-pulse rounded-xl bg-white shadow-sm" />
        </div>
      </div>
    </div>
  );
}