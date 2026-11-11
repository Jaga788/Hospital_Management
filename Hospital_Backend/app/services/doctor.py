from sqlalchemy.orm import Session
from app.models.doctor import Doctor
from app.models.user import DoctorProfile, User
from app.models.assignment import Assignment
from app.schemas.doctor import DoctorCreate, DoctorUpdate


def create_doctor(db: Session, data: DoctorCreate):
    doctor = Doctor(**data.model_dump(), status="AVAILABLE")
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


def get_doctor(db: Session, doctor_id: int):
    return db.query(Doctor).filter(Doctor.id == doctor_id).first()


def get_doctors(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Doctor).order_by(Doctor.id).offset(skip).limit(limit).all()


def get_available_doctors(db: Session):
    return (
        db.query(Doctor)
        .join(DoctorProfile, DoctorProfile.doctor_id == Doctor.id)
        .join(User, User.id == DoctorProfile.user_id)
        .filter(
            Doctor.status == "AVAILABLE",
            DoctorProfile.verification_status == "APPROVED",
            User.is_active.is_(True),
            User.is_verified.is_(True),
        )
        .order_by(Doctor.id)
        .all()
    )


def update_doctor(db: Session, doctor_id: int, data: DoctorUpdate):
    doctor = get_doctor(db, doctor_id)
    if doctor is None:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(doctor, key, value)
    db.commit()
    db.refresh(doctor)
    return doctor


def delete_doctor(db: Session, doctor_id: int):
    doctor = get_doctor(db, doctor_id)
    if doctor is None:
        return "not_found"
    if db.query(Assignment).filter(Assignment.doctor_id == doctor_id).first():
        return "has_assignments"
    profile = db.query(DoctorProfile).filter(DoctorProfile.doctor_id == doctor_id).first()
    if profile is not None:
        profile.user.is_active = False
        profile.user.is_verified = False
    db.delete(doctor)
    db.commit()
    return "deleted"
