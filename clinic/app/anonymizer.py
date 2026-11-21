from datetime import date, datetime, timezone
from uuid import uuid4

from app.config import settings
from app.models import Diagnosis, Patient

AGE_BRACKETS = [
    (0, 9, "0-9"),
    (10, 19, "10-19"),
    (20, 29, "20-29"),
    (30, 39, "30-39"),
    (40, 49, "40-49"),
    (50, 59, "50-59"),
    (60, 69, "60-69"),
    (70, 79, "70-79"),
]


def age_bracket_from_dob(born: date, on: date | None = None) -> str:
    today = on or date.today()
    age = today.year - born.year - ((today.month, today.day) < (born.month, born.day))
    for low, high, label in AGE_BRACKETS:
        if low <= age <= high:
            return label
    return "80+"


def anonymize_diagnosis(patient: Patient, diagnosis: Diagnosis) -> dict:
    """Whitelist-only payload. Patient identifiers are never copied."""
    diagnosed_at = diagnosis.diagnosed_at
    if diagnosed_at.tzinfo is None:
        diagnosed_at = diagnosed_at.replace(tzinfo=timezone.utc)
    return {
        "event_id": str(uuid4()),
        "facility_code": settings.facility_code,
        "diagnosis_code": diagnosis.diagnosis_code,
        "diagnosis_name": diagnosis.diagnosis_name,
        "age_bracket": age_bracket_from_dob(patient.date_of_birth, diagnosed_at.date()),
        "occupation": patient.occupation,
        "city": patient.city or settings.facility_city,
        "district": patient.district or settings.facility_district,
        "region": patient.region or settings.facility_region,
        "diagnosed_at": diagnosed_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
