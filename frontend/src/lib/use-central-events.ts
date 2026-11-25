"use client";

import { useMemo } from "react";
import { facilityByCode } from "./catalog";
import { useClinic } from "./clinic-store";
import { SEED_EVENT_IDS, SEED_EVENTS } from "./seed";
import type { CentralEvent } from "./types";

export function useCentralEvents() {
  const { state } = useClinic();

  return useMemo(() => {
    const extra: CentralEvent[] = state.queue
      .filter((row) => row.status === "synced" && !SEED_EVENT_IDS.has(row.eventId))
      .map((row) => ({
        ...row.payload,
        facility_name: facilityByCode(row.payload.facility_code)?.name ?? state.facility.name,
        received_at: row.syncedAt ?? row.createdAt,
      }));
    return extra.length ? [...extra, ...SEED_EVENTS] : SEED_EVENTS;
  }, [state.facility.name, state.queue]);
}
