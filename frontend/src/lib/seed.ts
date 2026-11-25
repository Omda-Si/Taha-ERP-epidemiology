import { buildPayload } from "./anonymize";
import {
  DEMO_DAY,
  FACILITIES,
  GEO,
  ICD,
  OCCUPATIONS,
  facilityByCode,
} from "./catalog";
import type {
  Appointment,
  CentralEvent,
  ClinicState,
  Diagnosis,
  Doctor,
  Patient,
  SyncItem,
  SyncStatus,
} from "./types";

export const DOCTORS: Doctor[] = [
  {
    id: "doc_leila",
    name: "Dr. Leila Nur",
    specialty: "Internal medicine",
    department: "Outpatient",
    license: "SMC-44120",
  },
  {
    id: "doc_hassan",
    name: "Dr. Hassan Idris",
    specialty: "Pediatrics",
    department: "Paediatrics",
    license: "SMC-33811",
  },
  {
    id: "doc_rania",
    name: "Dr. Rania Musa",
    specialty: "General practice",
    department: "Primary care",
    license: "SMC-50944",
  },
];

const PATIENTS: Patient[] = [
  {
    id: "pat_amal",
    name: "Amal Hassan",
    phone: "+249 91 220 1844",
    email: "amal.hassan@example.com",
    nationalId: "SD-194827361",
    street: "House 14, Street 23, Al Amarat",
    dob: "1988-04-12",
    occupation: "Teacher",
    city: "Khartoum",
    district: "Al Amarat",
    region: "Khartoum",
    registeredAt: "2026-09-02T07:10:00.000Z",
  },
  {
    id: "pat_mohamed",
    name: "Mohamed Elhag",
    phone: "+249 92 441 9033",
    email: "",
    nationalId: "SD-220198447",
    street: "Block 6, Al Morada",
    dob: "1996-01-28",
    occupation: "Construction",
    city: "Omdurman",
    district: "Al Morada",
    region: "Khartoum",
    registeredAt: "2026-10-11T08:00:00.000Z",
  },
  {
    id: "pat_fatima",
    name: "Fatima Abdalla",
    phone: "+249 90 118 6621",
    email: "fatima.abdalla@example.com",
    nationalId: "SD-155093882",
    street: "House 3, Burri",
    dob: "1974-11-02",
    occupation: "Civil servant",
    city: "Khartoum",
    district: "Burri",
    region: "Khartoum",
    registeredAt: "2026-06-18T06:40:00.000Z",
  },
  {
    id: "pat_ibrahim",
    name: "Ibrahim Osman",
    phone: "+249 91 773 2209",
    email: "",
    nationalId: "SD-301882164",
    street: "Plot 19, Khartoum North",
    dob: "2016-03-08",
    occupation: "Student",
    city: "Khartoum",
    district: "Khartoum North",
    region: "Khartoum",
    registeredAt: "2026-11-20T07:05:00.000Z",
  },
  {
    id: "pat_sara",
    name: "Sara Khalid",
    phone: "+249 96 550 1182",
    email: "sara.khalid@example.com",
    nationalId: "SD-276610493",
    street: "Apartment 2, Street 7",
    dob: "2004-12-01",
    occupation: "Nurse",
    city: "Khartoum",
    district: "Khartoum North",
    region: "Khartoum",
    registeredAt: "2026-08-09T09:12:00.000Z",
  },
  {
    id: "pat_yousif",
    name: "Yousif Babiker",
    phone: "+249 91 004 7781",
    email: "",
    nationalId: "SD-188320775",
    street: "House 40, Umbada",
    dob: "1968-06-14",
    occupation: "Driver",
    city: "Omdurman",
    district: "Umbada",
    region: "Khartoum",
    registeredAt: "2026-04-22T05:50:00.000Z",
  },
  {
    id: "pat_hanan",
    name: "Hanan Ali",
    phone: "+249 92 663 0194",
    email: "hanan.ali@example.com",
    nationalId: "SD-243119508",
    street: "House 8, Al Amarat",
    dob: "1981-09-30",
    occupation: "Trader",
    city: "Khartoum",
    district: "Al Amarat",
    region: "Khartoum",
    registeredAt: "2026-07-01T08:20:00.000Z",
  },
  {
    id: "pat_omar",
    name: "Omar Siddig",
    phone: "+249 90 882 4410",
    email: "",
    nationalId: "SD-265441902",
    street: "House 12, Street 5, Burri",
    dob: "1992-02-17",
    occupation: "Farmer",
    city: "Khartoum",
    district: "Burri",
    region: "Khartoum",
    registeredAt: "2026-11-24T14:05:00.000Z",
  },
];

function patient(id: string) {
  const found = PATIENTS.find((p) => p.id === id);
  if (!found) throw new Error(id);
  return found;
}

