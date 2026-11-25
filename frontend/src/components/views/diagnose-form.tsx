"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { buildPayload, strippedRows } from "@/lib/anonymize";
import { ICD } from "@/lib/catalog";
import { useClinic } from "@/lib/clinic-store";
import { khartoumLocalToIso } from "@/lib/format";
import { Button, Field, PageHeader, inputClass } from "@/components/ui";
import { PayloadPreview } from "@/components/payload-preview";

export function DiagnoseForm() {
  const params = useSearchParams();
  const { state, recordDiagnosis } = useClinic();
  const preset = params.get("patient");
  const [patientId, setPatientId] = useState(
    state.patients.some((patient) => patient.id === preset) ? preset! : (state.patients[0]?.id ?? ""),
  );
  const [doctorId, setDoctorId] = useState(state.doctors[0]?.id ?? "");
  const [codeQuery, setCodeQuery] = useState("");
  const [code, setCode] = useState(ICD[0].code);
  const [notes, setNotes] = useState("");
  const [diagnosedAt, setDiagnosedAt] = useState("2026-11-25T11:30");
  const [result, setResult] = useState<string | null>(null);

  const patient = state.patients.find((row) => row.id === patientId);
  const disease = ICD.find((row) => row.code === code) ?? ICD[0];
  const matches = useMemo(() => {
    const q = codeQuery.trim().toLowerCase();
    if (!q) return ICD;
    return ICD.filter((row) => `${row.code} ${row.name}`.toLowerCase().includes(q));
  }, [codeQuery]);

  const diagnosedIso = diagnosedAt ? khartoumLocalToIso(diagnosedAt) : "2026-11-25T09:30:00.000Z";
  const preview =
    patient &&
    buildPayload({
      eventId: "evt_preview",
      facilityCode: state.facility.facilityCode,
      patient,
      diagnosisCode: disease.code,
      diagnosisName: disease.name,
      diagnosedAt: diagnosedIso,
    });

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!patient) return;
    const saved = recordDiagnosis({
      patientId: patient.id,
      doctorId,
      diagnosisCode: disease.code,
      diagnosisName: disease.name,
      clinicalNotes: notes,
      diagnosedAt: diagnosedIso,
    });
    if (!saved.eventId) {
      setResult("Diagnosis stored on the chart. Sync is off, so nothing was queued.");
      return;
    }
    if (!state.facility.online) {
      setResult("Saved. The clinic is offline, so the anonymized row is pending until the worker can flush.");
      return;
    }
    setResult("Saved without waiting on the network. The worker is transmitting the whitelist payload.");
    setNotes("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Clinical record"
        title="Record a diagnosis"
        lede="The chart keeps the note. The queue gets the whitelist. Those are different writes, and the second one does not block the first."
      />
      <form onSubmit={onSubmit} className="grid gap-4 rounded-md border border-line bg-card p-4 md:grid-cols-2">
        <Field label="Patient">
          <select value={patientId} onChange={(event) => setPatientId(event.target.value)} className={inputClass}>
            {state.patients.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name} · {row.city}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Physician">
          <select value={doctorId} onChange={(event) => setDoctorId(event.target.value)} className={inputClass}>
            {state.doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} · {doctor.license}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Find a code">
          <input
            value={codeQuery}
            onChange={(event) => setCodeQuery(event.target.value)}
            placeholder="Malaria, A00, diabetes…"
            className={inputClass}
          />
        </Field>
        <Field label="Diagnosis">
          <select value={code} onChange={(event) => setCode(event.target.value)} className={inputClass}>
            {matches.map((row) => (
              <option key={row.code} value={row.code}>
                {row.code} · {row.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Diagnosed at">
          <input
            type="datetime-local"
            value={diagnosedAt}
            onChange={(event) => setDiagnosedAt(event.target.value)}
            required
            className={inputClass}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Clinical note" hint="Stored on the chart. Rejected by the anonymizer.">
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              className={inputClass}
              placeholder="History, exam, plan. Names in this box stay here."
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Button type="submit" disabled={!patient}>
            Save diagnosis
          </Button>
        </div>
      </form>
      {result ? (
        <p className="text-sm">
          {result}{" "}
          <Link href="/clinic/sync" className="font-medium text-clinic hover:underline">
            Open the queue
          </Link>
        </p>
      ) : null}
      {patient && preview ? (
        <PayloadPreview payload={preview} stripped={strippedRows(patient, notes, diagnosedIso)} />
      ) : null}
    </div>
  );
}
