from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ColumnInfo(BaseModel):
    name: str
    dtype: str
    detected_type: str  # numeric, categorical, datetime, boolean, id
    non_null_count: int
    null_count: int
    null_percentage: float
    unique_count: int
    sample_values: List[Any]

class DatasetOverview(BaseModel):
    id: int
    name: str
    original_filename: str
    file_type: str
    row_count: int
    col_count: int
    file_size_bytes: int
    memory_usage_mb: float
    missing_values_count: int
    missing_percentage: float
    duplicate_rows_count: int
    columns: List[ColumnInfo]
    is_sample: bool
    created_at: datetime

    class Config:
        from_attributes = True

class DatasetResponse(BaseModel):
    id: int
    user_id: int
    project_id: Optional[int]
    name: str
    original_filename: str
    file_type: str
    row_count: int
    col_count: int
    file_size_bytes: int
    is_sample: bool
    schema_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DatasetPreviewResponse(BaseModel):
    total_rows: int
    page: int
    page_size: int
    total_pages: int
    columns: List[Dict[str, Any]]
    rows: List[Dict[str, Any]]

