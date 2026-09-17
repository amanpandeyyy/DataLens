from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from app.models.user import User
    from app.models.project import Project
    from app.models.dataset import Dataset
    from app.models.query_history import QueryHistory
    from app.models.report import Report
    from app.models.cleaning_history import CleaningHistory
    from app.core.security import get_password_hash

    Base.metadata.create_all(bind=engine)

    # Seed default demo user if not exists
    db = SessionLocal()
    try:
        demo_user = db.query(User).filter(User.email == "demo@datalens.ai").first()
        if not demo_user:
            demo_user = User(
                email="demo@datalens.ai",
                hashed_password=get_password_hash("datalens123"),
                full_name="Alex Mercer",
                role="Lead Data Analyst"
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)

            default_proj = Project(
                name="Q3 Sales & Revenue Analytics",
                description="Comprehensive commercial and product line performance analysis",
                user_id=demo_user.id
            )
            db.add(default_proj)
            db.commit()
    finally:
        db.close()

