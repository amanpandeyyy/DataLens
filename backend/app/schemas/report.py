from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ReportGenerateRequest(BaseModel):
    title: Optional[str] = None
    format: str = "pdf"  # pdf, xlsx, csv
    include_ai_insights: bool = True
    include_visuals: bool = True
    include_statistics: bool = True
    include_data_sample: bool = True

class ReportItem(BaseModel):
    id: int
    dataset_id: int
    title: str
    format: str
    file_path: str
    file_size_bytes: int
    created_at: datetime
    download_url: str

    class Config:
        from_attributes = True

class ReportListResponse(BaseModel):
    reports: List[ReportItem]

