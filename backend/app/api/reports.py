import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.dataset import Dataset
from app.models.report import Report
from app.schemas.report import ReportGenerateRequest, ReportItem, ReportListResponse
from app.services.data_service import DataService
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/{dataset_id}", response_model=ReportItem)
def generate_report(
    dataset_id: int,
    req: ReportGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = DataService.load_dataframe(dataset.file_path)
    fmt = req.format.lower()
    title = req.title or f"Executive Analysis: {dataset.name}"

    if fmt == "pdf":
        file_path, file_size = ReportService.generate_pdf_report(df, dataset.name)
    elif fmt == "xlsx":
        file_path, file_size = ReportService.generate_excel_report(df, dataset.name)
    elif fmt == "csv":
        file_path, file_size = ReportService.generate_csv_report(df, dataset.name)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported report format: {fmt}")

    db_report = Report(
        user_id=current_user.id,
        dataset_id=dataset.id,
        title=title,
        format=fmt,
        file_path=file_path,
        file_size_bytes=file_size,
        summary_json={"format": fmt, "rows": len(df), "cols": len(df.columns)}
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    return ReportItem(
        id=db_report.id,
        dataset_id=db_report.dataset_id,
        title=db_report.title,
        format=db_report.format,
        file_path=db_report.file_path,
        file_size_bytes=db_report.file_size_bytes,
        created_at=db_report.created_at,
        download_url=f"/api/reports/download/{db_report.id}"
    )

@router.get("", response_model=List[ReportItem])
def list_reports(
    dataset_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Report).filter(Report.user_id == current_user.id)
    if dataset_id:
        query = query.filter(Report.dataset_id == dataset_id)
    reports = query.order_by(Report.created_at.desc()).all()

    return [
        ReportItem(
            id=r.id,
            dataset_id=r.dataset_id,
            title=r.title,
            format=r.format,
            file_path=r.file_path,
            file_size_bytes=r.file_size_bytes,
            created_at=r.created_at,
            download_url=f"/api/reports/download/{r.id}"
        )
        for r in reports
    ]

@router.get("/download/{report_id}")
def download_report(
    report_id: int,
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    if not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report file not found on disk.")

    media_types = {
        "pdf": "application/pdf",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "csv": "text/csv"
    }
    media_type = media_types.get(report.format, "application/octet-stream")
    filename = os.path.basename(report.file_path)

    return FileResponse(
        path=report.file_path,
        media_type=media_type,
        filename=filename
    )

@router.delete("/{report_id}")
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).filter(Report.id == report_id, Report.user_id == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    try:
        if os.path.exists(report.file_path):
            os.remove(report.file_path)
    except Exception:
        pass

    db.delete(report)
    db.commit()
    return {"success": True, "message": "Report deleted successfully."}

