export type AgeBracket =
  | "0-4"
  | "5-14"
  | "15-24"
  | "25-34"
  | "35-44"
  | "45-54"
  | "55-64"
  | "65+";

export type SyncStatus = "pending" | "synced" | "failed" | "rejected";

export type AppointmentState = "scheduled" | "checked_in" | "completed" | "cancelled";

export type Patient = {
  id: string;
  name: string;
  phone: string;
  email: string;
  nationalId: string;
  street: string;
  dob: string;
  occupation: string;
  city: string;
  district: string;
  region: string;
  registeredAt: string;
};

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  department: string;
  license: string;
};

export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  schedule: string;
  state: AppointmentState;
  fee: number;
  reason: string;
};

export type Diagnosis = {
  id: string;
  patientId: string;
  doctorId: string;
  diagnosisCode: string;
  diagnosisName: string;
  clinicalNotes: string;
  diagnosedAt: string;
};

/** Whitelist that is allowed to leave the facility. Keys match the API contract. */
export type EpidemiologyPayload = {
  event_id: string;
  facility_code: string;
  diagnosis_code: string;
  diagnosis_name: string;
  age_bracket: AgeBracket;
  occupation: string;
  city: string;
  district: string;
  region: string;
  diagnosed_at: string;
};

export type SyncItem = {
  eventId: string;
  diagnosisId: string;
  status: SyncStatus;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  syncedAt: string | null;
  payload: EpidemiologyPayload;
};

export type FacilityConfig = {
  facilityCode: string;
  name: string;
  city: string;
  region: string;
  apiUrl: string;
  token: string;
  hmacSecret: string;
  syncEnabled: boolean;
  online: boolean;
};

export type ClinicState = {
  facility: FacilityConfig;
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  diagnoses: Diagnosis[];
  queue: SyncItem[];
};

export type CentralEvent = EpidemiologyPayload & {
  received_at: string;
  facility_name: string;
};
