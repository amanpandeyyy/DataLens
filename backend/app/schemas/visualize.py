from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class VisualizeRequest(BaseModel):
    chart_type: str  # bar, line, area, scatter, histogram, box, pie, heatmap
    x_axis: str
    y_axis: Optional[str] = None
    group_by: Optional[str] = None
    aggregation: Optional[str] = "sum"  # sum, avg, count, min, max, median
    sort_by: Optional[str] = "y_desc"  # x_asc, x_desc, y_asc, y_desc
    limit: Optional[int] = 50

class VisualizeResponse(BaseModel):
    chart_type: str
    title: str
    x_label: str
    y_label: str
    data: List[Dict[str, Any]]
    series_keys: List[str]
    metadata: Dict[str, Any]

