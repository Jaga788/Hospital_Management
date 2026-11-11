from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.assignment import Assignment
from app.models.user import DoctorProfile


def assign_patient(db: Session, patient_id: int, doctor_id: int):
    patient = db.query(Patient).filter(Patient.id == patient_id).with_for_update().first()
    if patient is None:
        return {"error": "Patient not found", "status_code": 404}

    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).with_for_update().first()
    if doctor is None:
        return {"error": "Doctor not found", "status_code": 404}

    doctor_profile = (
        db.query(DoctorProfile)
        .filter(
            DoctorProfile.doctor_id == doctor_id,
            DoctorProfile.verification_status == "APPROVED",
        )
        .first()
    )
    if (
        doctor_profile is None
        or not doctor_profile.user.is_active
        or not doctor_profile.user.is_verified
    ):
        return {"error": "Doctor is not approved to accept assignments", "status_code": 403}

    if patient.status != "WAITING":
        return {"error": "Patient is not waiting", "status_code": 409}

    if doctor.status != "AVAILABLE":
        return {"error": "Doctor is not available", "status_code": 409}

    assignment = Assignment(
        patient_id=patient_id,
        doctor_id=doctor_id,
        status="ACTIVE",
        assigned_at=datetime.utcnow(),
    )
    patient.status = "UNDER_TREATMENT"
    doctor.status = "BUSY"
    db.add(assignment)

    try:
        db.commit()
        db.refresh(assignment)
        return assignment
    except IntegrityError:
        db.rollback()
        return {"error": "Could not create assignment", "status_code": 409}


def release_patient(db: Session, assignment_id: int):
    assignment = (
        db.query(Assignment)
        .filter(Assignment.id == assignment_id)
        .with_for_update()
        .first()
    )
    if assignment is None:
        return {"error": "Assignment not found", "status_code": 404}

    if assignment.status != "ACTIVE":
        return {"error": "Assignment is already completed", "status_code": 409}

    patient = db.query(Patient).filter(Patient.id == assignment.patient_id).with_for_update().first()
    doctor = db.query(Doctor).filter(Doctor.id == assignment.doctor_id).with_for_update().first()

    assignment.status = "COMPLETED"
    assignment.released_at = datetime.utcnow()
    if patient:
        patient.status = "COMPLETED"
    if doctor:
        doctor.status = "AVAILABLE"

    # Intentionally no auto_assign_waiting_patient() call:
    # the next patient must be assigned manually.
    db.commit()
    db.refresh(assignment)
    return assignment


def get_active_assignments(db: Session):
    return db.query(Assignment).filter(Assignment.status == "ACTIVE").order_by(Assignment.id).all()


def get_waiting_patients(db: Session):
    return db.query(Patient).filter(Patient.status == "WAITING").order_by(Patient.id).all()


def get_assignments(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Assignment).order_by(Assignment.id).offset(skip).limit(limit).all()
