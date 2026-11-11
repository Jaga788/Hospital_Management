from sqlalchemy.orm import Session
from app.models.patient import Patient
from app.models.assignment import Assignment
from app.models.user import PatientProfile
from app.schemas.patient import PatientCreate, PatientUpdate


def create_patient(db: Session, data: PatientCreate):
    patient = Patient(**data.model_dump(), status="WAITING")
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


def get_patient(db: Session, patient_id: int):
    return db.query(Patient).filter(Patient.id == patient_id).first()


def get_patients(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Patient).order_by(Patient.id).offset(skip).limit(limit).all()


def update_patient(db: Session, patient_id: int, data: PatientUpdate):
    patient = get_patient(db, patient_id)
    if patient is None:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(patient, key, value)
    db.commit()
    db.refresh(patient)
    return patient


def delete_patient(db: Session, patient_id: int):
    patient = get_patient(db, patient_id)
    if patient is None:
        return "not_found"
    if db.query(Assignment).filter(Assignment.patient_id == patient_id).first():
        return "has_assignments"
    profile = db.query(PatientProfile).filter(PatientProfile.patient_id == patient_id).first()
    if profile is not None:
        profile.user.is_active = False
        profile.user.is_verified = False
    db.delete(patient)
    db.commit()
    return "deleted"
