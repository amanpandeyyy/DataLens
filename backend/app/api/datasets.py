import os
import shutil
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.dataset import Dataset
from app.schemas.dataset import DatasetResponse, DatasetOverview, DatasetPreviewResponse
from app.services.data_service import DataService
from app.core.config import settings

router = APIRouter(prefix="/datasets", tags=["Datasets"])

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".json"}

@router.get("", response_model=List[DatasetResponse])
def list_datasets(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Dataset).filter(Dataset.user_id == current_user.id)
    if project_id:
        query = query.filter(Dataset.project_id == project_id)
    datasets = query.order_by(Dataset.created_at.desc()).all()
    return [DatasetResponse.model_validate(d) for d in datasets]

@router.post("/upload", response_model=DatasetOverview)
async def upload_dataset(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    project_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    orig_name = file.filename or "dataset.csv"
    ext = Path(orig_name).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Please upload CSV, XLSX, or JSON."
        )

    # Safe unique filename
    unique_id = uuid.uuid4().hex[:8]
    safe_stem = "".join([c if c.isalnum() or c in "-_" else "_" for c in Path(orig_name).stem])
    target_filename = f"{unique_id}_{safe_stem}{ext}"
    target_path = settings.UPLOAD_DIR / target_filename

    # Save uploaded file
    file_bytes = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    with open(target_path, "wb") as f:
        f.write(file_bytes)

    # Parse and extract metadata
    try:
        df = DataService.load_dataframe(str(target_path))
        if len(df) == 0:
            os.remove(target_path)
            raise HTTPException(status_code=400, detail="Uploaded dataset contains no data rows.")

        meta = DataService.get_dataset_metadata(df)
    except Exception as e:
        if target_path.exists():
            os.remove(target_path)
        raise HTTPException(status_code=400, detail=f"Failed to parse dataset: {str(e)}")

    dataset_name = name or Path(orig_name).stem.replace("_", " ").title()
    file_type = ext.replace(".", "")

    db_dataset = Dataset(
        user_id=current_user.id,
        project_id=project_id,
        name=dataset_name,
        original_filename=orig_name,
        file_type=file_type,
        file_path=str(target_path),
        row_count=meta["row_count"],
        col_count=meta["col_count"],
        file_size_bytes=len(file_bytes),
        is_sample=False,
        schema_metadata=meta
    )
    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)

    return DatasetOverview(
        id=db_dataset.id,
        name=db_dataset.name,
        original_filename=db_dataset.original_filename,
        file_type=db_dataset.file_type,
        row_count=meta["row_count"],
        col_count=meta["col_count"],
        file_size_bytes=len(file_bytes),
        memory_usage_mb=meta["memory_usage_mb"],
        missing_values_count=meta["missing_values_count"],
        missing_percentage=meta["missing_percentage"],
        duplicate_rows_count=meta["duplicate_rows_count"],
        columns=meta["columns"],
        is_sample=False,
        created_at=db_dataset.created_at
    )

@router.post("/sample", response_model=DatasetOverview)
def load_sample_dataset(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sample_source = settings.SAMPLE_DIR / "sales_sample.csv"
    if not sample_source.exists():
        raise HTTPException(status_code=500, detail="Sample dataset file is not available on server.")

    # Copy to user uploads directory
    unique_id = uuid.uuid4().hex[:8]
    target_filename = f"{unique_id}_sales_sample.csv"
    target_path = settings.UPLOAD_DIR / target_filename
    shutil.copy2(sample_source, target_path)

    df = DataService.load_dataframe(str(target_path))
    meta = DataService.get_dataset_metadata(df)
    file_size = os.path.getsize(target_path)

    # Attach to user's first project if available
    first_proj = db.query(Project).filter(Project.user_id == current_user.id).first()

    db_dataset = Dataset(
        user_id=current_user.id,
        project_id=first_proj.id if first_proj else None,
        name="Enterprise Sales Sample (2026)",
        original_filename="sales_sample.csv",
        file_type="csv",
        file_path=str(target_path),
        row_count=meta["row_count"],
        col_count=meta["col_count"],
        file_size_bytes=file_size,
        is_sample=True,
        schema_metadata=meta
    )
    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)

    return DatasetOverview(
        id=db_dataset.id,
        name=db_dataset.name,
        original_filename=db_dataset.original_filename,
        file_type=db_dataset.file_type,
        row_count=meta["row_count"],
        col_count=meta["col_count"],
        file_size_bytes=file_size,
        memory_usage_mb=meta["memory_usage_mb"],
        missing_values_count=meta["missing_values_count"],
        missing_percentage=meta["missing_percentage"],
        duplicate_rows_count=meta["duplicate_rows_count"],
        columns=meta["columns"],
        is_sample=True,
        created_at=db_dataset.created_at
    )

@router.get("/{dataset_id}", response_model=DatasetOverview)
def get_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = DataService.load_dataframe(dataset.file_path)
    meta = DataService.get_dataset_metadata(df)

    return DatasetOverview(
        id=dataset.id,
        name=dataset.name,
        original_filename=dataset.original_filename,
        file_type=dataset.file_type,
        row_count=len(df),
        col_count=len(df.columns),
        file_size_bytes=dataset.file_size_bytes,
        memory_usage_mb=meta["memory_usage_mb"],
        missing_values_count=meta["missing_values_count"],
        missing_percentage=meta["missing_percentage"],
        duplicate_rows_count=meta["duplicate_rows_count"],
        columns=meta["columns"],
        is_sample=dataset.is_sample,
        created_at=dataset.created_at
    )

@router.get("/{dataset_id}/preview", response_model=DatasetPreviewResponse)
def get_dataset_preview(
    dataset_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=5, le=200),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None),
    sort_desc: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = DataService.load_dataframe(dataset.file_path)
    preview = DataService.get_preview(df, page=page, page_size=page_size, search=search, sort_by=sort_by, sort_desc=sort_desc)
    return DatasetPreviewResponse(**preview)

@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    try:
        if os.path.exists(dataset.file_path):
            os.remove(dataset.file_path)
    except Exception:
        pass

    db.delete(dataset)
    db.commit()
    return {"success": True, "message": "Dataset deleted successfully."}

