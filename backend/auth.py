"""
auth.py — JWT + bcrypt utilities
Handles password hashing and JWT token creation/verification.
"""

from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

# ── Config ────────────────────────────────────────────────────
# In production: load from environment variable / .env file
SECRET_KEY  = "nexus-super-secret-key-change-in-production-2026"
ALGORITHM   = "HS256"
TOKEN_EXPIRE_DAYS = 7

# ── Password context ─────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if plain matches the bcrypt hash."""
    return pwd_context.verify(plain, hashed)


# ── JWT ───────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT token containing the given data."""
    payload = data.copy()
    expire  = datetime.utcnow() + (expires_delta or timedelta(days=TOKEN_EXPIRE_DAYS))
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """
    Decode a JWT token and return its payload.
    Returns None if the token is invalid or expired.
    """
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
