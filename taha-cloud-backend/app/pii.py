import re

from fastapi import HTTPException, status

from app.schemas import ALLOWED_KEYS

BLOCKED_PII_KEYS = {
    "name",
    "first_name",
    "last_name",
    "middle_name",
    "alias",
    "patient_name",
    "full_name",
    "display_name",
    "email",
    "phone",
    "mobile",
    "telephone",
    "address",
    "street",
    "street2",
    "house_number",
    "zip",
    "gps",
    "latitude",
    "longitude",
    "national_id",
    "passport",
    "patient_id",
    "medical_record_number",
    "mrn",
    "insurance",
    "billing",
    "account",
    "ssn",
    "vat",
    "clinical_notes",
    "date_of_birth",
}

_EMAIL_RE = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")
_PHONE_RE = re.compile(r"\+?\d[\d\-\s]{7,}\d")
_SCAN_FIELDS = ("occupation", "city", "district", "region", "diagnosis_name", "diagnosis_code")


def reject_pii(payload: dict) -> None:
    """Refuse any payload that includes identifiers or contact data."""
    keys = {str(key).lower() for key in payload}
    blocked = keys & BLOCKED_PII_KEYS
    unknown = keys - ALLOWED_KEYS - BLOCKED_PII_KEYS
    if blocked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payload contains blocked PII fields: {sorted(blocked)}",
        )
    if unknown:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payload contains unsupported fields: {sorted(unknown)}",
        )
    scanned = " ".join(str(payload.get(field) or "") for field in _SCAN_FIELDS)
    if _EMAIL_RE.search(scanned) or _PHONE_RE.search(scanned):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payload values look like contact information and were rejected.",
        )
