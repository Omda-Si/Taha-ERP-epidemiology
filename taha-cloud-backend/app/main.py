import json
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.auth import require_api_key
from app.database import Base, engine, get_db
from app.models import EpidemiologyRecord
from app.pii import reject_pii
from app.schemas import SyncPayload


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Taha Group Cloud Ingestion API",
    description="Receives anonymized epidemiological events from clinic Odoo instances.",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


def _extract_events(raw: object) -> list[dict]:
    if isinstance(raw, list):
        return raw
    if isinstance(raw, dict) and "events" in raw:
        events = raw["events"]
        if not isinstance(events, list):
            raise HTTPException(status_code=400, detail="events must be an array")
        return events
    if isinstance(raw, dict):
        return [raw]
    raise HTTPException(status_code=400, detail="JSON object or array required")


@app.get("/health")
def health():
    return {"status": "ok", "service": "taha-cloud-backend"}


@app.post("/api/v1/epidemiology/sync")
def ingest_sync(
    body: bytes = Depends(require_api_key),
    db: Session = Depends(get_db),
):
    try:
        raw = json.loads(body)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON") from exc

    if isinstance(raw, dict):
        reject_pii(raw)

    accepted = 0
    duplicates = 0
    event_ids: list[str] = []

    for item in _extract_events(raw):
        if not isinstance(item, dict):
            raise HTTPException(status_code=400, detail="Each event must be an object")
        reject_pii(item)
        try:
            payload = SyncPayload.model_validate(item)
        except ValidationError as exc:
            raise HTTPException(status_code=400, detail=json.loads(exc.json())) from exc

        existing = db.query(EpidemiologyRecord).filter_by(event_id=payload.event_id).one_or_none()
        if existing:
            duplicates += 1
            event_ids.append(payload.event_id)
            continue

        db.add(
            EpidemiologyRecord(
                event_id=payload.event_id,
                facility_code=payload.facility_code,
                diagnosis_code=payload.diagnosis_code,
                diagnosis_name=payload.diagnosis_name,
                age_bracket=payload.age_bracket,
                occupation=payload.occupation,
                city=payload.city,
                district=payload.district,
                region=payload.region,
                diagnosed_at=payload.diagnosed_at,
            )
        )
        accepted += 1
        event_ids.append(payload.event_id)

    db.commit()
    return {
        "accepted": accepted,
        "duplicates": duplicates,
        "event_ids": event_ids,
        "status": "ok",
    }
