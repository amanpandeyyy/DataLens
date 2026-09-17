from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class KeyInsight(BaseModel):
    id: str
    title: str
    category: str  # revenue, performance, trend, risk, efficiency
    description: str
    metric: Optional[str] = None
    impact: str  # high, medium, positive, negative

class AnomalyFinding(BaseModel):
    column: str
    entity: str
    anomaly_type: str  # spike, drop, outlier, unusual_pattern
    detail: str
    severity: str  # high, medium, low

class Recommendation(BaseModel):
    title: str
    action: str
    expected_outcome: str
    priority: str  # high, medium, low

class AIAnalysisResponse(BaseModel):
    executive_summary: str
    key_insights: List[KeyInsight]
    anomalies: List[AnomalyFinding]
    recommendations: List[Recommendation]
    mode: str  # "demo_heuristic" or "llm_generated"
    model_used: str

class ChatMessage(BaseModel):
    role: str  # user, assistant, system
    content: str
    chart_spec: Optional[Dict[str, Any]] = None
    sql_query: Optional[str] = None
    execution_time_ms: Optional[float] = None
    data_table: Optional[List[Dict[str, Any]]] = None

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, Any]]] = []

class ChatResponse(BaseModel):
    response: str
    sql_query: Optional[str] = None
    execution_time_ms: Optional[float] = None
    chart_spec: Optional[Dict[str, Any]] = None
    data_table: Optional[List[Dict[str, Any]]] = None
    row_count: Optional[int] = None

