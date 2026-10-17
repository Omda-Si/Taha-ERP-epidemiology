from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


ALLOWED_GENDERS = {"male", "female", "other", "unknown", "m", "f", None, ""}


class SyncPayload(BaseModel):
    event_id: str = Field(min_length=8, max_length=64)
    facility_code: str = Field(min_length=3, max_length=64)
    diagnosis_code: str = Field(min_length=1, max_length=32)
    diagnosis_name: str = Field(min_length=1, max_length=128)
    age_bracket: str = Field(min_length=1, max_length=16)
    occupation: str = Field(min_length=1, max_length=64)
    city: str = Field(min_length=1, max_length=64)
    district: str = Field(min_length=1, max_length=64)
    region: str = Field(min_length=1, max_length=64)
    diagnosed_at: datetime
    gender: str | None = None

    @field_validator("gender")
    @classmethod
    def normalize_gender(cls, value: str | None) -> str | None:
        if value is None or value == "":
            return None
        lowered = value.strip().lower()
        mapping = {"m": "male", "f": "female"}
        lowered = mapping.get(lowered, lowered)
        if lowered not in {"male", "female", "other", "unknown"}:
            raise ValueError("gender must be male, female, other, or unknown")
        return lowered


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_id: str
    facility_code: str
    diagnosis_code: str
    diagnosis_name: str
    age_bracket: str
    occupation: str
    city: str
    district: str
    region: str
    gender: str | None
    diagnosed_at: datetime
    received_at: datetime
