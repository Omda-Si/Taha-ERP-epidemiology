"use client";

import Link from "next/link";
import { useState } from "react";
import { useClinic } from "@/lib/clinic-store";
import type { AppointmentState } from "@/lib/types";
import { formatFee, formatWhen, khartoumDate, khartoumLocalToIso } from "@/lib/format";
import { Button, Field, PageHeader, inputClass } from "@/components/ui";

const FILTERS: Array<AppointmentState | "all"> = ["all", "scheduled", "checked_in", "completed", "cancelled"];

export function AppointmentsView() {
  const { state, bookAppointment, setAppointmentState } = useClinic();
  const [filter, setFilter] = useState<AppointmentState | "all">("all");
  const [patientId, setPatientId] = useState(state.patients[0]?.id ?? "");
  const [doctorId, setDoctorId] = useState(state.doctors[0]?.id ?? "");
  const [notice, setNotice] = useState<string | null>(null);

  const rows = [...state.appointments]
    .filter((row) => filter === "all" || row.state === filter)
    .sort((a, b) => a.schedule.localeCompare(b.schedule));

  function onBook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const schedule = String(form.get("schedule") ?? "");
    bookAppointment({
      patientId,
      doctorId,
      schedule: khartoumLocalToIso(schedule),
      fee: Number(form.get("fee") ?? 0),
      reason: String(form.get("reason") ?? "").trim(),
    });
    setNotice("Booked on this workstation. Appointments are not part of the epidemiology payload.");
    event.currentTarget.reset();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Facility operations"
        title="Appointments"
        lede="Check-in does not sync. The anonymizer runs only when a physician saves a diagnosis."
      />
      <form onSubmit={onBook} className="grid gap-4 rounded-md border border-line bg-card p-4 md:grid-cols-2">
        <Field label="Patient">
          <select value={patientId} onChange={(event) => setPatientId(event.target.value)} className={inputClass}>
            {state.patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Doctor">
          <select value={doctorId} onChange={(event) => setDoctorId(event.target.value)} className={inputClass}>
            {state.doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name} · {doctor.specialty}
              </option>
            ))}
          </select>
        </Field>
        <Field label="When">
          <input name="schedule" type="datetime-local" required defaultValue="2026-11-25T12:00" className={inputClass} />
        </Field>
        <Field label="Fee (SDG)" hint="Billing stays local.">
          <input name="fee" type="number" min={0} step={500} defaultValue={8000} required className={inputClass} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Reason">
            <input name="reason" required className={inputClass} placeholder="Fever, follow-up, vaccination…" />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Button type="submit">Book appointment</Button>
        </div>
      </form>
      {notice ? <p className="text-sm text-clinic">{notice}</p> : null}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={
              filter === item
                ? "rounded-full bg-ink px-3 py-1 text-xs text-paper"
                : "rounded-full border border-line px-3 py-1 text-xs text-muted"
            }
          >
            {item.replace("_", " ")}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-md border border-line bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">Clinician</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Fee</th>
              <th className="px-4 py-3 font-medium">State</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const person = state.patients.find((patient) => patient.id === row.patientId);
              const doctor = state.doctors.find((item) => item.id === row.doctorId);
              return (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatWhen(row.schedule)}
                    <p className="text-xs text-muted">{khartoumDate(row.schedule)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/clinic/patients/${row.patientId}`} className="hover:underline">
                      {person?.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{doctor?.name}</td>
                  <td className="px-4 py-3">{row.reason}</td>
                  <td className="px-4 py-3 tabular-nums">{formatFee(row.fee)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.state === "scheduled" ? (
                        <Button variant="ghost" onClick={() => setAppointmentState(row.id, "checked_in")}>
                          Check in
                        </Button>
                      ) : null}
                      {row.state === "checked_in" ? (
                        <Button variant="ghost" onClick={() => setAppointmentState(row.id, "completed")}>
                          Complete
                        </Button>
                      ) : null}
                      {row.state === "scheduled" || row.state === "checked_in" ? (
                        <Button variant="ghost" onClick={() => setAppointmentState(row.id, "cancelled")}>
                          Cancel
                        </Button>
                      ) : null}
                      {row.state === "completed" || row.state === "cancelled" ? (
                        <span className="text-xs uppercase tracking-wide text-muted">{row.state}</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
