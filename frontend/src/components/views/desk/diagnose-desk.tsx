"use client";

import { Link } from "@/components/link";
import { useMemo, useState } from "react";
import { buildPayload, strippedRows } from "@/lib/anonymize";
import { ICD } from "@/lib/catalog";
import { useClinic } from "@/lib/clinic-store";
import { formatWhen, khartoumLocalToIso } from "@/lib/format";
import { DeskChrome } from "./desk-chrome";

const inputClass =
  "w-full rounded-lg border border-[#e8edf3] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none transition focus:border-clinic focus:ring-2 focus:ring-clinic/15";

export function DiagnoseDesk({ patient: preset }: { patient?: string | null } = {}) {
  const { state, recordDiagnosis } = useClinic();
  const [patientId, setPatientId] = useState(
    preset && state.patients.some((p) => p.id === preset) ? preset : (state.patients[0]?.id ?? ""),
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

  const chartEntries = useMemo(
    () =>
      [...state.diagnoses]
        .sort((a, b) => b.diagnosedAt.localeCompare(a.diagnosedAt))
        .slice(0, 6),
    [state.diagnoses],
  );

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
  const stripped = patient ? strippedRows(patient, notes, diagnosedIso) : [];
  const whitelistCount = preview ? Object.keys(preview).length : 0;

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
      setResult("Chart saved. Facility sync is disabled.");
      return;
    }
    if (!state.facility.online) {
      setResult("Chart saved. Payload queued while offline.");
      return;
    }
    setResult("Chart saved. Anonymized row handed to the worker.");
    setNotes("");
  }

  return (
    <DeskChrome
      active="/desk/diagnose"
      kicker="Facility chart"
      title="Record diagnosis"
      lede="Two writes: the full note stays in the clinic database. Only the ten-field epidemiology contract can leave the building."
      actions={
        <span className="rounded-lg border border-[#e8edf3] bg-white px-3 py-1.5 text-xs text-[#64748b]">
          {whitelistCount} whitelist fields on save
        </span>
      }
    >
      <ol className="mb-6 grid gap-2 sm:grid-cols-3">
        {["Save clinical note locally", "Strip identifiers at the edge", "Enqueue anonymized payload"].map((step, i) => (
          <li key={step} className="flex items-center gap-2 rounded-xl border border-[#e8edf3] bg-white px-3 py-2.5 text-xs text-[#64748b] shadow-sm">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e8f0ff] text-[11px] font-semibold text-clinic">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={onSubmit} className="rounded-xl border border-[#e8edf3] bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold text-[#0f172a]">New consultation entry</h2>
          <FormGrid className="mt-4">
            <label className="block sm:col-span-2">
              <FieldLabel>Patient on chart</FieldLabel>
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className={`${inputClass} mt-1.5`}>
                {state.patients.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name} · {row.city}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <FieldLabel>Physician</FieldLabel>
              <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={`${inputClass} mt-1.5`}>
                {state.doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <FieldLabel>Diagnosed at</FieldLabel>
              <input type="datetime-local" value={diagnosedAt} onChange={(e) => setDiagnosedAt(e.target.value)} required className={`${inputClass} mt-1.5`} />
            </label>
            <label className="sm:col-span-2">
              <FieldLabel>Search ICD</FieldLabel>
              <input value={codeQuery} onChange={(e) => setCodeQuery(e.target.value)} placeholder="Code or disease name" className={`${inputClass} mt-1.5`} />
            </label>
            <label className="sm:col-span-2">
              <FieldLabel>Diagnosis</FieldLabel>
              <select value={code} onChange={(e) => setCode(e.target.value)} className={`${inputClass} mt-1.5`}>
                {matches.map((row) => (
                  <option key={row.code} value={row.code}>
                    {row.code} · {row.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-2">
              <FieldLabel>Clinical note — never transmitted</FieldLabel>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className={`${inputClass} mt-1.5`} placeholder="Exam, plan, names allowed here only." />
            </label>
          </FormGrid>
          <button
            type="submit"
            disabled={!patient}
            className="mt-5 rounded-lg bg-clinic px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(0,86,255,0.28)] hover:bg-clinic-deep disabled:opacity-40"
          >
            Save to chart
          </button>
          {result ? (
            <p className="mt-3 text-sm text-[#64748b]">
              {result}{" "}
              <Link href="/desk/sync" className="font-medium text-clinic hover:underline">
                Open sync queue →
              </Link>
            </p>
          ) : null}
        </form>

        <div className="space-y-4">
          <section className="rounded-xl border border-clinic/20 bg-[#e8f0ff]/40 p-4">
            <h2 className="text-sm font-semibold text-clinic-deep">Leaves the facility</h2>
            <dl className="mt-3 max-h-40 space-y-1.5 overflow-y-auto text-sm">
              {preview
                ? Object.entries(preview).map(([key, val]) => (
                    <div key={key} className="flex justify-between gap-2 border-b border-[#d5e3f7]/60 py-1.5 last:border-0">
                      <dt className="font-mono text-[10px] text-[#64748b]">{key}</dt>
                      <dd className="text-right text-[#0f172a]">{String(val)}</dd>
                    </div>
                  ))
                : (
                  <p className="text-xs text-[#64748b]">Pick a patient to preview the contract.</p>
                )}
            </dl>
          </section>
          <section className="rounded-xl border border-clay/25 bg-[#fff1f2]/50 p-4">
            <h2 className="text-sm font-semibold text-clay">Blocked at the edge</h2>
            <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto text-sm text-[#64748b]">
              {stripped.map((row) => (
                <li key={row.field}>
                  <span className="font-mono text-[10px] line-through">{row.field}</span>
                  <p className="text-xs text-[#0f172a]/80">{row.reason}</p>
                </li>
              ))}
              {stripped.length === 0 ? <li className="text-xs">No patient selected.</li> : null}
            </ul>
          </section>
          <section className="rounded-xl border border-[#e8edf3] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[#0f172a]">Recent chart entries (this facility)</h2>
            <ul className="mt-3 space-y-2">
              {chartEntries.map((dx) => {
                const person = state.patients.find((p) => p.id === dx.patientId);
                return (
                  <li key={dx.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#eef2f6] px-3 py-2 text-xs">
                    <span className="font-medium text-[#0f172a]">{person?.name ?? "—"}</span>
                    <span className="text-[#64748b]">
                      {dx.diagnosisCode} · {formatWhen(dx.diagnosedAt)}
                    </span>
                  </li>
                );
              })}
              {chartEntries.length === 0 ? <li className="text-xs text-[#94a3b8]">No diagnoses yet today.</li> : null}
            </ul>
          </section>
        </div>
      </div>
    </DeskChrome>
  );
}

function FormGrid({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={`grid gap-4 sm:grid-cols-2 ${className ?? ""}`}>{children}</div>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">{children}</span>;
}