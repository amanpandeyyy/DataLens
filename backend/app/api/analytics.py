import math
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.dataset import Dataset
from app.schemas.analytics import (
    AnalyticsOverviewResponse, KPICard, NumericStats, CategoricalStats,
    CategoricalFrequency, CorrelationMatrix
)
from app.services.data_service import DataService

router = APIRouter(prefix="/analytics", tags=["Analytics & Statistics"])

@router.get("/{dataset_id}/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_overview(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = DataService.load_dataframe(dataset.file_path)
    total_rows = len(df)
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = [c for c in df.columns if c not in num_cols]

    # Dynamic KPI computation
    kpis = []
    # 1. Primary volume/revenue KPI
    rev_col = next((c for c in num_cols if any(k in c.lower() for k in ["rev", "sale", "amount", "total", "price"])), None)
    if rev_col:
        total_rev = float(df[rev_col].sum())
        avg_rev = float(df[rev_col].mean())
        kpis.append(KPICard(
            id="kpi-1",
            title=f"Total {rev_col.replace('_', ' ').title()}",
            value=f"₹{total_rev/1_000_000:.2f}M" if total_rev >= 1_000_000 else f"₹{total_rev/1_000:.1f}K",
            raw_value=total_rev,
            type="currency",
            subtitle="Aggregated across active records",
            change_direction="up"
        ))
        kpis.append(KPICard(
            id="kpi-2",
            title=f"Avg {rev_col.replace('_', ' ').title()}",
            value=f"₹{avg_rev:,.2f}",
            raw_value=avg_rev,
            type="currency",
            subtitle="Average per transaction",
            change_direction="neutral"
        ))

    # 2. Profit KPI if present
    prof_col = next((c for c in num_cols if "profit" in c.lower()), None)
    if prof_col:
        total_prof = float(df[prof_col].sum())
        margin = round((total_prof / total_rev * 100), 1) if (rev_col and total_rev > 0) else 0.0
        kpis.append(KPICard(
            id="kpi-3",
            title="Total Operating Profit",
            value=f"₹{total_prof/1_000_000:.2f}M" if total_prof >= 1_000_000 else f"₹{total_prof/1_000:.1f}K",
            raw_value=total_prof,
            type="currency",
            subtitle=f"{margin}% net profit margin",
            change_direction="up" if margin > 15 else "down"
        ))

    # 3. Order / Row count KPI
    kpis.append(KPICard(
        id="kpi-4",
        title="Total Records / Orders",
        value=f"{total_rows:,}",
        raw_value=float(total_rows),
        type="count",
        subtitle=f"{len(df.columns)} tracked attributes",
        change_direction="neutral"
    ))

    # 4. Unique customer / category KPI
    entity_col = next((c for c in cat_cols if any(k in c.lower() for k in ["cust", "client", "user", "city", "prod"])), None)
    if entity_col:
        u_count = int(df[entity_col].nunique())
        kpis.append(KPICard(
            id="kpi-5",
            title=f"Unique {entity_col.replace('_', ' ').title()}s",
            value=f"{u_count:,}",
            raw_value=float(u_count),
            type="count",
            subtitle=f"Active in dataset cohort",
            change_direction="neutral"
        ))

    # Numerical Statistics
    numeric_stats = []
    for col in num_cols:
        s = df[col].dropna()
        if len(s) == 0:
            continue
        q25 = float(s.quantile(0.25))
        q75 = float(s.quantile(0.75))
        numeric_stats.append(NumericStats(
            column=str(col),
            count=int(len(s)),
            mean=round(float(s.mean()), 2),
            std=round(float(s.std()), 2) if len(s) > 1 else 0.0,
            min=round(float(s.min()), 2),
            q25=round(q25, 2),
            median=round(float(s.median()), 2),
            q75=round(q75, 2),
            max=round(float(s.max()), 2),
            skewness=round(float(s.skew()), 2) if len(s) > 2 else 0.0,
            kurtosis=round(float(s.kurtosis()), 2) if len(s) > 3 else 0.0
        ))

    # Categorical Statistics
    categorical_stats = []
    for col in cat_cols:
        s = df[col].dropna().astype(str)
        if len(s) == 0:
            continue
        u_cnt = int(s.nunique())
        if u_cnt > 100 and len(s) > 500:
            continue  # Skip high-cardinality unique IDs
        vc = s.value_counts().head(8)
        top_val = str(vc.index[0]) if len(vc) > 0 else None
        top_freq = int(vc.iloc[0]) if len(vc) > 0 else None

        freqs = [
            CategoricalFrequency(
                value=str(k),
                count=int(v),
                percentage=round((v / len(s)) * 100, 1)
            )
            for k, v in vc.items()
        ]
        categorical_stats.append(CategoricalStats(
            column=str(col),
            unique_count=u_cnt,
            top_value=top_val,
            top_frequency=top_freq,
            frequencies=freqs
        ))

    # Correlation Matrix
    correlations = None
    if len(num_cols) >= 2:
        corr_sub = df[num_cols].dropna()
        if len(corr_sub) > 1:
            corr_df = corr_sub.corr().round(2)
            # Replace NaNs
            corr_df = corr_df.fillna(0.0)
            correlations = CorrelationMatrix(
                columns=[str(c) for c in corr_df.columns],
                matrix=corr_df.values.tolist()
            )

    # Summary Badges
    missing_cnt = int(df.isna().sum().sum())
    dup_cnt = int(df.duplicated().sum())
    total_cells = total_rows * len(df.columns)
    quality_score = max(0, round(100 - (missing_cnt / max(total_cells, 1) * 200) - (dup_cnt / max(total_rows, 1) * 100), 1))

    return AnalyticsOverviewResponse(
        kpis=kpis,
        numeric_stats=numeric_stats,
        categorical_stats=categorical_stats,
        correlations=correlations,
        data_quality_score=quality_score,
        summary_badges={
            "row_count": total_rows,
            "col_count": len(df.columns),
            "missing_cells": missing_cnt,
            "duplicate_rows": dup_cnt,
            "numeric_columns_count": len(num_cols),
            "categorical_columns_count": len(cat_cols)
        }
    )

