from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.doctor import DoctorCreate, DoctorUpdate, DoctorResponse
from app.services import doctor as doctor_service

router = APIRouter(prefix="/doctors", tags=["Doctors"])


@router.post("/", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def create_doctor(data: DoctorCreate, db: Session = Depends(get_db)):
    return doctor_service.create_doctor(db, data)


@router.get("/", response_model=list[DoctorResponse])
def get_doctors(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return doctor_service.get_doctors(db, skip, limit)


@router.get("/available", response_model=list[DoctorResponse])
def get_available_doctors(db: Session = Depends(get_db)):
    return doctor_service.get_available_doctors(db)


@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    doctor = doctor_service.get_doctor(db, doctor_id)
    if doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


@router.put("/{doctor_id}", response_model=DoctorResponse)
def put_doctor(doctor_id: int, data: DoctorCreate, db: Session = Depends(get_db)):
    doctor = doctor_service.update_doctor(
        db, doctor_id, DoctorUpdate(**data.model_dump())
    )
    if doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


@router.patch("/{doctor_id}", response_model=DoctorResponse)
def patch_doctor(doctor_id: int, data: DoctorUpdate, db: Session = Depends(get_db)):
    if not data.model_dump(exclude_unset=True):
        raise HTTPException(status_code=400, detail="Provide at least one field to update")
    doctor = doctor_service.update_doctor(db, doctor_id, data)
    if doctor is None:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


@router.delete("/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_doctor(doctor_id: int, db: Session = Depends(get_db)):
    result = doctor_service.delete_doctor(db, doctor_id)
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Doctor not found")
    if result == "has_assignments":
        raise HTTPException(status_code=409, detail="Doctor has assignment history and cannot be deleted")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
