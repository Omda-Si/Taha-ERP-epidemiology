from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Patient(Base):
    """Local-only clinical identity. These fields never leave the clinic."""

    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(128), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    email: Mapped[str | None] = mapped_column(String(128), nullable=True)
    national_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    street_address: Mapped[str | None] = mapped_column(String(256), nullable=True)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str | None] = mapped_column(String(16), nullable=True)
    occupation: Mapped[str] = mapped_column(String(64), nullable=False)
    city: Mapped[str] = mapped_column(String(64), nullable=False)
    district: Mapped[str] = mapped_column(String(64), nullable=False)
    region: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    diagnoses: Mapped[list["Diagnosis"]] = relationship(back_populates="patient")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="patient")
    prescriptions: Mapped[list["Prescription"]] = relationship(back_populates="patient")


class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    diagnosis_code: Mapped[str] = mapped_column(String(32), nullable=False)
    diagnosis_name: Mapped[str] = mapped_column(String(128), nullable=False)
    clinical_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    diagnosed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    patient: Mapped[Patient] = relationship(back_populates="diagnoses")
    queue_item: Mapped["SyncQueue | None"] = relationship(back_populates="diagnosis", uselist=False)


class SyncQueue(Base):
    __tablename__ = "sync_queue"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    diagnosis_id: Mapped[int] = mapped_column(ForeignKey("diagnoses.id"), nullable=False, unique=True)
    event_id: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    payload_json: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_attempt_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    synced_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    diagnosis: Mapped[Diagnosis] = relationship(back_populates="queue_item")


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    specialty: Mapped[str] = mapped_column(String(64), nullable=False, default="General medicine")
    consultation_fee: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    appointments: Mapped[list["Appointment"]] = relationship(back_populates="doctor")


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id"), nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    visit_type: Mapped[str] = mapped_column(String(32), nullable=False, default="walkin")
    state: Mapped[str] = mapped_column(String(24), nullable=False, default="confirmed")
    chief_complaint: Mapped[str | None] = mapped_column(String(256), nullable=True)
    consultation_fee: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    payment_state: Mapped[str] = mapped_column(String(16), nullable=False, default="unpaid")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    patient: Mapped[Patient] = relationship(back_populates="appointments")
    doctor: Mapped[Doctor] = relationship(back_populates="appointments")


class Prescription(Base):
    __tablename__ = "prescriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    doctor_id: Mapped[int | None] = mapped_column(ForeignKey("doctors.id"), nullable=True)
    medication: Mapped[str] = mapped_column(String(128), nullable=False)
    dose: Mapped[str] = mapped_column(String(64), nullable=False)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    patient: Mapped[Patient] = relationship(back_populates="prescriptions")
