from collections import defaultdict
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import EpidemiologyEvent


def _aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _counts(rows: list[tuple[str, int]]) -> list[dict]:
    return [{"label": label, "count": count} for label, count in rows]


def build_analytics(db: Session, days: int = 30) -> dict:
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=days)

    total = db.scalar(select(func.count()).select_from(EpidemiologyEvent)) or 0
    window_total = db.scalar(
        select(func.count()).select_from(EpidemiologyEvent).where(EpidemiologyEvent.diagnosed_at >= since)
    ) or 0
    disease_count = db.scalar(select(func.count(func.distinct(EpidemiologyEvent.diagnosis_code)))) or 0
    region_count = db.scalar(select(func.count(func.distinct(EpidemiologyEvent.region)))) or 0
    facility_count = db.scalar(select(func.count(func.distinct(EpidemiologyEvent.facility_code)))) or 0

    def grouped(column):
        rows = db.execute(
            select(column, func.count())
            .where(EpidemiologyEvent.diagnosed_at >= since)
            .group_by(column)
            .order_by(func.count().desc())
        ).all()
        return _counts(rows)

    daily_rows = db.execute(
        select(func.date(EpidemiologyEvent.diagnosed_at), func.count())
        .where(EpidemiologyEvent.diagnosed_at >= since)
        .group_by(func.date(EpidemiologyEvent.diagnosed_at))
        .order_by(func.date(EpidemiologyEvent.diagnosed_at))
    ).all()
    by_day = [{"label": str(day), "count": count} for day, count in daily_rows]

    events = db.execute(
        select(EpidemiologyEvent)
        .where(EpidemiologyEvent.diagnosed_at >= now - timedelta(days=14))
        .order_by(EpidemiologyEvent.diagnosed_at.desc())
    ).scalars().all()

    recent_map: dict[tuple[str, str], int] = defaultdict(int)
    previous_map: dict[tuple[str, str], int] = defaultdict(int)
    cutoff = now - timedelta(days=7)
    previous_start = now - timedelta(days=14)
    for event in events:
        key = (event.diagnosis_name, event.region)
        diagnosed = _aware(event.diagnosed_at)
        if diagnosed >= cutoff:
            recent_map[key] += 1
        elif diagnosed >= previous_start:
            previous_map[key] += 1

    alerts = []
    for key, recent in recent_map.items():
        previous = previous_map.get(key, 0)
        if recent >= 5 and (previous == 0 or recent >= previous * 2):
            diagnosis_name, region = key
            alerts.append(
                {
                    "diagnosis_name": diagnosis_name,
                    "region": region,
                    "last_7_days": recent,
                    "previous_7_days": previous,
                    "severity": "high" if previous == 0 or recent >= previous * 3 else "medium",
                }
            )
    alerts.sort(key=lambda item: item["last_7_days"], reverse=True)

    latest = db.execute(
        select(EpidemiologyEvent).order_by(EpidemiologyEvent.diagnosed_at.desc()).limit(25)
    ).scalars().all()

    return {
        "generated_at": now.isoformat(),
        "window_days": days,
        "kpis": {
            "total_events": total,
            "window_events": window_total,
            "diseases": disease_count,
            "regions": region_count,
            "facilities": facility_count,
            "active_alerts": len(alerts),
        },
        "by_disease": grouped(EpidemiologyEvent.diagnosis_name),
        "by_region": grouped(EpidemiologyEvent.region),
        "by_city": grouped(EpidemiologyEvent.city),
        "by_age_bracket": grouped(EpidemiologyEvent.age_bracket),
        "by_occupation": grouped(EpidemiologyEvent.occupation),
        "by_gender": grouped(EpidemiologyEvent.gender),
        "by_day": by_day,
        "alerts": alerts,
        "latest": [
            {
                "event_id": event.event_id,
                "facility_code": event.facility_code,
                "diagnosis_code": event.diagnosis_code,
                "diagnosis_name": event.diagnosis_name,
                "age_bracket": event.age_bracket,
                "occupation": event.occupation,
                "city": event.city,
                "district": event.district,
                "region": event.region,
                "gender": event.gender,
                "diagnosed_at": _aware(event.diagnosed_at).isoformat(),
            }
            for event in latest
        ],
    }
