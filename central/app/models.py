from datetime import datetime

from sqlalchemy import DateTime, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class EpidemiologyEvent(Base):
    __tablename__ = "epidemiology_events"
    __table_args__ = (UniqueConstraint("event_id", name="uq_epidemiology_event_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    facility_code: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    diagnosis_code: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    diagnosis_name: Mapped[str] = mapped_column(String(128), nullable=False)
    age_bracket: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    occupation: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    city: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    district: Mapped[str] = mapped_column(String(64), nullable=False)
    region: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    gender: Mapped[str | None] = mapped_column(String(16), nullable=True)
    diagnosed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
