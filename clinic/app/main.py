import asyncio
import json
from contextlib import asynccontextmanager
from datetime import date, datetime
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app import catalog
from app.anonymizer import anonymize_diagnosis
from app.config import settings
from app.db import Base, SessionLocal, engine, get_db
from app.models import Appointment, Diagnosis, Doctor, Patient, Prescription, SyncQueue
from app.sync import flush_queue

STATIC_DIR = Path(__file__).parent / "static"


class PatientIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=128)
    phone: str | None = None
    email: str | None = None
    national_id: str | None = None
    street_address: str | None = None
    date_of_birth: date
    gender: str | None = None
    occupation: str
    city: str
    district: str
    region: str


class DiagnosisIn(BaseModel):
    patient_id: int
    diagnosis_code: str
    diagnosis_name: str
    clinical_notes: str | None = None


class DoctorIn(BaseModel):
    name: str = Field(min_length=2, max_length=128)
    specialty: str = "General medicine"
    consultation_fee: int = 50


class AppointmentIn(BaseModel):
    patient_id: int
    doctor_id: int
    scheduled_at: datetime
    visit_type: str = "walkin"
    chief_complaint: str | None = None


class PrescriptionIn(BaseModel):
    patient_id: int
    doctor_id: int | None = None
    medication: str
    dose: str
    instructions: str | None = None


async def _sync_loop() -> None:
    await asyncio.sleep(2)
    while True:
        db = SessionLocal()
        try:
            await asyncio.to_thread(flush_queue, db)
        except Exception:
            pass
        finally:
            db.close()
        await asyncio.sleep(settings.sync_interval_seconds)


def _seed_if_empty(db: Session) -> None:
    if not db.query(Doctor).first():
        db.add_all(
            [
                Doctor(name="Dr. Lina Osman", specialty="General medicine", consultation_fee=50),
                Doctor(name="Dr. Tarig Mohamed", specialty="Emergency", consultation_fee=80),
                Doctor(name="Dr. Hana Ali", specialty="Pediatrics", consultation_fee=60),
            ]
        )
        db.commit()
    if db.query(Patient).first():
        return
    patient = Patient(
        full_name="Demo Patient (local only)",
        phone="+249100000000",
        email="demo.patient@clinic.local",
        national_id="DEMO-9911",
        street_address="12 Nile Street",
        date_of_birth=date(1992, 4, 12),
        gender="female",
        occupation="Teacher",
        city=settings.facility_city,
        district=settings.facility_district,
        region=settings.facility_region,
    )
    db.add(patient)
    db.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        _seed_if_empty(db)
    finally:
        db.close()
    task = asyncio.create_task(_sync_loop())
    yield
    task.cancel()


