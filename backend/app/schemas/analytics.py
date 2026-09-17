from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class NumericStats(BaseModel):
    column: str
    count: int
    mean: float
    std: float
    min: float
    q25: float
    median: float
    q75: float
    max: float
    skewness: float
    kurtosis: float

class CategoricalFrequency(BaseModel):
    value: str
    count: int
    percentage: float

class CategoricalStats(BaseModel):
    column: str
    unique_count: int
    top_value: Optional[str]
    top_frequency: Optional[int]
    frequencies: List[CategoricalFrequency]

class KPICard(BaseModel):
    id: str
    title: str
    value: str
    raw_value: float
    type: str  # currency, count, percentage, average
    subtitle: str
    change_direction: Optional[str] = None  # up, down, neutral

class CorrelationMatrix(BaseModel):
    columns: List[str]
    matrix: List[List[float]]

class AnalyticsOverviewResponse(BaseModel):
    kpis: List[KPICard]
    numeric_stats: List[NumericStats]
    categorical_stats: List[CategoricalStats]
    correlations: Optional[CorrelationMatrix] = None
    data_quality_score: float
    summary_badges: Dict[str, Any]

