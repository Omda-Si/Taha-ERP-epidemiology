"use client";

import dynamic from "next/dynamic";
import { HqOverview } from "@/components/views/hq-overview";

const HqDiseases = dynamic(() => import("@/components/views/hq-diseases").then((m) => ({ default: m.HqDiseases })), { loading: () => null });
const HqGeography = dynamic(() => import("@/components/views/hq-geography").then((m) => ({ default: m.HqGeography })), { loading: () => null });
const HqDemographics = dynamic(() => import("@/components/views/hq-demographics").then((m) => ({ default: m.HqDemographics })), { loading: () => null });
const HqFacilities = dynamic(() => import("@/components/views/hq-facilities").then((m) => ({ default: m.HqFacilities })), { loading: () => null });
const HqEvents = dynamic(() => import("@/components/views/hq-events").then((m) => ({ default: m.HqEvents })), { loading: () => null });

function queryValue(search: string, key: string) {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(raw).get(key);
}

export function HqScreen({ path, search }: { path: string; search: string }) {
  if (path === "/hq") return <HqOverview />;
  if (path === "/hq/diseases") return <HqDiseases key={search || "all"} code={queryValue(search, "code")} />;
  if (path === "/hq/geography") return <HqGeography />;
  if (path === "/hq/demographics") return <HqDemographics />;
  if (path === "/hq/facilities") return <HqFacilities />;
  if (path === "/hq/events") return <HqEvents />;
  return null;
}