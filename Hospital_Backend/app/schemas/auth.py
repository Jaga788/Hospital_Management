from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class PatientRegistration(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    name: str = Field(min_length=1, max_length=100)
    age: int = Field(ge=0, le=130)
    gender: str = Field(min_length=1, max_length=20)
    phone: str = Field(min_length=1, max_length=20)
    address: str | None = Field(default=None, max_length=255)
    disease: str | None = Field(default=None, max_length=255)

    @field_validator("name", "gender", "phone")
    @classmethod
    def require_nonblank_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Field must not be blank")
        return value


class DoctorRegistration(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    name: str = Field(min_length=1, max_length=100)
    specialization: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=1, max_length=20)
    experience: int | None = Field(default=None, ge=0, le=80)
    license_number: str = Field(min_length=3, max_length=100)

    @field_validator("name", "specialization", "phone", "license_number")
    @classmethod
    def require_nonblank_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Field must not be blank")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=12, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    role: Literal["ADMIN", "DOCTOR", "PATIENT"]
    is_active: bool
    is_verified: bool
    created_at: datetime


class LoginResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserResponse


class PatientProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    age: int | None = Field(default=None, ge=0, le=130)
    gender: str | None = Field(default=None, min_length=1, max_length=20)
    phone: str | None = Field(default=None, min_length=1, max_length=20)
    address: str | None = Field(default=None, max_length=255)
    disease: str | None = Field(default=None, max_length=255)

    @field_validator("name", "gender", "phone")
    @classmethod
    def require_nonblank_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("Field must not be blank")
        return value


class DoctorProfileUpdate(BaseModel):
    phone: str | None = Field(default=None, min_length=1, max_length=20)
    experience: int | None = Field(default=None, ge=0, le=80)

    @field_validator("phone")
    @classmethod
    def require_nonblank_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("Phone must not be blank")
        return value


class DoctorVerificationUpdate(BaseModel):
    reason: str | None = Field(default=None, min_length=3, max_length=500)


class DoctorVerificationResponse(BaseModel):
    user_id: UUID
    doctor_id: int
    email: EmailStr
    name: str
    specialization: str
    phone: str
    experience: int | None
    license_number: str
    verification_status: str
    is_active: bool


class CurrentUserResponse(UserResponse):
    profile: dict[str, Any] | None = None
