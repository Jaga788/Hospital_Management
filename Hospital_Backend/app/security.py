import os
from datetime import datetime, timedelta, timezone
from uuid import UUID

import jwt
from pwdlib import PasswordHash


password_hasher = PasswordHash.recommended()
DUMMY_PASSWORD_HASH = password_hasher.hash("not-a-real-user-password")
ACCESS_TOKEN_LIFETIME = timedelta(minutes=60)


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, stored_hash: str) -> bool:
    return password_hasher.verify(password, stored_hash)


def _jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET_KEY", "")
    if len(secret) < 32:
        raise RuntimeError("JWT_SECRET_KEY must be configured with at least 32 characters")
    return secret


def create_access_token(user_id: UUID, token_version: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "ver": token_version,
        "iat": now,
        "exp": now + ACCESS_TOKEN_LIFETIME,
    }
    return jwt.encode(payload, _jwt_secret(), algorithm="HS256")


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, _jwt_secret(), algorithms=["HS256"])
