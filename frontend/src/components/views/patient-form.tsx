"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GEO, OCCUPATIONS } from "@/lib/catalog";
import { useClinic } from "@/lib/clinic-store";
import { Button, Field, PageHeader, inputClass } from "@/components/ui";

export function PatientForm() {
  const { state, registerPatient } = useClinic();
  const router = useRouter();
  const [region, setRegion] = useState(GEO[0].region);
  const regionRow = GEO.find((row) => row.region === region) ?? GEO[0];
  const [city, setCity] = useState(regionRow.cities[0].name);
  const cityRow = regionRow.cities.find((row) => row.name === city) ?? regionRow.cities[0];
  const [district, setDistrict] = useState(cityRow.districts[0]);
  const [occupation, setOccupation] = useState(OCCUPATIONS[0]);
  const [otherJob, setOtherJob] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onRegion(next: string) {
    const geo = GEO.find((row) => row.region === next) ?? GEO[0];
    setRegion(geo.region);
    setCity(geo.cities[0].name);
    setDistrict(geo.cities[0].districts[0]);
  }

  function onCity(next: string) {
    const found = regionRow.cities.find((row) => row.name === next) ?? regionRow.cities[0];
    setCity(found.name);
    setDistrict(found.districts[0]);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nationalId = String(form.get("nationalId") ?? "").trim();
    const name = String(form.get("name") ?? "").trim();
    if (state.patients.some((patient) => patient.nationalId.toLowerCase() === nationalId.toLowerCase())) {
      setError("That national ID is already on this workstation.");
      return;
    }
    const job = occupation === "Other" ? otherJob.trim() : occupation;
    if (!job) {
      setError("Occupation is required. Headquarters receives the category, not the name.");
      return;
    }
    const patient = registerPatient({
      name,
      phone: String(form.get("phone") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      nationalId,
      street: String(form.get("street") ?? "").trim(),
      dob: String(form.get("dob") ?? ""),
      occupation: job,
      city,
      district,
      region,
    });
    router.push(`/clinic/patients/${patient.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <PageHeader
        kicker="Registration"
        title="New patient"
        lede="Every field below is stored only in the clinic. A later diagnosis will forward age bracket, occupation, and place — not this form."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name">
          <input name="name" required className={inputClass} autoComplete="name" />
        </Field>
        <Field label="National ID">
          <input name="nationalId" required className={inputClass} placeholder="SD-000000000" />
        </Field>
        <Field label="Phone">
          <input name="phone" required className={inputClass} placeholder="+249 …" />
        </Field>
        <Field label="Email">
          <input name="email" type="email" className={inputClass} />
        </Field>
        <Field label="Date of birth" hint="Exact date stays local. The queue stores a bracket.">
          <input name="dob" type="date" required className={inputClass} max="2026-11-25" />
        </Field>
        <Field label="Occupation">
          <select
            value={occupation}
            onChange={(event) => setOccupation(event.target.value)}
            className={inputClass}
          >
            {OCCUPATIONS.map((job) => (
              <option key={job}>{job}</option>
            ))}
            <option>Other</option>
          </select>
        </Field>
        {occupation === "Other" ? (
          <Field label="Occupation, as recorded">
            <input value={otherJob} onChange={(event) => setOtherJob(event.target.value)} className={inputClass} />
          </Field>
        ) : null}
        <Field label="Region">
          <select value={region} onChange={(event) => onRegion(event.target.value)} className={inputClass}>
            {GEO.map((row) => (
              <option key={row.region}>{row.region}</option>
            ))}
          </select>
        </Field>
        <Field label="City">
          <select value={city} onChange={(event) => onCity(event.target.value)} className={inputClass}>
            {regionRow.cities.map((row) => (
              <option key={row.name}>{row.name}</option>
            ))}
          </select>
        </Field>
        <Field label="District">
          <select value={district} onChange={(event) => setDistrict(event.target.value)} className={inputClass}>
            {cityRow.districts.map((row) => (
              <option key={row}>{row}</option>
            ))}
          </select>
        </Field>
        <Field label="Street address" hint="Blocked from sync. House numbers never leave the facility.">
          <input name="street" className={inputClass} />
        </Field>
      </div>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <Button type="submit">Save registration</Button>
    </form>
  );
}
