from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # csv, xlsx, json
    file_path = Column(String(1000), nullable=False)
    row_count = Column(Integer, default=0)
    col_count = Column(Integer, default=0)
    file_size_bytes = Column(Integer, default=0)
    is_sample = Column(Boolean, default=False)
    schema_metadata = Column(JSON, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="datasets")
    project = relationship("Project", back_populates="datasets")
    cleaning_steps = relationship("CleaningHistory", back_populates="dataset", cascade="all, delete-orphan", order_by="CleaningHistory.created_at")
    queries = relationship("QueryHistory", back_populates="dataset", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="dataset", cascade="all, delete-orphan")

