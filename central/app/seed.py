import random
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import EpidemiologyEvent

DISEASES = [
    ("B50", "Malaria"),
    ("J11", "Influenza"),
    ("E11", "Type 2 diabetes"),
    ("A00", "Cholera"),
    ("A01", "Typhoid fever"),
    ("A15", "Tuberculosis"),
    ("U07.1", "COVID-19"),
    ("I10", "Hypertension"),
    ("B05", "Measles"),
    ("A09", "Infectious gastroenteritis"),
]

LOCATIONS = [
    ("Khartoum", "Khartoum", "Khartoum"),
    ("Omdurman", "Omdurman", "Khartoum"),
    ("Bahri", "Khartoum North", "Khartoum"),
    ("Port Sudan", "Red Sea", "Red Sea"),
    ("Wad Madani", "Al Gezira", "Al Gezira"),
    ("El Obeid", "North Kordofan", "North Kordofan"),
    ("Kassala", "Kassala", "Kassala"),
    ("Nyala", "South Darfur", "South Darfur"),
]

OCCUPATIONS = [
    "Teacher",
    "Construction",
    "Farmer",
    "Healthcare",
    "Driver",
    "Student",
    "Office worker",
    "Merchant",
    "Homemaker",
    "Unemployed",
]

AGE_BRACKETS = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80+"]
GENDERS = ["male", "female"]
FACILITIES = ["CLN-KRT-001", "CLN-OMD-002", "CLN-PSD-003", "CLN-WMD-004", "CLN-KSL-005"]


def seed_demo_events(db: Session, count: int = 180) -> None:
    existing = db.scalar(select(EpidemiologyEvent.id).limit(1))
    if existing:
        return

    now = datetime.now(timezone.utc)
    rng = random.Random(42)
    records = []
    for _ in range(count):
        code, name = rng.choice(DISEASES)
        city, district, region = rng.choice(LOCATIONS)
        # Bias malaria and influenza slightly for outbreak-looking charts.
        if rng.random() < 0.22:
            code, name = "B50", "Malaria"
            city, district, region = rng.choice(LOCATIONS[:3])
        diagnosed_at = now - timedelta(days=rng.randint(0, 28), hours=rng.randint(0, 23))
        records.append(
            EpidemiologyEvent(
                event_id=str(uuid4()),
                facility_code=rng.choice(FACILITIES),
                diagnosis_code=code,
                diagnosis_name=name,
                age_bracket=rng.choice(AGE_BRACKETS),
                occupation=rng.choice(OCCUPATIONS),
                city=city,
                district=district,
                region=region,
                gender=rng.choice(GENDERS),
                diagnosed_at=diagnosed_at,
                received_at=diagnosed_at + timedelta(minutes=rng.randint(1, 90)),
            )
        )
    db.add_all(records)
    db.commit()
