from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional


class PatientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    age: int = Field(ge=0, le=130)
    gender: str = Field(min_length=1, max_length=20)
    phone: str = Field(min_length=1, max_length=20)
    email: Optional[EmailStr] = None
    address: Optional[str] = Field(default=None, max_length=255)
    disease: Optional[str] = Field(default=None, max_length=255)


class PatientUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    age: Optional[int] = Field(default=None, ge=0, le=130)
    gender: Optional[str] = Field(default=None, min_length=1, max_length=20)
    phone: Optional[str] = Field(default=None, min_length=1, max_length=20)
    email: Optional[EmailStr] = None
    address: Optional[str] = Field(default=None, max_length=255)
    disease: Optional[str] = Field(default=None, max_length=255)


class PatientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    age: int
    gender: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    disease: Optional[str] = None
    status: str