function queueItem(
  diagnosis: Diagnosis,
  status: SyncStatus,
  attempts: number,
  lastError: string | null,
  syncedAt: string | null,
): SyncItem {
  return {
    eventId: `evt_${diagnosis.id}`,
    diagnosisId: diagnosis.id,
    status,
    attempts,
    lastError,
    createdAt: diagnosis.diagnosedAt,
    syncedAt,
    payload: buildPayload({
      eventId: `evt_${diagnosis.id}`,
      facilityCode: "TAH-KRT-01",
      patient: patient(diagnosis.patientId),
      diagnosisCode: diagnosis.diagnosisCode,
      diagnosisName: diagnosis.diagnosisName,
      diagnosedAt: diagnosis.diagnosedAt,
    }),
  };
}

const DIAGNOSES: Diagnosis[] = [
  {
    id: "dx_amal_malaria",
    patientId: "pat_amal",
    doctorId: "doc_leila",
    diagnosisCode: "B50.9",
    diagnosisName: "Malaria, unspecified",
    clinicalNotes: "Fever and headache for 4 days. Amal Hassan asked to be called on +249 91 220 1844.",
    diagnosedAt: "2026-11-18T08:20:00.000Z",
  },
  {
    id: "dx_mohamed_flu",
    patientId: "pat_mohamed",
    doctorId: "doc_rania",
    diagnosisCode: "J11.1",
    diagnosisName: "Influenza",
    clinicalNotes: "Myalgia, cough. Works on a site in Al Morada.",
    diagnosedAt: "2026-11-12T07:40:00.000Z",
  },
  {
    id: "dx_fatima_dm",
    patientId: "pat_fatima",
    doctorId: "doc_leila",
    diagnosisCode: "E11.9",
    diagnosisName: "Type 2 diabetes mellitus",
    clinicalNotes: "Follow-up. Address on file: House 3, Burri. Insurance card not scanned.",
    diagnosedAt: "2026-11-03T09:00:00.000Z",
  },
  {
    id: "dx_ibrahim_ge",
    patientId: "pat_ibrahim",
    doctorId: "doc_hassan",
    diagnosisCode: "A09",
    diagnosisName: "Infectious gastroenteritis",
    clinicalNotes: "Child of Ibrahim's household. Vomiting since yesterday.",
    diagnosedAt: "2026-11-25T06:10:00.000Z",
  },
  {
    id: "dx_sara_typhoid",
    patientId: "pat_sara",
    doctorId: "doc_leila",
    diagnosisCode: "A01.0",
    diagnosisName: "Typhoid fever",
    clinicalNotes: "Persistent fever. Nurse at a ward in Khartoum North.",
    diagnosedAt: "2026-11-22T10:15:00.000Z",
  },
  {
    id: "dx_yousif_uri",
    patientId: "pat_yousif",
    doctorId: "doc_rania",
    diagnosisCode: "J06.9",
    diagnosisName: "Acute upper respiratory infection",
    clinicalNotes: "Sore throat. Note originally included national ID SD-188320775 and was rejected.",
    diagnosedAt: "2026-11-21T08:05:00.000Z",
  },
  {
    id: "dx_hanan_htn",
    patientId: "pat_hanan",
    doctorId: "doc_leila",
    diagnosisCode: "I10",
    diagnosisName: "Essential hypertension",
    clinicalNotes: "BP 162/96. Trader, travels between Khartoum and Wad Madani.",
    diagnosedAt: "2026-10-29T07:30:00.000Z",
  },
];

const APPOINTMENTS: Appointment[] = [
  {
    id: "apt_omar_today",
    patientId: "pat_omar",
    doctorId: "doc_leila",
    schedule: "2026-11-25T07:00:00.000Z",
    state: "scheduled",
    fee: 8000,
    reason: "Fever, three days",
  },
  {
    id: "apt_sara_today",
    patientId: "pat_sara",
    doctorId: "doc_leila",
    schedule: "2026-11-25T07:30:00.000Z",
    state: "checked_in",
    fee: 8000,
    reason: "Typhoid review",
  },
  {
    id: "apt_ibrahim_today",
    patientId: "pat_ibrahim",
    doctorId: "doc_hassan",
    schedule: "2026-11-25T06:00:00.000Z",
    state: "completed",
    fee: 6000,
    reason: "Vomiting",
  },
  {
    id: "apt_amal_next",
    patientId: "pat_amal",
    doctorId: "doc_rania",
    schedule: "2026-11-26T08:00:00.000Z",
    state: "scheduled",
    fee: 8000,
    reason: "Malaria follow-up",
  },
  {
    id: "apt_hanan_later",
    patientId: "pat_hanan",
    doctorId: "doc_leila",
    schedule: "2026-11-28T09:00:00.000Z",
    state: "scheduled",
    fee: 12000,
    reason: "Blood pressure check",
  },
];

