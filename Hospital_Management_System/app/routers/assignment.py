from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.assignment import AssignmentCreate, AssignmentResponse
from app.schemas.patient import PatientResponse
from app.services import assignment as assignment_service

router = APIRouter(prefix="/assignments", tags=["Assignments"])


def raise_service_error(result):
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=result.get("status_code", 400), detail=result["error"])
    return result


@router.post("/assign", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
def assign_patient(data: AssignmentCreate, db: Session = Depends(get_db)):
    result = assignment_service.assign_patient(db, data.patient_id, data.doctor_id)
    return raise_service_error(result)


@router.post("/{assignment_id}/release", response_model=AssignmentResponse)
def release_patient(assignment_id: int, db: Session = Depends(get_db)):
    result = assignment_service.release_patient(db, assignment_id)
    return raise_service_error(result)


@router.get("/", response_model=list[AssignmentResponse])
def get_assignments(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return assignment_service.get_assignments(db, skip, limit)


@router.get("/active", response_model=list[AssignmentResponse])
def get_active_assignments(db: Session = Depends(get_db)):
    return assignment_service.get_active_assignments(db)


@router.get("/waiting", response_model=list[PatientResponse])
def get_waiting_patients(db: Session = Depends(get_db)):
    return assignment_service.get_waiting_patients(db)