app = FastAPI(title="Taha Clinic", version="2.0.0", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", response_class=HTMLResponse)
def home():
    return (STATIC_DIR / "clinic.html").read_text(encoding="utf-8")


@app.get("/api/meta")
def meta():
    return {
        "facility_code": settings.facility_code,
        "facility_name": settings.facility_name,
        "city": settings.facility_city,
        "district": settings.facility_district,
        "region": settings.facility_region,
        "central_api_url": settings.central_api_url,
        "diseases": catalog.DISEASES,
        "occupations": catalog.OCCUPATIONS,
        "cities": catalog.CITIES,
    }


@app.get("/api/patients")
def list_patients(db: Session = Depends(get_db)):
    patients = db.query(Patient).order_by(Patient.created_at.desc()).all()
    return [
        {
            "id": patient.id,
            "full_name": patient.full_name,
            "phone": patient.phone,
            "date_of_birth": patient.date_of_birth.isoformat(),
            "gender": patient.gender,
            "occupation": patient.occupation,
            "city": patient.city,
            "district": patient.district,
            "region": patient.region,
        }
        for patient in patients
    ]


@app.post("/api/patients")
def create_patient(payload: PatientIn, db: Session = Depends(get_db)):
    patient = Patient(**payload.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return {"id": patient.id}


@app.post("/api/diagnoses")
def create_diagnosis(payload: DiagnosisIn, db: Session = Depends(get_db)):
    patient = db.get(Patient, payload.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    diagnosis = Diagnosis(
        patient_id=patient.id,
        diagnosis_code=payload.diagnosis_code,
        diagnosis_name=payload.diagnosis_name,
        clinical_notes=payload.clinical_notes,
        diagnosed_at=datetime.utcnow(),
    )
    db.add(diagnosis)
    db.flush()
    anonymized = anonymize_diagnosis(patient, diagnosis)
    queue_item = SyncQueue(
        diagnosis_id=diagnosis.id,
        event_id=anonymized["event_id"],
        payload_json=json.dumps(anonymized, default=str),
        status="pending",
    )
    db.add(queue_item)
    db.commit()
    flush_queue(db)
    return {
        "diagnosis_id": diagnosis.id,
        "event_id": anonymized["event_id"],
        "queued_payload": anonymized,
        "note": "Patient identifiers were stripped before queueing.",
    }


@app.get("/api/queue")
def list_queue(db: Session = Depends(get_db)):
    items = db.query(SyncQueue).order_by(SyncQueue.created_at.desc()).all()
    return [
        {
            "id": item.id,
            "event_id": item.event_id,
            "status": item.status,
            "attempts": item.attempts,
            "last_error": item.last_error,
            "created_at": item.created_at.isoformat(),
            "synced_at": item.synced_at.isoformat() if item.synced_at else None,
            "payload": json.loads(item.payload_json),
        }
        for item in items
    ]


@app.post("/api/queue/flush")
def flush(db: Session = Depends(get_db)):
    return flush_queue(db)


@app.get("/api/doctors")
def list_doctors(db: Session = Depends(get_db)):
    doctors = db.query(Doctor).order_by(Doctor.name).all()
    return [
        {
            "id": doctor.id,
            "name": doctor.name,
            "specialty": doctor.specialty,
            "consultation_fee": doctor.consultation_fee,
        }
        for doctor in doctors
    ]


@app.post("/api/doctors")
def create_doctor(payload: DoctorIn, db: Session = Depends(get_db)):
    doctor = Doctor(**payload.model_dump())
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return {"id": doctor.id}


@app.get("/api/appointments")
def list_appointments(db: Session = Depends(get_db)):
    rows = db.query(Appointment).order_by(Appointment.scheduled_at.desc()).all()
    return [
        {
            "id": row.id,
            "patient_id": row.patient_id,
            "patient_name": row.patient.full_name,
            "doctor_id": row.doctor_id,
            "doctor_name": row.doctor.name,
            "scheduled_at": row.scheduled_at.isoformat(sep=" ", timespec="minutes"),
            "visit_type": row.visit_type,
            "state": row.state,
            "chief_complaint": row.chief_complaint,
            "consultation_fee": row.consultation_fee,
            "payment_state": row.payment_state,
        }
        for row in rows
    ]


@app.post("/api/appointments")
def create_appointment(payload: AppointmentIn, db: Session = Depends(get_db)):
    patient = db.get(Patient, payload.patient_id)
    doctor = db.get(Doctor, payload.doctor_id)
    if not patient or not doctor:
        raise HTTPException(status_code=404, detail="Patient or doctor not found")
    row = Appointment(
        patient_id=patient.id,
        doctor_id=doctor.id,
        scheduled_at=payload.scheduled_at,
        visit_type=payload.visit_type,
        chief_complaint=payload.chief_complaint,
        consultation_fee=doctor.consultation_fee,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id}


@app.post("/api/appointments/{appointment_id}/pay")
def pay_appointment(appointment_id: int, db: Session = Depends(get_db)):
    row = db.get(Appointment, appointment_id)
    if not row:
        raise HTTPException(status_code=404, detail="Appointment not found")
    row.payment_state = "paid"
    row.state = "done"
    db.commit()
    return {"id": row.id, "payment_state": row.payment_state}


@app.get("/api/prescriptions")
def list_prescriptions(db: Session = Depends(get_db)):
    rows = db.query(Prescription).order_by(Prescription.created_at.desc()).all()
    return [
        {
            "id": row.id,
            "patient_name": row.patient.full_name,
            "medication": row.medication,
            "dose": row.dose,
            "instructions": row.instructions,
            "created_at": row.created_at.isoformat(sep=" ", timespec="minutes"),
        }
        for row in rows
    ]


@app.post("/api/prescriptions")
def create_prescription(payload: PrescriptionIn, db: Session = Depends(get_db)):
    patient = db.get(Patient, payload.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    row = Prescription(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id}


@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db)):
    return {
        "patients": db.query(Patient).count(),
        "appointments": db.query(Appointment).count(),
        "diagnoses": db.query(Diagnosis).count(),
        "unpaid": db.query(Appointment).filter(Appointment.payment_state == "unpaid").count(),
        "queue_pending": db.query(SyncQueue).filter(SyncQueue.status.in_(["pending", "failed"])).count(),
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "taha-clinic", "facility_code": settings.facility_code}
