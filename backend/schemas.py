"""
schemas.py — Pydantic request / response schemas for auth endpoints.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ── Signup ────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name:     str
    email:    str
    password: str
    role:     str = "student"  # student | tpo | recruiter | mentor

    # Student
    college:  Optional[str] = None
    branch:   Optional[str] = None
    year:     Optional[str] = None

    # TPO
    department:  Optional[str] = None
    employee_id: Optional[str] = None

    # Recruiter
    company:     Optional[str] = None
    designation: Optional[str] = None
    linkedin_url: Optional[str] = None

    # Mentor
    current_role:     Optional[str] = None
    domain_expertise: Optional[str] = None  # comma-separated string


# ── Login ─────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email:    str
    password: str
    role:     str = "student"


# ── Responses ─────────────────────────────────────────────────

class UserOut(BaseModel):
    id:      int
    name:    str
    email:   str
    role:    str
    college: Optional[str] = None
    branch:  Optional[str] = None
    year:    Optional[str] = None
    company: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         UserOut
    message:      str
