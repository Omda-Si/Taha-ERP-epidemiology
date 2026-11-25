"use client";

import { DiagnoseDesk } from "@/components/views/desk/diagnose-desk";
import { SignalsDesk } from "@/components/views/desk/signals-desk";
import { SyncDesk } from "@/components/views/desk/sync-desk";

function queryValue(search: string, key: string) {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(raw).get(key);
}

export function DeskRouter({ path, search }: { path: string; search: string }) {
  if (path === "/desk/diagnose") return <DiagnoseDesk patient={queryValue(search, "patient")} />;
  if (path === "/desk/sync") return <SyncDesk />;
  if (path === "/desk/signals") return <SignalsDesk code={queryValue(search, "code")} />;
  return null;
}