from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.security import decode_access_token


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise unauthorized

    try:
        payload = decode_access_token(credentials.credentials)
        user_id = UUID(payload["sub"])
        token_version = payload["ver"]
    except (jwt.PyJWTError, KeyError, TypeError, ValueError, RuntimeError) as error:
        raise unauthorized from error

    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active or user.token_version != token_version:
        raise unauthorized
    if not user.is_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is pending verification")
    if user.role == "DOCTOR" and (
        user.doctor_profile is None
        or user.doctor_profile.verification_status != "APPROVED"
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor account is not approved")
    return user


def require_roles(*roles: str):
    def check_role(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return check_role
