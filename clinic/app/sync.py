import hashlib
import hmac
import json
from datetime import datetime

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models import SyncQueue


def sign_body(body: bytes) -> str:
    return hmac.new(
        settings.taha_hmac_secret.encode("utf-8"),
        body,
        hashlib.sha256,
    ).hexdigest()


def _send_via_hq(body: bytes) -> None:
    response = httpx.post(
        f"{settings.central_api_url.rstrip('/')}/api/v1/epidemiology/sync",
        content=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.taha_api_token}",
            "X-Taha-Signature": sign_body(body),
            "X-Facility-Code": settings.facility_code,
        },
        timeout=12.0,
    )
    response.raise_for_status()


def _send_via_supabase(payload: dict) -> None:
    """Insert anonymized row straight into Supabase (no HQ process required)."""
    base = settings.supabase_url.rstrip("/")
    url = f"{base}/rest/v1/epidemiology_records"
    now = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    row = {
        "event_id": payload["event_id"],
        "facility_code": payload["facility_code"],
        "diagnosis_code": payload["diagnosis_code"],
        "diagnosis_name": payload["diagnosis_name"],
        "age_bracket": payload["age_bracket"],
        "occupation": payload["occupation"],
        "city": payload.get("city"),
        "district": payload.get("district"),
        "region": payload["region"],
        "diagnosed_at": payload["diagnosed_at"],
        "received_at": now,
    }
    response = httpx.post(
        url,
        json=row,
        headers={
            "apikey": settings.supabase_key,
            "Authorization": f"Bearer {settings.supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal,resolution=ignore-duplicates",
        },
        timeout=15.0,
    )
    # 201 created, 200 ok, or 409 duplicate → treat as success for queue
    if response.status_code in (200, 201, 409):
        return
    if response.status_code == 409:
        return
    response.raise_for_status()


def flush_queue(db: Session, limit: int = 25) -> dict:
    pending = (
        db.query(SyncQueue)
        .filter(SyncQueue.status.in_(["pending", "failed"]))
        .order_by(SyncQueue.created_at.asc())
        .limit(limit)
        .all()
    )
    sent = 0
    failed = 0
    for item in pending:
        body = item.payload_json.encode("utf-8")
        item.attempts += 1
        item.last_attempt_at = datetime.utcnow()
        try:
            if settings.use_supabase_direct:
                _send_via_supabase(json.loads(item.payload_json))
            else:
                _send_via_hq(body)
            item.status = "synced"
            item.synced_at = datetime.utcnow()
            item.last_error = None
            sent += 1
        except Exception as exc:  # noqa: BLE001 - queue must keep local copy on any failure
            item.status = "failed"
            item.last_error = str(exc)[:1000]
            failed += 1
        db.add(item)
    db.commit()
    return {
        "processed": len(pending),
        "sent": sent,
        "failed": failed,
        "mode": "supabase" if settings.use_supabase_direct else "hq",
    }
