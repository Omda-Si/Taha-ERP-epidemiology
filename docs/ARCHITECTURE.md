# Taha Group TEEDSS — System Architecture

**Source of truth:** `Taha_ERP.pdf` (Feature Proposal: Epidemiological Data Sync)  
**Client:** Taha Group  
**Delivery model:** Clinic & Hospital ERP (Odoo) + central anonymized ingest + HQ analytics  
**Document status:** Engineering baseline (implementation planning)

---

## 1. Problem statement

Clinics already run daily operations in an ERP (patients, appointments, diagnoses, billing). That data contains public-health signal, but raw clinical records must never leave the facility.

TEEDSS adds a **silent background sync** that:

1. Detects a new or updated diagnosis.
2. Strips all PII.
3. Queues an anonymized payload locally.
4. Transmits it asynchronously to Taha Group (retry when offline).
5. Surfaces outbreak / demographic analytics at HQ.

---

## 2. Design principles

| Principle | Engineering rule |
|---|---|
| Privacy by construction | Whitelist payload only; blocklist PII keys; never send patient tables |
| Clinic UX must not degrade | Sync is async; doctor save path never waits on the network |
| Offline first | Local durable queue; exponential retry |
| Defense in depth | TLS + Bearer token + HMAC-SHA256 of raw body |
| Separation of concerns | Clinic ERP ≠ HQ analytics DB |

---

## 3. Logical architecture (3 tiers)

```
┌──────────────────────────────────────────────────────────┐
│ Tier 1 — Clinic / Hospital ERP (Odoo)                    │
│  Patient · Appointment · Diagnosis · Billing · Pharmacy  │
│  + Anonymizer + Offline Sync Queue + Config              │
└────────────────────────────┬─────────────────────────────┘
                             │ HTTPS POST /api/v1/epidemiology/sync
                             │ Authorization: Bearer <token>
                             │ X-Taha-Signature: HMAC-SHA256(body)
┌────────────────────────────▼─────────────────────────────┐
│ Tier 2 — Taha Group Ingest API                           │
│  Auth · PII reject · Idempotent event_id · Persist       │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────┐
│ Tier 3 — HQ Analytics                                    │
│  PostgreSQL / Supabase + Odoo HQ Dashboard / BI          │
└──────────────────────────────────────────────────────────┘
```

---

## 4. End-to-end workflow

### 4.1 Clinic staff (happy path)

1. Reception registers patient (name, phone, national ID stay local).
2. Appointment is booked / patient checked in.
3. Physician records diagnosis (ICD/code + label + notes).
4. On `create`/`write` of diagnosis → anonymizer builds whitelist payload.
5. Payload is inserted into local sync queue (`pending`).
6. Cron / worker flushes queue to central API.
7. On HTTP 2xx → `synced`. On transport failure → `failed` + retry. On 4xx validation → `rejected` (no retry).

### 4.2 Offline clinic

- Steps 1–5 still succeed.
- Flush fails → queue retains rows.
- When connectivity returns, worker retries automatically.

### 4.3 HQ analyst

1. Authenticated user opens HQ epidemiology app.
2. Views charts by disease, region, age bracket, occupation, time.
3. Never sees patient name, phone, or national ID.

---

## 5. Entity model

### 5.1 Clinic domain (local, may contain PII)

| Entity | Key fields | Notes |
|---|---|---|
| Facility | facility_code, name, city, region | Config / tenant identity for sync |
| User / Doctor | name, specialty, license | Local staff |
| Department | code, name | Facility ops |
| Patient | name, phone, email, national_id, street, dob, occupation, city, district, region | **PII — never synced** |
| Appointment | patient_id, doctor_id, schedule, state, fee | Local ops |
| Diagnosis | patient_id, diagnosis_code, diagnosis_name, clinical_notes, diagnosed_at | Trigger for sync |
| SyncQueue | event_id, diagnosis_id, payload_json, status, attempts, last_error | Anonymized only |
| Invoice / Prescription | local billing / pharmacy | Out of sync scope |

### 5.2 Central domain (no PII)

| Entity | Key fields |
|---|---|
| EpidemiologyEvent | event_id (unique), facility_code, diagnosis_code, diagnosis_name, age_bracket, occupation, city, district, region, diagnosed_at, received_at |

### 5.3 Allowed payload (whitelist)

`event_id`, `facility_code`, `diagnosis_code`, `diagnosis_name`, `age_bracket`, `occupation`, `city`, `district`, `region`, `diagnosed_at`

### 5.4 Blocked fields (examples)

`name`, `phone`, `email`, `street`, `national_id`, `patient_id`, `clinical_notes`, `billing`, GPS, exact age as free text that re-identifies.

---

## 6. Component design (Odoo-centric)

| Component | Responsibility |
|---|---|
| Odoo Clinic module | Patient, appointment, diagnosis, billing UI/models |
| Anonymization service | Deterministic whitelist builder + validation |
| Sync queue model | Durable offline cache |
| Cron / worker | Flush pending/failed rows |
| Settings | API URL, token, HMAC secret, facility code, enable flag |
| Central FastAPI | Auth, HMAC verify, PII reject, upsert by event_id |
| HQ Odoo dashboard | Graphs/pivots on EpidemiologyEvent |
| Optional cloud DB | Supabase/Postgres behind the same API contract |

---

## 7. Security & compliance controls

1. Network: HTTPS only in production.
2. Auth: shared facility token (rotate per environment).
3. Integrity: HMAC over raw JSON body.
4. Application: reject unknown or blocked keys before persistence.
5. Ops: clinic backups treated as confidential (contain PII); HQ backups must not.

---

## 8. Environments & deploy topology

| Environment | Clinic | API | HQ |
|---|---|---|---|
| Local/dev | Odoo Docker or desktop clinic | localhost API or Odoo ingest | local Odoo HQ |
| Staging | Staging clinic instance | Staging API + staging DB | Staging HQ |
| Production | Per-facility clinic | Cloud API + managed Postgres | HQ Odoo / BI |

Release rule: clinic apps pin API contract version; breaking payload changes require a new API version path.

---

## 9. Delivery workstreams (GitHub)

See Issues board. Epics:

1. **Frontend** — clinic UX + HQ dashboard UX  
2. **Backend** — Odoo models, anonymizer, queue, central API  
3. **Hosting** — Docker, cloud Postgres, TLS, secrets  
4. **Deploy** — CI/CD, environments, rollback  

Each issue must state: Goal, Where in code, Done when.
