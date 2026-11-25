"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { buildPayload } from "./anonymize";
import { SEED_CLINIC } from "./seed";
import type {
  Appointment,
  AppointmentState,
  ClinicState,
  FacilityConfig,
  Patient,
} from "./types";

const KEY = "teedss.clinic.v1";

export type PatientInput = Omit<Patient, "id" | "registeredAt">;

export type AppointmentInput = Omit<Appointment, "id" | "state">;

export type DiagnosisInput = {
  patientId: string;
  doctorId: string;
  diagnosisCode: string;
  diagnosisName: string;
  clinicalNotes: string;
  diagnosedAt: string;
};

type ClinicApi = {
  state: ClinicState;
  registerPatient: (input: PatientInput) => Patient;
  bookAppointment: (input: AppointmentInput) => Appointment;
  setAppointmentState: (id: string, state: AppointmentState) => void;
  recordDiagnosis: (input: DiagnosisInput) => { diagnosisId: string; eventId: string | null };
  flushQueue: () => void;
  retryOne: (eventId: string) => void;
  updateFacility: (patch: Partial<FacilityConfig>) => void;
  resetDemo: () => void;
};

const Ctx = createContext<ClinicApi | null>(null);
const listeners = new Set<() => void>();

let cacheRaw: string | null | undefined;
let cacheState: ClinicState = SEED_CLINIC;

function emit() {
  listeners.forEach((listener) => listener());
}

function isClinicState(value: unknown): value is ClinicState {
  if (!value || typeof value !== "object") return false;
  const row = value as ClinicState;
  return Boolean(row.facility?.facilityCode) && Array.isArray(row.patients) && Array.isArray(row.queue);
}

function getSnapshot(): ClinicState {
  const raw = localStorage.getItem(KEY);
  if (raw === cacheRaw) return cacheState;
  cacheRaw = raw;
  if (!raw) {
    cacheState = SEED_CLINIC;
    return cacheState;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    cacheState = isClinicState(parsed) ? parsed : SEED_CLINIC;
  } catch {
    cacheState = SEED_CLINIC;
  }
  return cacheState;
}

function getServerSnapshot(): ClinicState {
  return SEED_CLINIC;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function write(next: ClinicState) {
  const raw = JSON.stringify(next);
  cacheState = next;
  cacheRaw = raw;
  localStorage.setItem(KEY, raw);
  emit();
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

function settle(eventId: string) {
  window.setTimeout(() => {
    const current = getSnapshot();
    if (!current.facility.online || !current.facility.syncEnabled) return;
    const row = current.queue.find((item) => item.eventId === eventId);
    if (!row || row.status !== "pending") return;
    write({
      ...current,
      queue: current.queue.map((item) =>
        item.eventId === eventId
          ? {
              ...item,
              status: "synced",
              attempts: item.attempts + 1,
              lastError: null,
              syncedAt: new Date().toISOString(),
            }
          : item,
      ),
    });
  }, 1200);
}

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const api = useMemo<ClinicApi>(() => {
    return {
      state,
      registerPatient: (input) => {
        const patient: Patient = {
          ...input,
          id: uid("pat"),
          registeredAt: new Date().toISOString(),
        };
        write({ ...state, patients: [patient, ...state.patients] });
        return patient;
      },
      bookAppointment: (input) => {
        const appointment: Appointment = { ...input, id: uid("apt"), state: "scheduled" };
        write({ ...state, appointments: [...state.appointments, appointment] });
        return appointment;
      },
      setAppointmentState: (id, next) => {
        write({
          ...state,
          appointments: state.appointments.map((row) => (row.id === id ? { ...row, state: next } : row)),
        });
      },
      recordDiagnosis: (input) => {
        const patient = state.patients.find((row) => row.id === input.patientId);
        if (!patient) return { diagnosisId: "", eventId: null };
        const diagnosisId = uid("dx");
        const diagnosis = {
          id: diagnosisId,
          patientId: input.patientId,
          doctorId: input.doctorId,
          diagnosisCode: input.diagnosisCode,
          diagnosisName: input.diagnosisName,
          clinicalNotes: input.clinicalNotes,
          diagnosedAt: input.diagnosedAt,
        };
        if (!state.facility.syncEnabled) {
          write({ ...state, diagnoses: [diagnosis, ...state.diagnoses] });
          return { diagnosisId, eventId: null };
        }
        const eventId = uid("evt");
        write({
          ...state,
          diagnoses: [diagnosis, ...state.diagnoses],
          queue: [
            {
              eventId,
              diagnosisId,
              status: "pending",
              attempts: 0,
              lastError: null,
              createdAt: new Date().toISOString(),
              syncedAt: null,
              payload: buildPayload({
                eventId,
                facilityCode: state.facility.facilityCode,
                patient,
                diagnosisCode: input.diagnosisCode,
                diagnosisName: input.diagnosisName,
                diagnosedAt: input.diagnosedAt,
              }),
            },
            ...state.queue,
          ],
        });
        if (state.facility.online) settle(eventId);
        return { diagnosisId, eventId };
      },
      flushQueue: () => {
        const online = state.facility.online;
        write({
          ...state,
          queue: state.queue.map((row) => {
            if (row.status !== "pending" && row.status !== "failed") return row;
            if (!online) {
              return {
                ...row,
                status: "failed",
                attempts: row.attempts + 1,
                lastError: "Transport error: clinic is offline. Row kept for retry.",
              };
            }
            return {
              ...row,
              status: "synced",
              attempts: row.attempts + 1,
              lastError: null,
              syncedAt: new Date().toISOString(),
            };
          }),
        });
      },
      retryOne: (eventId) => {
        const online = state.facility.online;
        write({
          ...state,
          queue: state.queue.map((row) => {
            if (row.eventId !== eventId) return row;
            if (row.status === "rejected" || row.status === "synced") return row;
            if (!online) {
              return {
                ...row,
                status: "failed",
                attempts: row.attempts + 1,
                lastError: "Transport error: clinic is offline. Row kept for retry.",
              };
            }
            return {
              ...row,
              status: "synced",
              attempts: row.attempts + 1,
              lastError: null,
              syncedAt: new Date().toISOString(),
            };
          }),
        });
      },
      updateFacility: (patch) => {
        write({ ...state, facility: { ...state.facility, ...patch } });
      },
      resetDemo: () => {
        write(structuredClone(SEED_CLINIC));
      },
    };
  }, [state]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useClinic() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useClinic must be used inside ClinicProvider");
  return ctx;
}
