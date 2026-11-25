"use client";

import { Link } from "@/components/link";
import { useMemo, useState } from "react";
import { ageInYears, toBracket } from "@/lib/anonymize";
import { useClinic } from "@/lib/clinic-store";
import { PageHeader, inputClass } from "@/components/ui";

export function PatientsView() {
  const { state } = useClinic();
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...state.patients]
      .filter((patient) => {
        if (!q) return true;
        return [patient.name, patient.phone, patient.nationalId, patient.city, patient.occupation]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [query, state.patients]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Local registry"
        title="Patients"
        lede="Names, phones, and national IDs stay on this workstation. Search does not call headquarters."
        actions={
          <Link href="/clinic/patients/new" className="rounded-md bg-clinic px-3 py-2 text-sm font-medium text-white hover:bg-clinic-deep">
            Register patient
          </Link>
        }
      />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Name, phone, national ID, city"
        className={inputClass}
        aria-label="Search patients"
      />
      <div className="overflow-x-auto rounded-md border border-line bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">Age</th>
              <th className="px-4 py-3 font-medium">Occupation</th>
              <th className="px-4 py-3 font-medium">Place</th>
              <th className="px-4 py-3 font-medium">National ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((patient) => {
              const age = ageInYears(patient.dob, "2026-11-25T12:00:00+02:00");
              return (
                <tr key={patient.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/clinic/patients/${patient.id}`} className="font-medium hover:underline">
                      {patient.name}
                    </Link>
                    <p className="text-xs text-muted">{patient.phone}</p>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {age}
                    <span className="ml-2 text-xs text-muted">{toBracket(age)}</span>
                  </td>
                  <td className="px-4 py-3">{patient.occupation}</td>
                  <td className="px-4 py-3">
                    {patient.district}, {patient.city}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{patient.nationalId}</td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-muted">
                  No patient matches that search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
