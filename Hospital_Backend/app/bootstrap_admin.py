import os
import sys

from pydantic import TypeAdapter, ValidationError
from pydantic.networks import EmailStr

from app.database import SessionLocal
from app.models.user import User
from app.security import hash_password


def main() -> int:
    email = os.getenv("BOOTSTRAP_ADMIN_EMAIL", "").strip().lower()
    password = os.getenv("BOOTSTRAP_ADMIN_PASSWORD", "")
    if not email or not password:
        raise RuntimeError(
            "Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD for this one-time command"
        )
    if len(password) < 16 or len(password) > 128:
        raise RuntimeError("The bootstrap admin password must be between 16 and 128 characters")
    try:
        email = str(TypeAdapter(EmailStr).validate_python(email)).lower()
    except ValidationError as error:
        raise RuntimeError("BOOTSTRAP_ADMIN_EMAIL must be a valid email address") from error

    with SessionLocal() as db:
        if db.query(User).filter(User.role == "ADMIN").first() is not None:
            raise RuntimeError("An ADMIN account already exists; bootstrap is one-time only")
        if db.query(User).filter(User.email == email).first() is not None:
            raise RuntimeError("An account with BOOTSTRAP_ADMIN_EMAIL already exists")
        db.add(User(
            email=email,
            password_hash=hash_password(password),
            role="ADMIN",
            is_active=True,
            is_verified=True,
        ))
        db.commit()
    print("Super Admin account created. Remove the bootstrap credentials from the environment.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1) from error
