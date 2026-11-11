from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import require_roles
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse
from app.services import patient as patient_service

router = APIRouter(
    prefix="/patients",
    tags=["Patients"],
    dependencies=[Depends(require_roles("ADMIN"))],
)


@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(data: PatientCreate, db: Session = Depends(get_db)):
    return patient_service.create_patient(db, data)


@router.get("/", response_model=list[PatientResponse])
def get_patients(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return patient_service.get_patients(db, skip, limit)


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = patient_service.get_patient(db, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.put("/{patient_id}", response_model=PatientResponse)
def put_patient(patient_id: int, data: PatientCreate, db: Session = Depends(get_db)):
    # PUT accepts a complete patient profile; workflow status remains service-managed.
    patient = patient_service.update_patient(
        db, patient_id, PatientUpdate(**data.model_dump())
    )
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.patch("/{patient_id}", response_model=PatientResponse)
def patch_patient(patient_id: int, data: PatientUpdate, db: Session = Depends(get_db)):
    if not data.model_dump(exclude_unset=True):
        raise HTTPException(status_code=400, detail="Provide at least one field to update")
    patient = patient_service.update_patient(db, patient_id, data)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    result = patient_service.delete_patient(db, patient_id)
    if result == "not_found":
        raise HTTPException(status_code=404, detail="Patient not found")
    if result == "has_assignments":
        raise HTTPException(status_code=409, detail="Patient has assignment history and cannot be deleted")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
