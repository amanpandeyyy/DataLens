from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.dataset import Dataset
from app.models.query_history import QueryHistory
from app.schemas.sql import (
    NLToSQLRequest, NLToSQLResponse,
    SQLExecuteRequest, SQLExecuteResponse,
    SQLExplainRequest, SQLExplainResponse,
    QueryHistoryItem
)
from app.services.data_service import DataService
from app.services.duckdb_service import DuckDBService
from app.services.ai_service import AIService

router = APIRouter(prefix="/sql", tags=["SQL Lab"])

@router.post("/{dataset_id}/generate", response_model=NLToSQLResponse)
def generate_sql_from_nl(
    dataset_id: int,
    req: NLToSQLRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = DataService.load_dataframe(dataset.file_path)
    sql, explanation = AIService.natural_language_to_sql(req.prompt, df)
    return NLToSQLResponse(sql_query=sql, explanation=explanation)

@router.post("/{dataset_id}/execute", response_model=SQLExecuteResponse)
def execute_sql_query(
    dataset_id: int,
    req: SQLExecuteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = DataService.load_dataframe(dataset.file_path)
    res = DuckDBService.execute_query(df, req.query)

    # Save to history
    status = "success" if res["success"] else "error"
    history_item = QueryHistory(
        user_id=current_user.id,
        dataset_id=dataset.id,
        title=req.natural_language_prompt or (req.query.strip().split("\n")[0][:80]),
        natural_language_prompt=req.natural_language_prompt,
        query_text=req.query,
        execution_time_ms=res["execution_time_ms"],
        row_count=res["row_count"],
        status=status,
        error_message=res.get("error")
    )
    db.add(history_item)
    db.commit()

    return SQLExecuteResponse(**res)

@router.post("/{dataset_id}/explain", response_model=SQLExplainResponse)
def explain_sql_query(
    dataset_id: int,
    req: SQLExplainRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = DataService.load_dataframe(dataset.file_path)
    try:
        res = DuckDBService.explain_query(df, req.query)
        return SQLExplainResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{dataset_id}/history", response_model=List[QueryHistoryItem])
def get_query_history(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    history = db.query(QueryHistory).filter(
        QueryHistory.dataset_id == dataset_id,
        QueryHistory.user_id == current_user.id
    ).order_by(QueryHistory.created_at.desc()).limit(20).all()

    return [QueryHistoryItem.model_validate(h) for h in history]

@router.delete("/history/{history_id}")
def delete_query_history(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(QueryHistory).filter(QueryHistory.id == history_id, QueryHistory.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Query history item not found.")
    db.delete(item)
    db.commit()
    return {"success": True, "message": "Query history item deleted."}

