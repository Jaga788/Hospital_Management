import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('ADMIN', 'DOCTOR', 'PATIENT')", name="ck_users_role"),
    )

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    token_version = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    patient_profile = relationship(
        "PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    doctor_profile = relationship(
        "DoctorProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        foreign_keys="DoctorProfile.user_id",
    )


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, unique=True)

    user = relationship("User", back_populates="patient_profile")
    patient = relationship("Patient", back_populates="profile")


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"
    __table_args__ = (
        CheckConstraint(
            "verification_status IN ('PENDING', 'APPROVED', 'REJECTED')",
            name="ck_doctor_profiles_verification_status",
        ),
    )

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, unique=True)
    license_number = Column(String(100), nullable=False)
    verification_status = Column(String(20), nullable=False, default="PENDING")
    reviewed_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(String(500), nullable=True)

    user = relationship("User", back_populates="doctor_profile", foreign_keys=[user_id])
    doctor = relationship("Doctor", back_populates="profile")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
