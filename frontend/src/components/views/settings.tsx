"use client";

import { useState } from "react";
import { useClinic } from "@/lib/clinic-store";
import { Button, Field, PageHeader, inputClass } from "@/components/ui";

export function SettingsView() {
  const { state, updateFacility, resetDemo } = useClinic();
  const facility = state.facility;
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Facility config"
        title="Settings"
        lede="Token and HMAC secret stay on the clinic. The ingest URL is pinned to the v1 contract. This demo does not send either secret."
      />
      <div className="grid max-w-2xl gap-4">
        <Field label="Facility name">
          <input
            value={facility.name}
            onChange={(event) => updateFacility({ name: event.target.value })}
            className={inputClass}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Facility code">
            <input
              value={facility.facilityCode}
              onChange={(event) => updateFacility({ facilityCode: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="City">
            <input
              value={facility.city}
              onChange={(event) => updateFacility({ city: event.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Region">
          <input
            value={facility.region}
            onChange={(event) => updateFacility({ region: event.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Ingest URL" hint="POST /api/v1/epidemiology/sync · Bearer token · X-Taha-Signature HMAC-SHA256 of the raw body.">
          <input
            value={facility.apiUrl}
            onChange={(event) => updateFacility({ apiUrl: event.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Bearer token">
          <input
            type="password"
            value={facility.token}
            onChange={(event) => updateFacility({ token: event.target.value })}
            className={inputClass}
            autoComplete="off"
          />
        </Field>
        <Field label="HMAC secret">
          <input
            type="password"
            value={facility.hmacSecret}
            onChange={(event) => updateFacility({ hmacSecret: event.target.value })}
            className={inputClass}
            autoComplete="off"
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={facility.syncEnabled ? "primary" : "ghost"}
            onClick={() => updateFacility({ syncEnabled: !facility.syncEnabled })}
          >
            {facility.syncEnabled ? "Sync enabled" : "Sync disabled"}
          </Button>
          <Button
            variant={facility.online ? "primary" : "danger"}
            onClick={() => updateFacility({ online: !facility.online })}
          >
            {facility.online ? "Link up" : "Simulate offline"}
          </Button>
        </div>
        <div className="border-t border-line pt-4">
          {confirm ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted">This clears local registrations, diagnoses, and the queue.</p>
              <Button variant="danger" onClick={resetDemo}>
                Reset demo data
              </Button>
              <Button variant="ghost" onClick={() => setConfirm(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setConfirm(true)}>
              Reset demo data
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
