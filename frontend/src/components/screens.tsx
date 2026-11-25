"use client";

import { AppointmentsView } from "@/components/views/appointments";
import { ClinicBoard } from "@/components/views/clinic-board";
import { DiagnoseForm } from "@/components/views/diagnose-form";
import { PatientDetail } from "@/components/views/patient-detail";
import { PatientForm } from "@/components/views/patient-form";
import { PatientsView } from "@/components/views/patients";
import { SettingsView } from "@/components/views/settings";
import { SyncQueue } from "@/components/views/sync-queue";
import { HqDemographics } from "@/components/views/hq-demographics";
import { HqDiseases } from "@/components/views/hq-diseases";
import { HqEvents } from "@/components/views/hq-events";
import { HqFacilities } from "@/components/views/hq-facilities";
import { HqGeography } from "@/components/views/hq-geography";
import { HqOverview } from "@/components/views/hq-overview";

function queryValue(search: string, key: string) {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(raw).get(key);
}

export function ClinicScreen({ path, search }: { path: string; search: string }) {
  if (path === "/clinic") return <ClinicBoard />;
  if (path === "/clinic/patients") return <PatientsView />;
  if (path === "/clinic/patients/new") return <PatientForm />;
  if (path.startsWith("/clinic/patients/")) {
    const id = decodeURIComponent(path.slice("/clinic/patients/".length));
    return <PatientDetail key={id} id={id} />;
  }
  if (path === "/clinic/appointments") return <AppointmentsView />;
  if (path === "/clinic/diagnose") return <DiagnoseForm key={search} patient={queryValue(search, "patient")} />;
  if (path === "/clinic/sync") return <SyncQueue />;
  if (path === "/clinic/settings") return <SettingsView />;
  return null;
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
