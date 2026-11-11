from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_roles
from app.database import get_db
from app.models.assignment import Assignment
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.models.user import DoctorProfile, PatientProfile, User
from app.schemas.assignment import AssignmentResponse
from app.schemas.auth import (
    CurrentUserResponse,
    DoctorProfileUpdate,
    DoctorRegistration,
    DoctorVerificationResponse,
    DoctorVerificationUpdate,
    LoginRequest,
    LoginResponse,
    PasswordChange,
    PatientProfileUpdate,
    PatientRegistration,
    UserResponse,
)
from app.schemas.doctor import DoctorResponse
from app.schemas.patient import PatientResponse
from app.security import (
    DUMMY_PASSWORD_HASH,
    create_access_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _normalized_email(email: str) -> str:
    return email.strip().lower()


def _user_profile(user: User) -> dict[str, Any] | None:
    if user.role == "PATIENT" and user.patient_profile is not None:
        patient = user.patient_profile.patient
        return PatientResponse.model_validate(patient).model_dump(mode="json")
    if user.role == "DOCTOR" and user.doctor_profile is not None:
        doctor = user.doctor_profile.doctor
        profile = DoctorResponse.model_validate(doctor).model_dump(mode="json")
        profile["license_number"] = user.doctor_profile.license_number
        profile["verification_status"] = user.doctor_profile.verification_status
        return profile
    return None


def _doctor_verification_response(profile: DoctorProfile) -> dict[str, Any]:
    doctor = profile.doctor
    return {
        "user_id": profile.user_id,
        "doctor_id": doctor.id,
        "email": profile.user.email,
        "name": doctor.name,
        "specialization": doctor.specialization,
        "phone": doctor.phone,
        "experience": doctor.experience,
        "license_number": profile.license_number,
        "verification_status": profile.verification_status,
        "is_active": profile.user.is_active,
    }


@router.post("/register/patient", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_patient(data: PatientRegistration, db: Session = Depends(get_db)):
    user = User(
        email=_normalized_email(str(data.email)),
        password_hash=hash_password(data.password),
        role="PATIENT",
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    try:
        db.flush()
        patient = Patient(
            name=data.name.strip(),
            age=data.age,
            gender=data.gender.strip(),
            phone=data.phone.strip(),
            email=user.email,
            address=data.address,
            disease=data.disease,
            status="WAITING",
        )
        db.add(patient)
        db.flush()
        db.add(PatientProfile(user_id=user.id, patient_id=patient.id))
        db.commit()
        db.refresh(user)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists") from error
    return user


@router.post("/register/doctor", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_doctor(data: DoctorRegistration, db: Session = Depends(get_db)):
    user = User(
        email=_normalized_email(str(data.email)),
        password_hash=hash_password(data.password),
        role="DOCTOR",
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    try:
        db.flush()
        doctor = Doctor(
            name=data.name.strip(),
            specialization=data.specialization.strip(),
            phone=data.phone.strip(),
            email=user.email,
            experience=data.experience,
            status="AVAILABLE",
        )
        db.add(doctor)
        db.flush()
        db.add(DoctorProfile(
            user_id=user.id,
            doctor_id=doctor.id,
            license_number=data.license_number.strip(),
            verification_status="PENDING",
        ))
        db.commit()
        db.refresh(user)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists") from error
    return user


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    email = _normalized_email(str(data.email))
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        verify_password(data.password, DUMMY_PASSWORD_HASH)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")
    if user.role == "DOCTOR" and (
        user.doctor_profile is None
        or user.doctor_profile.verification_status != "APPROVED"
        or not user.is_verified
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor account is pending verification")
    if not user.is_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is pending verification")
    return {
        "access_token": create_access_token(user.id, user.token_version),
        "user": user,
    }


@router.get("/me", response_model=CurrentUserResponse)
def current_user(user: User = Depends(get_current_user)):
    result = UserResponse.model_validate(user).model_dump()
    result["profile"] = _user_profile(user)
    return result


@router.patch("/me/patient-profile", response_model=PatientResponse)
def update_patient_profile(
    data: PatientProfileUpdate,
    user: User = Depends(require_roles("PATIENT")),
    db: Session = Depends(get_db),
):
    profile = user.patient_profile
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found")
    updates = data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide at least one field to update")
    for field, value in updates.items():
        setattr(profile.patient, field, value.strip() if isinstance(value, str) else value)
    db.commit()
    db.refresh(profile.patient)
    return profile.patient


@router.patch("/me/doctor-profile", response_model=DoctorResponse)
def update_doctor_profile(
    data: DoctorProfileUpdate,
    user: User = Depends(require_roles("DOCTOR")),
    db: Session = Depends(get_db),
):
    profile = user.doctor_profile
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found")
    updates = data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide at least one field to update")
    for field, value in updates.items():
        setattr(profile.doctor, field, value.strip() if isinstance(value, str) else value)
    db.commit()
    db.refresh(profile.doctor)
    return profile.doctor


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    data: PasswordChange,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    if data.current_password == data.new_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be different")
    user.password_hash = hash_password(data.new_password)
    user.token_version += 1
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.token_version += 1
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me/assignments", response_model=list[AssignmentResponse])
def my_assignments(
    user: User = Depends(require_roles("PATIENT", "DOCTOR")),
    db: Session = Depends(get_db),
):
    if user.role == "PATIENT":
        if user.patient_profile is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found")
        query = db.query(Assignment).filter(Assignment.patient_id == user.patient_profile.patient_id)
    else:
        if user.doctor_profile is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found")
        query = db.query(Assignment).filter(Assignment.doctor_id == user.doctor_profile.doctor_id)
    return query.order_by(Assignment.id.desc()).all()


@router.get("/me/patients", response_model=list[PatientResponse])
def my_assigned_patients(
    user: User = Depends(require_roles("DOCTOR")),
    db: Session = Depends(get_db),
):
    if user.doctor_profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found")
    assignments = (
        db.query(Assignment)
        .filter(Assignment.doctor_id == user.doctor_profile.doctor_id)
        .order_by(Assignment.id.desc())
        .all()
    )
    return list({assignment.patient.id: assignment.patient for assignment in assignments}.values())


@router.get(
    "/admin/doctors",
    response_model=list[DoctorVerificationResponse],
    dependencies=[Depends(require_roles("ADMIN"))],
)
def list_registered_doctors(
    verification_status: str | None = Query(default=None, pattern="^(PENDING|APPROVED|REJECTED)$"),
    db: Session = Depends(get_db),
):
    query = db.query(DoctorProfile)
    if verification_status:
        query = query.filter(DoctorProfile.verification_status == verification_status)
    return [
        _doctor_verification_response(profile)
        for profile in query.order_by(DoctorProfile.user_id).all()
    ]


@router.post("/admin/doctors/{doctor_user_id}/approve", response_model=DoctorVerificationResponse)
def approve_doctor(
    doctor_user_id: UUID,
    user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
):
    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == doctor_user_id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor registration not found")
    if not profile.user.is_active:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Inactive doctor accounts cannot be approved")
    profile.verification_status = "APPROVED"
    profile.user.is_verified = True
    profile.reviewed_by = user.id
    profile.reviewed_at = datetime.now(timezone.utc)
    profile.rejection_reason = None
    db.commit()
    db.refresh(profile)
    return _doctor_verification_response(profile)


@router.post(
    "/admin/doctors/{doctor_user_id}/reject",
    response_model=DoctorVerificationResponse,
)
def reject_doctor(
    doctor_user_id: UUID,
    data: DoctorVerificationUpdate,
    user: User = Depends(require_roles("ADMIN")),
    db: Session = Depends(get_db),
):
    if not data.reason or len(data.reason.strip()) < 3:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="A rejection reason is required")
    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == doctor_user_id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor registration not found")
    profile.verification_status = "REJECTED"
    profile.user.is_verified = False
    profile.user.token_version += 1
    profile.reviewed_by = user.id
    profile.reviewed_at = datetime.now(timezone.utc)
    profile.rejection_reason = data.reason.strip()
    db.commit()
    db.refresh(profile)
    return _doctor_verification_response(profile)
