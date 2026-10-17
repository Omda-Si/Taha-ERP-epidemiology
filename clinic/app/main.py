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
from app.models import Diagnosis, Patient, SyncQueue
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


app = FastAPI(title="Clinic ERP · Taha Epidemiology Sync", version="1.0.0", lifespan=lifespan)
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


@app.get("/health")
def health():
    return {"status": "ok", "service": "taha-clinic", "facility_code": settings.facility_code}
