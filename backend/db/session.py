import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database path (local SQLite file)
if os.environ.get("VERCEL") or os.environ.get("NOW_REGION"):
    DB_PATH = "/tmp/financial_research.db"
else:
    DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "financial_research.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}  # Needed for SQLite in multi-threaded environments like FastAPI
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """
    Dependency generator to get database session per request
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
