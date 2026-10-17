FORBIDDEN_KEYS = {
    "name",
    "first_name",
    "last_name",
    "middle_name",
    "alias",
    "patient_name",
    "full_name",
    "email",
    "phone",
    "mobile",
    "telephone",
    "address",
    "street",
    "house_number",
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
}


def assert_no_pii(payload: dict) -> None:
    lowered = {str(key).lower() for key in payload}
    blocked = lowered & FORBIDDEN_KEYS
    if blocked:
        raise ValueError(f"Payload contains blocked PII fields: {sorted(blocked)}")
