import io
import os
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
import pandas as pd
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.dataset import Dataset
from app.models.cleaning_history import CleaningHistory
from app.schemas.clean import (
    CleanImputeRequest, CleanDuplicatesRequest, CleanTypeCastRequest,
    OutlierDetectRequest, OutlierActionRequest, CleanActionResponse, OutlierDetectResponse
)
from app.services.data_service import DataService
from app.services.clean_service import CleanService

router = APIRouter(prefix="/clean", tags=["Data Cleaning"])

@router.get("/{dataset_id}/quality")
def get_data_quality(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = DataService.load_dataframe(dataset.file_path)
    total_rows = len(df)
    total_cells = total_rows * len(df.columns)
    missing_cells = int(df.isna().sum().sum())
    duplicate_rows = int(df.duplicated().sum())

    missing_cols = []
    for col in df.columns:
        null_count = int(df[col].isna().sum())
        if null_count > 0:
            missing_cols.append({
                "column": str(col),
                "null_count": null_count,
                "null_percentage": round((null_count / total_rows) * 100, 2) if total_rows > 0 else 0.0,
                "dtype": str(df[col].dtype)
            })

    # Overall score out of 100
    missing_penalty = min(50, (missing_cells / max(total_cells, 1)) * 100 * 2)
    dup_penalty = min(30, (duplicate_rows / max(total_rows, 1)) * 100 * 1.5)
    quality_score = max(0, round(100 - missing_penalty - dup_penalty, 1))

    history = db.query(CleaningHistory).filter(CleaningHistory.dataset_id == dataset_id).order_by(CleaningHistory.created_at.desc()).all()

    return {
        "dataset_id": dataset.id,
        "quality_score": quality_score,
        "total_rows": total_rows,
        "total_columns": len(df.columns),
        "total_missing_cells": missing_cells,
        "missing_columns": missing_cols,
        "duplicate_rows_count": duplicate_rows,
        "history_count": len(history),
        "recent_history": [
            {
                "id": h.id,
                "action_type": h.action_type,
                "description": h.description,
                "rows_before": h.rows_before,
                "rows_after": h.rows_after,
                "created_at": h.created_at
            }
            for h in history[:5]
        ]
    }

@router.post("/{dataset_id}/impute", response_model=CleanActionResponse)
def impute_missing_values(
    dataset_id: int,
    req: CleanImputeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    snapshot_path = CleanService.create_snapshot(dataset.file_path)
    df = DataService.load_dataframe(dataset.file_path)
    rows_before = len(df)

    try:
        df_cleaned, affected = CleanService.impute_missing(
            df,
            column=req.column,
            strategy=req.strategy,
            constant_value=req.constant_value
        )
        DataService.save_dataframe(df_cleaned, dataset.file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Imputation failed: {str(e)}")

    rows_after = len(df_cleaned)
    dataset.row_count = rows_after
    dataset.col_count = len(df_cleaned.columns)
    dataset.schema_metadata = DataService.get_dataset_metadata(df_cleaned)

    history = CleaningHistory(
        dataset_id=dataset.id,
        action_type="impute",
        description=f"Applied strategy '{req.strategy}' on column '{req.column}'",
        parameters=req.dict(),
        rows_before=rows_before,
        rows_after=rows_after,
        snapshot_path=snapshot_path
    )
    db.add(history)
    db.commit()
    db.refresh(history)

    return CleanActionResponse(
        success=True,
        message=f"Successfully applied {req.strategy} imputation on {req.column}.",
        action_type="impute",
        rows_before=rows_before,
        rows_after=rows_after,
        rows_affected=affected,
        history_id=history.id
    )

@router.post("/{dataset_id}/duplicates", response_model=CleanActionResponse)
def remove_duplicates(
    dataset_id: int,
    req: CleanDuplicatesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    snapshot_path = CleanService.create_snapshot(dataset.file_path)
    df = DataService.load_dataframe(dataset.file_path)
    rows_before = len(df)

    df_cleaned, affected = CleanService.remove_duplicates(df, subset=req.subset, keep=req.keep)
    DataService.save_dataframe(df_cleaned, dataset.file_path)

    rows_after = len(df_cleaned)
    dataset.row_count = rows_after
    dataset.schema_metadata = DataService.get_dataset_metadata(df_cleaned)

    history = CleaningHistory(
        dataset_id=dataset.id,
        action_type="remove_duplicates",
        description=f"Removed {affected} duplicate rows (keep='{req.keep}')",
        parameters=req.dict(),
        rows_before=rows_before,
        rows_after=rows_after,
        snapshot_path=snapshot_path
    )
    db.add(history)
    db.commit()
    db.refresh(history)

    return CleanActionResponse(
        success=True,
        message=f"Removed {affected} duplicate rows.",
        action_type="remove_duplicates",
        rows_before=rows_before,
        rows_after=rows_after,
        rows_affected=affected,
        history_id=history.id
    )

@router.post("/{dataset_id}/typecast", response_model=CleanActionResponse)
def cast_column_type(
    dataset_id: int,
    req: CleanTypeCastRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    snapshot_path = CleanService.create_snapshot(dataset.file_path)
    df = DataService.load_dataframe(dataset.file_path)
    rows_before = len(df)

    try:
        df_cleaned = CleanService.cast_column_type(df, column=req.column, target_type=req.target_type)
        DataService.save_dataframe(df_cleaned, dataset.file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Type cast failed: {str(e)}")

    dataset.schema_metadata = DataService.get_dataset_metadata(df_cleaned)

    history = CleaningHistory(
        dataset_id=dataset.id,
        action_type="cast_type",
        description=f"Cast column '{req.column}' to {req.target_type}",
        parameters=req.dict(),
        rows_before=rows_before,
        rows_after=rows_before,
        snapshot_path=snapshot_path
    )
    db.add(history)
    db.commit()
    db.refresh(history)

    return CleanActionResponse(
        success=True,
        message=f"Converted {req.column} to {req.target_type}.",
        action_type="cast_type",
        rows_before=rows_before,
        rows_after=rows_before,
        rows_affected=rows_before,
        history_id=history.id
    )

@router.post("/{dataset_id}/outliers/detect", response_model=OutlierDetectResponse)
def detect_outliers(
    dataset_id: int,
    req: OutlierDetectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = DataService.load_dataframe(dataset.file_path)
    try:
        res = CleanService.detect_outliers(df, column=req.column, method=req.method, threshold=req.threshold or 1.5)
        return OutlierDetectResponse(**res)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Outlier detection failed: {str(e)}")

@router.post("/{dataset_id}/outliers/handle", response_model=CleanActionResponse)
def handle_outliers(
    dataset_id: int,
    req: OutlierActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    snapshot_path = CleanService.create_snapshot(dataset.file_path)
    df = DataService.load_dataframe(dataset.file_path)
    rows_before = len(df)

    try:
        df_cleaned, affected = CleanService.handle_outliers(
            df,
            column=req.column,
            method=req.method,
            threshold=req.threshold or 1.5,
            action=req.action
        )
        DataService.save_dataframe(df_cleaned, dataset.file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Outlier action failed: {str(e)}")

    rows_after = len(df_cleaned)
    dataset.row_count = rows_after
    dataset.schema_metadata = DataService.get_dataset_metadata(df_cleaned)

    history = CleaningHistory(
        dataset_id=dataset.id,
        action_type="outlier_remediation",
        description=f"Outlier action '{req.action}' on '{req.column}' ({affected} rows affected)",
        parameters=req.dict(),
        rows_before=rows_before,
        rows_after=rows_after,
        snapshot_path=snapshot_path
    )
    db.add(history)
    db.commit()
    db.refresh(history)

    return CleanActionResponse(
        success=True,
        message=f"Outlier remediation applied ({req.action}). {affected} rows affected.",
        action_type="outlier_remediation",
        rows_before=rows_before,
        rows_after=rows_after,
        rows_affected=affected,
        history_id=history.id
    )

@router.post("/{dataset_id}/undo", response_model=CleanActionResponse)
def undo_cleaning_action(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    last_step = db.query(CleaningHistory).filter(CleaningHistory.dataset_id == dataset_id).order_by(CleaningHistory.created_at.desc()).first()
    if not last_step or not last_step.snapshot_path:
        raise HTTPException(status_code=400, detail="No previous cleaning actions to undo.")

    # Revert file to snapshot
    import shutil
    shutil.copy2(last_step.snapshot_path, dataset.file_path)

    df_restored = DataService.load_dataframe(dataset.file_path)
    dataset.row_count = len(df_restored)
    dataset.col_count = len(df_restored.columns)
    dataset.schema_metadata = DataService.get_dataset_metadata(df_restored)

    db.delete(last_step)
    db.commit()

    return CleanActionResponse(
        success=True,
        message=f"Successfully undid: {last_step.description}",
        action_type="undo",
        rows_before=last_step.rows_after,
        rows_after=len(df_restored),
        rows_affected=abs(last_step.rows_after - len(df_restored))
    )

@router.get("/{dataset_id}/download")
def download_cleaned_dataset(
    dataset_id: int,
    format: str = Query("csv", regex="^(csv|xlsx|excel|json)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    if not os.path.exists(dataset.file_path):
        raise HTTPException(status_code=404, detail="Dataset file not found on disk.")

    df = DataService.load_dataframe(dataset.file_path)
    clean_stem = "".join([c if c.isalnum() or c in "-_" else "_" for c in Path(dataset.name).stem])
    fmt = format.lower().strip()

    if fmt == "csv":
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)
        return StreamingResponse(
            iter([csv_buffer.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="cleaned_{clean_stem}.csv"'}
        )
    elif fmt in ("xlsx", "excel"):
        excel_buffer = io.BytesIO()
        with pd.ExcelWriter(excel_buffer, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Cleaned Data")
        excel_buffer.seek(0)
        return StreamingResponse(
            excel_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="cleaned_{clean_stem}.xlsx"'}
        )
    elif fmt == "json":
        json_str = df.to_json(orient="records", indent=2)
        return StreamingResponse(
            iter([json_str]),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="cleaned_{clean_stem}.json"'}
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {fmt}")


