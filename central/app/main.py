import json
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware

from app.analytics import build_analytics
from app.config import settings
from app.db import Base, SessionLocal, engine, get_db
from app.models import EpidemiologyEvent
from app.pii import assert_no_pii
from app.schemas import EventOut, SyncPayload
from app.security import verify_ingest_auth
from app.seed import seed_demo_events

STATIC_DIR = Path(__file__).parent / "static"


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    if settings.seed_demo:
        db = SessionLocal()
        try:
            seed_demo_events(db)
        finally:
            db.close()
    yield


app = FastAPI(
    title="Taha Group Epidemiological Ingestion API",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


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
    return {"status": "ok", "service": "taha-central"}


@app.get("/", response_class=HTMLResponse)
def dashboard():
    return (STATIC_DIR / "dashboard.html").read_text(encoding="utf-8")


@app.post("/api/v1/epidemiology/sync")
async def ingest_sync(
    request: Request,
    body: bytes = Depends(verify_ingest_auth),
    db: Session = Depends(get_db),
):
    del request
    try:
        raw = json.loads(body)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON") from exc

    try:
        if isinstance(raw, dict):
            assert_no_pii(raw)
        items = _extract_events(raw)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    accepted = 0
    duplicates = 0
    stored_ids: list[str] = []

    for item in items:
        if not isinstance(item, dict):
            raise HTTPException(status_code=400, detail="Each event must be an object")
        try:
            assert_no_pii(item)
            payload = SyncPayload.model_validate(item)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        existing = db.query(EpidemiologyEvent).filter_by(event_id=payload.event_id).one_or_none()
        if existing:
            duplicates += 1
            stored_ids.append(payload.event_id)
            continue

        db.add(
            EpidemiologyEvent(
                event_id=payload.event_id,
                facility_code=payload.facility_code,
                diagnosis_code=payload.diagnosis_code,
                diagnosis_name=payload.diagnosis_name,
                age_bracket=payload.age_bracket,
                occupation=payload.occupation,
                city=payload.city,
                district=payload.district,
                region=payload.region,
                gender=payload.gender,
                diagnosed_at=payload.diagnosed_at,
            )
        )
        accepted += 1
        stored_ids.append(payload.event_id)

    db.commit()
    return {"accepted": accepted, "duplicates": duplicates, "event_ids": stored_ids}


@app.get("/api/v1/epidemiology/analytics")
def analytics(days: int = Query(default=30, ge=1, le=365), db: Session = Depends(get_db)):
    return build_analytics(db, days=days)


@app.get("/api/v1/epidemiology/events", response_model=list[EventOut])
def list_events(limit: int = Query(default=50, ge=1, le=500), db: Session = Depends(get_db)):
    rows = (
        db.query(EpidemiologyEvent)
        .order_by(EpidemiologyEvent.diagnosed_at.desc())
        .limit(limit)
        .all()
    )
    return rows
