from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base

class CleaningHistory(Base):
    __tablename__ = "cleaning_history"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    action_type = Column(String(100), nullable=False)  # impute, drop_na, remove_duplicates, cast_type, outlier_removal, outlier_impute
    description = Column(String(500), nullable=False)
    parameters = Column(JSON, default=dict)
    rows_before = Column(Integer, default=0)
    rows_after = Column(Integer, default=0)
    snapshot_path = Column(String(1000), nullable=True)  # Snapshot file path for undo
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="cleaning_steps")

