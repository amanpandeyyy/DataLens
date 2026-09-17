from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.dataset import Dataset
from app.schemas.ai import AIAnalysisResponse, ChatRequest, ChatResponse
from app.services.data_service import DataService
from app.services.ai_service import AIService
from app.core.config import settings

router = APIRouter(prefix="/ai", tags=["AI Analyst & Chat"])

class AIConfigRequest(BaseModel):
    provider: str  # demo, openai, anthropic, groq, ollama
    api_key: Optional[str] = None
    model: Optional[str] = "gpt-4o-mini"
    base_url: Optional[str] = None

@router.get("/provider-info")
def get_provider_info():
    return AIService.get_provider_info()

@router.post("/configure")
def configure_provider(req: AIConfigRequest):
    settings.AI_PROVIDER = req.provider.lower()
    if req.api_key is not None:
        settings.AI_API_KEY = req.api_key.strip()
    if req.model:
        settings.AI_MODEL = req.model.strip()
    if req.base_url:
        settings.AI_BASE_URL = req.base_url.strip()
    return {"success": True, "provider_info": AIService.get_provider_info()}

@router.post("/{dataset_id}/analyze", response_model=AIAnalysisResponse)
def analyze_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = DataService.load_dataframe(dataset.file_path)
    # Generate insights via robust heuristic engine (or LLM when key configured)
    analysis = AIService.generate_heuristic_analysis(df, dataset.name)
    return AIAnalysisResponse(**analysis)

@router.post("/{dataset_id}/chat", response_model=ChatResponse)
def chat_with_data(
    dataset_id: int,
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = DataService.load_dataframe(dataset.file_path)
    result = AIService.chat_with_data(
        message=req.message,
        df=df,
        conversation_history=req.conversation_history or []
    )
    return ChatResponse(**result)

