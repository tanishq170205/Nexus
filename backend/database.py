"""
database.py — SQLAlchemy + SQLite setup
Creates nexus.db in the backend/ folder automatically on first run.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load from environment, fallback to hardcoded Supabase connection for demo
# Note: For Supabase with IPv4 issues on Python, it's safer to use the connection pooler or pgBouncer if needed,
# but the direct connection usually works for local dev.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    # Session Pooler — IPv4 compatible (works on all networks)
    # username format for pooler is: postgres.PROJECT_ID
    "postgresql://postgres.qqyzyypodbaytbkgeeue:7tBvXV233NP3BHZW@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
)

# For PostgreSQL, we don't need check_same_thread
engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency — yields a DB session, closes it after request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
