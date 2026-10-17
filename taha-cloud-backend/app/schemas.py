from datetime import datetime

from pydantic import BaseModel, Field, field_validator

ALLOWED_KEYS = {
    "event_id",
    "facility_code",
    "diagnosis_code",
    "diagnosis_name",
    "age_bracket",
    "occupation",
    "city",
    "district",
    "region",
    "diagnosed_at",
    "events",
}


class SyncPayload(BaseModel):
    event_id: str = Field(min_length=8, max_length=64)
    facility_code: str = Field(min_length=3, max_length=64)
    diagnosis_code: str = Field(min_length=1, max_length=32)
    diagnosis_name: str = Field(min_length=1, max_length=128)
    age_bracket: str = Field(min_length=1, max_length=16)
    occupation: str = Field(min_length=1, max_length=64)
    region: str = Field(min_length=1, max_length=64)
    diagnosed_at: datetime
    city: str | None = Field(default=None, max_length=64)
    district: str | None = Field(default=None, max_length=64)

    @field_validator("city", "district", mode="before")
    @classmethod
    def empty_to_none(cls, value: str | None) -> str | None:
        if value is None or str(value).strip() == "":
            return None
        return str(value).strip()
