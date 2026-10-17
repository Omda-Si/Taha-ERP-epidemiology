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
            response = httpx.post(
                f"{settings.central_api_url.rstrip('/')}/api/v1/epidemiology/sync",
                content=body,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {settings.taha_api_token}",
                    "X-Taha-Signature": sign_body(body),
                    "X-Facility-Code": settings.facility_code,
                },
                timeout=8.0,
            )
            response.raise_for_status()
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
    return {"processed": len(pending), "sent": sent, "failed": failed}
