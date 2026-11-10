from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class AssignmentCreate(BaseModel):
    patient_id: int = Field(gt=0)
    doctor_id: int = Field(gt=0)


class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    doctor_id: int
    status: str
    assigned_at: datetime
    released_at: datetime | None = None
