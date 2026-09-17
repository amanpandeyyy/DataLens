import math
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.dataset import Dataset
from app.schemas.visualize import VisualizeRequest, VisualizeResponse
from app.services.data_service import DataService

router = APIRouter(prefix="/visualize", tags=["Visualization Builder"])

@router.post("/{dataset_id}", response_model=VisualizeResponse)
def generate_chart_data(
    dataset_id: int,
    req: VisualizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == current_user.id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    df = DataService.load_dataframe(dataset.file_path)

    if req.x_axis not in df.columns:
        raise HTTPException(status_code=400, detail=f"X-Axis column '{req.x_axis}' not found.")
    if req.y_axis and req.y_axis not in df.columns:
        raise HTTPException(status_code=400, detail=f"Y-Axis column '{req.y_axis}' not found.")

    chart_type = req.chart_type.lower()
    x_col = req.x_axis
    y_col = req.y_axis
    group_col = req.group_by if req.group_by in df.columns else None
    agg = (req.aggregation or "sum").lower()
    limit = min(req.limit or 50, 100)

    # 1. Scatter plot
    if chart_type == "scatter":
        if not y_col:
            raise HTTPException(status_code=400, detail="Scatter plot requires both X and Y axes.")
        sub = df[[x_col, y_col] + ([group_col] if group_col else [])].dropna().head(300)
        data = []
        for _, row in sub.iterrows():
            item = {
                x_col: float(row[x_col]) if isinstance(row[x_col], (int, float, np.number)) else str(row[x_col]),
                y_col: float(row[y_col]) if isinstance(row[y_col], (int, float, np.number)) else str(row[y_col])
            }
            if group_col:
                item[group_col] = str(row[group_col])
            data.append(item)
        return VisualizeResponse(
            chart_type="scatter",
            title=f"{y_col} vs {x_col}",
            x_label=x_col.replace('_', ' ').title(),
            y_label=y_col.replace('_', ' ').title(),
            data=data,
            series_keys=[y_col],
            metadata={"total_points": len(data)}
        )

    # 2. Histogram
    if chart_type == "histogram":
        s = pd.to_numeric(df[x_col], errors="coerce").dropna()
        counts, bin_edges = np.histogram(s, bins=min(20, max(5, int(math.sqrt(len(s))))))
        data = []
        for i in range(len(counts)):
            label = f"{round(bin_edges[i], 1)} - {round(bin_edges[i+1], 1)}"
            data.append({"bin": label, "count": int(counts[i])})
        return VisualizeResponse(
            chart_type="histogram",
            title=f"Distribution of {x_col}",
            x_label="Bin Range",
            y_label="Frequency",
            data=data,
            series_keys=["count"],
            metadata={"bin_count": len(data)}
        )

    # 3. Box plot
    if chart_type == "box":
        target_y = y_col or x_col
        if not pd.api.types.is_numeric_dtype(df[target_y]):
            raise HTTPException(status_code=400, detail=f"Column '{target_y}' must be numeric for box plot.")
        grp_col = x_col if x_col != target_y else (group_col or x_col)
        data = []
        for grp_val, sub_df in df.groupby(grp_col):
            s = pd.to_numeric(sub_df[target_y], errors="coerce").dropna()
            if len(s) > 0:
                q1 = float(s.quantile(0.25))
                q3 = float(s.quantile(0.75))
                iqr = q3 - q1
                data.append({
                    "category": str(grp_val),
                    "min": round(float(max(s.min(), q1 - 1.5 * iqr)), 2),
                    "q1": round(q1, 2),
                    "median": round(float(s.median()), 2),
                    "q3": round(q3, 2),
                    "max": round(float(min(s.max(), q3 + 1.5 * iqr)), 2)
                })
        data = data[:limit]
        return VisualizeResponse(
            chart_type="box",
            title=f"Box Plot: {target_y} by {grp_col}",
            x_label=str(grp_col).replace('_', ' ').title(),
            y_label=str(target_y).replace('_', ' ').title(),
            data=data,
            series_keys=["min", "q1", "median", "q3", "max"],
            metadata={"groups_count": len(data)}
        )

    # 4. Standard Aggregations (Bar, Line, Area, Pie)
    agg_map = {
        "sum": "sum",
        "avg": "mean",
        "mean": "mean",
        "count": "count",
        "min": "min",
        "max": "max",
        "median": "median"
    }
    agg_func = agg_map.get(agg, "sum")

    # If date column on X, parse and format
    working_df = df.copy()
    if any(k in x_col.lower() for k in ["date", "time", "created"]):
        try:
            working_df[x_col] = pd.to_datetime(working_df[x_col], errors="coerce").dt.strftime("%Y-%m")
        except Exception:
            pass

    if not y_col:
        # Count aggregation
        grouped = working_df.groupby(x_col).size().reset_index(name="count")
        y_col = "count"
    elif group_col:
        # Pivot table for multi-series charts
        piv = working_df.pivot_table(index=x_col, columns=group_col, values=y_col, aggfunc=agg_func, fill_value=0)
        piv = piv.reset_index()
        series_keys = [str(c) for c in piv.columns if c != x_col]
        data = piv.head(limit).to_dict(orient="records")
        return VisualizeResponse(
            chart_type=chart_type,
            title=f"{agg.upper()} of {y_col} by {x_col} (grouped by {group_col})",
            x_label=x_col.replace('_', ' ').title(),
            y_label=y_col.replace('_', ' ').title(),
            data=data,
            series_keys=series_keys,
            metadata={"series_count": len(series_keys)}
        )
    else:
        grouped = working_df.groupby(x_col)[y_col].agg(agg_func).reset_index()

    # Sorting
    sort_mode = req.sort_by or "y_desc"
    if sort_mode == "y_desc":
        grouped = grouped.sort_values(by=y_col, ascending=False)
    elif sort_mode == "y_asc":
        grouped = grouped.sort_values(by=y_col, ascending=True)
    elif sort_mode == "x_asc":
        grouped = grouped.sort_values(by=x_col, ascending=True)
    elif sort_mode == "x_desc":
        grouped = grouped.sort_values(by=x_col, ascending=False)

    grouped = grouped.head(limit)

    # Format points
    clean_data = []
    for _, row in grouped.iterrows():
        val = row[y_col]
        val_clean = round(float(val), 2) if isinstance(val, (float, np.floating, int, np.integer)) else val
        clean_data.append({
            x_col: str(row[x_col]),
            y_col: val_clean
        })

    title = f"{agg.upper()} of {y_col.replace('_', ' ').title()} by {x_col.replace('_', ' ').title()}"
    return VisualizeResponse(
        chart_type=chart_type,
        title=title,
        x_label=x_col.replace('_', ' ').title(),
        y_label=y_col.replace('_', ' ').title(),
        data=clean_data,
        series_keys=[y_col],
        metadata={"row_count": len(clean_data), "aggregation": agg}
    )

