from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class NLToSQLRequest(BaseModel):
    prompt: str

class NLToSQLResponse(BaseModel):
    sql_query: str
    explanation: str

class SQLExecuteRequest(BaseModel):
    query: str
    natural_language_prompt: Optional[str] = None

class SQLExecuteResponse(BaseModel):
    success: bool
    query: str
    execution_time_ms: float
    row_count: int
    column_count: int
    columns: List[Dict[str, Any]]
    rows: List[Dict[str, Any]]
    error: Optional[str] = None

class SQLExplainRequest(BaseModel):
    query: str

class SQLExplainResponse(BaseModel):
    query: str
    explain_plan: str
    summary: str

class QueryHistoryItem(BaseModel):
    id: int
    dataset_id: int
    title: Optional[str]
    natural_language_prompt: Optional[str]
    query_text: str
    execution_time_ms: float
    row_count: int
    status: str
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

