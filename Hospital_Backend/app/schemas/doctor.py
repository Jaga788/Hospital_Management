from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional


class DoctorCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    specialization: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=1, max_length=20)
    email: Optional[EmailStr] = None
    experience: Optional[int] = Field(default=None, ge=0, le=80)


class DoctorUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    specialization: Optional[str] = Field(default=None, min_length=1, max_length=100)
    phone: Optional[str] = Field(default=None, min_length=1, max_length=20)
    email: Optional[EmailStr] = None
    experience: Optional[int] = Field(default=None, ge=0, le=80)


class DoctorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    specialization: str
    phone: str
    email: Optional[str] = None
    experience: Optional[int] = None
    status: str
