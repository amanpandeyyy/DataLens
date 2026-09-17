from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class CleanImputeRequest(BaseModel):
    column: str
    strategy: str  # mean, median, mode, ffill, bfill, drop_rows, drop_column, constant
    constant_value: Optional[Any] = None

class CleanDuplicatesRequest(BaseModel):
    subset: Optional[List[str]] = None
    keep: str = "first"  # first, last

class CleanTypeCastRequest(BaseModel):
    column: str
    target_type: str  # string, integer, float, boolean, date, datetime

class OutlierDetectRequest(BaseModel):
    column: str
    method: str = "iqr"  # iqr, zscore, isolation_forest
    threshold: Optional[float] = 1.5  # 1.5 for IQR, 3.0 for z-score, contamination for isolation_forest

class OutlierActionRequest(BaseModel):
    column: str
    method: str = "iqr"
    threshold: Optional[float] = 1.5
    action: str = "remove"  # remove, replace_mean, replace_median, clamp

class CleanActionResponse(BaseModel):
    success: bool
    message: str
    action_type: str
    rows_before: int
    rows_after: int
    rows_affected: int
    history_id: Optional[int] = None

class OutlierDetectResponse(BaseModel):
    column: str
    method: str
    outlier_count: int
    outlier_percentage: float
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None
    sample_outliers: List[Dict[str, Any]]

