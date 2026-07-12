from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# --- DATABASE CONFIGURATION ---
# Default: SQLite for hackathon/local dev (no setup required)
# To switch to PostgreSQL, replace the line below with:
#   SQLALCHEMY_DATABASE_URL = "postgresql://user:password@localhost:5432/assetflow_db"
SQLALCHEMY_DATABASE_URL = "sqlite:///./assetflow.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite only — remove for Postgres
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
