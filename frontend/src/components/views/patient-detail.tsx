"use client";

import { Link } from "@/components/link";
import { useParams } from "next/navigation";
import { ageInYears, buildPayload, strippedRows, toBracket } from "@/lib/anonymize";
import { useClinic } from "@/lib/clinic-store";
import { formatDate, formatFee, formatWhen } from "@/lib/format";
import { PayloadPreview } from "@/components/payload-preview";
import { PageHeader, Panel, StatusPill, TextLink } from "@/components/ui";

export function PatientDetail({ id: idProp }: { id?: string }) {
  if (idProp !== undefined) return <PatientDetailBody id={idProp} />;
  return <PatientDetailFromRoute />;
}

function PatientDetailFromRoute() {
  const params = useParams<{ id: string }>();
  return <PatientDetailBody id={params.id} />;
}

function PatientDetailBody({ id }: { id: string }) {
  const { state } = useClinic();
  const patient = state.patients.find((row) => row.id === id);

  if (!patient) {
    return (
      <div className="space-y-3">
        <PageHeader kicker="Chart" title="Patient not on this workstation" />
        <TextLink href="/clinic/patients">Back to the registry</TextLink>
      </div>
    );
  }

  const age = ageInYears(patient.dob, "2026-11-25T12:00:00+02:00");
  const appointments = state.appointments
    .filter((row) => row.patientId === patient.id)
    .sort((a, b) => b.schedule.localeCompare(a.schedule));
  const diagnoses = state.diagnoses
    .filter((row) => row.patientId === patient.id)
    .sort((a, b) => b.diagnosedAt.localeCompare(a.diagnosedAt));
  const preview = buildPayload({
    eventId: "evt_preview",
    facilityCode: state.facility.facilityCode,
    patient,
    diagnosisCode: "—",
    diagnosisName: "Not recorded yet",
    diagnosedAt: "2026-11-25T10:00:00.000Z",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Local chart"
        title={patient.name}
        lede={`${patient.district}, ${patient.city} · ${patient.occupation} · ${age} years (${toBracket(age)})`}
        actions={
          <Link
            href={`/clinic/diagnose?patient=${patient.id}`}
            className="rounded-md bg-clinic px-3 py-2 text-sm font-medium text-white hover:bg-clinic-deep"
          >
            Record diagnosis
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Identifiers — facility only">
          <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
            <dt className="text-muted">Phone</dt>
            <dd>{patient.phone}</dd>
            <dt className="text-muted">Email</dt>
            <dd>{patient.email || "—"}</dd>
            <dt className="text-muted">National ID</dt>
            <dd className="font-mono text-xs">{patient.nationalId}</dd>
            <dt className="text-muted">Street</dt>
            <dd>{patient.street || "—"}</dd>
            <dt className="text-muted">Born</dt>
            <dd>{formatDate(patient.dob + "T00:00:00Z")}</dd>
            <dt className="text-muted">Chart id</dt>
            <dd className="font-mono text-xs">{patient.id}</dd>
          </dl>
        </Panel>
        <Panel title="Appointments">
          {appointments.length === 0 ? <p className="text-sm text-muted">No visits booked.</p> : null}
          <ul className="space-y-3">
            {appointments.map((row) => {
              const doctor = state.doctors.find((item) => item.id === row.doctorId);
              return (
                <li key={row.id} className="text-sm">
                  <p className="font-medium">{row.reason}</p>
                  <p className="text-muted">
                    {formatWhen(row.schedule)} · {doctor?.name} · {row.state.replace("_", " ")} · {formatFee(row.fee)}
                  </p>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
      <Panel title="Diagnoses on this chart">
        {diagnoses.length === 0 ? <p className="text-sm text-muted">No diagnosis recorded.</p> : null}
        <ul className="divide-y divide-line">
          {diagnoses.map((row) => {
            const queued = state.queue.find((item) => item.diagnosisId === row.id);
            return (
              <li key={row.id} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">
                    {row.diagnosisCode} · {row.diagnosisName}
                  </p>
                  <p className="mt-1 max-w-xl text-sm text-muted">{row.clinicalNotes}</p>
                  <p className="mt-1 text-xs text-muted">{formatWhen(row.diagnosedAt)}</p>
                </div>
                {queued ? <StatusPill status={queued.status} /> : <span className="text-xs text-muted">not queued</span>}
              </li>
            );
          })}
        </ul>
      </Panel>
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight">If a diagnosis were saved now</h2>
        <PayloadPreview payload={preview} stripped={strippedRows(patient, "", "2026-11-25T10:00:00.000Z")} />
      </div>
    </div>
  );
}
