import { WHITELIST } from "./catalog";
import type { AgeBracket, EpidemiologyPayload, Patient } from "./types";

export function ageInYears(dob: string, atIso: string) {
  const birth = new Date(dob + "T00:00:00Z");
  const at = new Date(atIso);
  let age = at.getUTCFullYear() - birth.getUTCFullYear();
  const month = at.getUTCMonth() - birth.getUTCMonth();
  if (month < 0 || (month === 0 && at.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age;
}

export function toBracket(age: number): AgeBracket {
  if (age < 5) return "0-4";
  if (age < 15) return "5-14";
  if (age < 25) return "15-24";
  if (age < 35) return "25-34";
  if (age < 45) return "35-44";
  if (age < 55) return "45-54";
  if (age < 65) return "55-64";
  return "65+";
}

export function assertWhitelist(payload: EpidemiologyPayload) {
  const allowed = new Set<string>(WHITELIST);
  for (const key of Object.keys(payload)) {
    if (!allowed.has(key)) {
      throw new Error(`payload key not on whitelist: ${key}`);
    }
  }
}

export function buildPayload(input: {
  eventId: string;
  facilityCode: string;
  patient: Pick<Patient, "dob" | "occupation" | "city" | "district" | "region">;
  diagnosisCode: string;
  diagnosisName: string;
  diagnosedAt: string;
}): EpidemiologyPayload {
  const payload: EpidemiologyPayload = {
    event_id: input.eventId,
    facility_code: input.facilityCode,
    diagnosis_code: input.diagnosisCode,
    diagnosis_name: input.diagnosisName,
    age_bracket: toBracket(ageInYears(input.patient.dob, input.diagnosedAt)),
    occupation: input.patient.occupation,
    city: input.patient.city,
    district: input.patient.district,
    region: input.patient.region,
    diagnosed_at: input.diagnosedAt,
  };
  assertWhitelist(payload);
  return payload;
}

export function strippedRows(patient: Patient, notes: string, diagnosedAt: string) {
  return [
    { field: "name", value: patient.name, reason: "Direct identifier" },
    { field: "phone", value: patient.phone || "—", reason: "Contact" },
    { field: "email", value: patient.email || "—", reason: "Contact" },
    { field: "national_id", value: patient.nationalId, reason: "Government ID" },
    { field: "street", value: patient.street || "—", reason: "Exact address" },
    { field: "dob", value: patient.dob, reason: "Re-identifying. Bracket is sent instead" },
    {
      field: "exact_age",
      value: `${ageInYears(patient.dob, diagnosedAt)} years`,
      reason: "Free-text age can re-identify",
    },
    { field: "patient_id", value: patient.id, reason: "System identifier" },
    { field: "clinical_notes", value: notes.trim() || "—", reason: "Free text can re-identify" },
  ];
}