function buildClinic(): ClinicState {
  const queue: SyncItem[] = [
    queueItem(DIAGNOSES[0], "synced", 1, null, "2026-11-18T08:21:12.000Z"),
    queueItem(DIAGNOSES[1], "synced", 1, null, "2026-11-12T07:41:04.000Z"),
    queueItem(DIAGNOSES[2], "synced", 2, null, "2026-11-03T09:04:40.000Z"),
    queueItem(DIAGNOSES[3], "pending", 0, null, null),
    queueItem(
      DIAGNOSES[4],
      "failed",
      3,
      "Transport error: connection timed out. Worker will retry with backoff.",
      null,
    ),
    queueItem(
      DIAGNOSES[5],
      "rejected",
      1,
      "400 rejected by ingest: body included clinical_notes. Validation failures are not retried.",
      null,
    ),
    queueItem(DIAGNOSES[6], "synced", 1, null, "2026-10-29T07:31:18.000Z"),
  ];

  return {
    facility: {
      facilityCode: "TAH-KRT-01",
      name: "Taha Clinic Khartoum",
      city: "Khartoum",
      region: "Khartoum",
      apiUrl: "https://ingest.tahagroup.sd/api/v1/epidemiology/sync",
      token: "tah_live_krt01",
      hmacSecret: "hmac_krt01_local",
      syncEnabled: true,
      online: true,
    },
    patients: PATIENTS,
    doctors: DOCTORS,
    appointments: APPOINTMENTS,
    diagnoses: DIAGNOSES,
    queue,
  };
}

export const SEED_CLINIC: ClinicState = buildClinic();

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T>(rng: () => number, items: { item: T; w: number }[]): T {
  const total = items.reduce((sum, item) => sum + item.w, 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.w;
    if (roll <= 0) return item.item;
  }
  return items[items.length - 1].item;
}

function makeCentralEvents(): CentralEvent[] {
  const rng = mulberry32(0x7a4a);
  const places = GEO.flatMap((region) =>
    region.cities.flatMap((city) =>
      city.districts.map((district) => ({
        region: region.region,
        city: city.name,
        district,
      })),
    ),
  );
  const events: CentralEvent[] = [];

  for (let i = 0; i < 280; i += 1) {
    const place = places[Math.floor(rng() * places.length)];
    const daysAgo = Math.floor(rng() * 56);
    const disease = pickWeighted(
      rng,
      ICD.map((entry) => {
        let w = entry.weight;
        if (entry.code === "B50.9" && (place.region === "Kassala" || place.region === "Gezira") && daysAgo < 14) {
          w *= 7;
        }
        if (entry.code === "A00.9" && place.region === "Red Sea" && daysAgo < 21) w *= 9;
        if (entry.code === "A90" && place.region === "Red Sea" && daysAgo < 12) w *= 5;
        return { item: entry, w };
      }),
    );
    const occupation = OCCUPATIONS[Math.floor(rng() * OCCUPATIONS.length)];
    const brackets = ["0-4", "5-14", "15-24", "25-34", "35-44", "45-54", "55-64", "65+"] as const;
    const bracketWeights = [1, 1.4, 1.6, 1.8, 1.7, 1.3, 1, 0.8];
    const age = pickWeighted(
      rng,
      brackets.map((item, index) => ({ item, w: bracketWeights[index] })),
    );
    const hour = 6 + Math.floor(rng() * 10);
    const minute = Math.floor(rng() * 60);
    const diagnosed = new Date(Date.parse(`${DEMO_DAY}T12:00:00+02:00`) - daysAgo * 86400000);
    diagnosed.setUTCHours(hour - 2, minute, 0, 0);
    const facility =
      FACILITIES.find((item) => item.city === place.city) ??
      FACILITIES.find((item) => item.region === place.region) ??
      FACILITIES[0];
    const eventId = `evt_hq_${String(i + 1).padStart(4, "0")}`;
    const diagnosedAt = diagnosed.toISOString();
    const received = new Date(diagnosed.getTime() + (2 + Math.floor(rng() * 40)) * 60 * 1000);

    events.push({
      event_id: eventId,
      facility_code: facility.code,
      facility_name: facility.name,
      diagnosis_code: disease.code,
      diagnosis_name: disease.name,
      age_bracket: age,
      occupation,
      city: place.city,
      district: place.district,
      region: place.region,
      diagnosed_at: diagnosedAt,
      received_at: received.toISOString(),
    });
  }

  for (const item of SEED_CLINIC.queue) {
    if (item.status !== "synced") continue;
    const known = facilityByCode(item.payload.facility_code);
    events.push({
      ...item.payload,
      facility_name: known?.name ?? item.payload.facility_code,
      received_at: item.syncedAt ?? item.createdAt,
    });
  }

  return events;
}

export const SEED_EVENTS: CentralEvent[] = makeCentralEvents();
export const SEED_EVENT_IDS = new Set(SEED_EVENTS.map((event) => event.event_id));
