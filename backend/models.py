"""
models.py — SQLAlchemy ORM models
Defines the users table in nexus.db.
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String, nullable=False)
    email         = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

    # Role: student | tpo | recruiter | mentor
    role          = Column(String, default="student")

    # Student-specific
    college       = Column(String, nullable=True)
    branch        = Column(String, nullable=True)
    year          = Column(String, nullable=True)

    # TPO-specific
    department    = Column(String, nullable=True)
    employee_id   = Column(String, nullable=True)

    # Recruiter-specific
    company       = Column(String, nullable=True)
    designation   = Column(String, nullable=True)
    linkedin_url  = Column(String, nullable=True)

    # Mentor-specific
    current_role  = Column(String, nullable=True)
    domain_expertise = Column(String, nullable=True)  # comma-separated

    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
