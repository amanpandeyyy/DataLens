import os
import shutil
import math
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from app.services.data_service import DataService

class CleanService:
    @staticmethod
    def create_snapshot(original_file_path: str) -> str:
        orig_path = Path(original_file_path)
        snapshot_dir = orig_path.parent / ".snapshots"
        snapshot_dir.mkdir(parents=True, exist_ok=True)
        timestamp = int(pd.Timestamp.now().timestamp() * 1000)
        snapshot_file = snapshot_dir / f"{orig_path.stem}_snap_{timestamp}{orig_path.suffix}"
        shutil.copy2(original_file_path, snapshot_file)
        return str(snapshot_file)

    @staticmethod
    def impute_missing(
        df: pd.DataFrame,
        column: str,
        strategy: str,
        constant_value: Optional[Any] = None
    ) -> Tuple[pd.DataFrame, int]:
        if column not in df.columns:
            raise ValueError(f"Column '{column}' not found in dataset")

        initial_rows = len(df)
        null_count_before = int(df[column].isna().sum())

        if strategy == "drop_column":
            df = df.drop(columns=[column])
            return df, null_count_before

        if strategy == "drop_rows":
            df = df.dropna(subset=[column])
            affected = initial_rows - len(df)
            return df, affected

        if strategy == "mean":
            if not pd.api.types.is_numeric_dtype(df[column]):
                raise ValueError("Mean strategy requires a numeric column")
            fill_val = df[column].mean()
            df[column] = df[column].fillna(fill_val)
        elif strategy == "median":
            if not pd.api.types.is_numeric_dtype(df[column]):
                raise ValueError("Median strategy requires a numeric column")
            fill_val = df[column].median()
            df[column] = df[column].fillna(fill_val)
        elif strategy == "mode":
            modes = df[column].mode()
            fill_val = modes[0] if len(modes) > 0 else ""
            df[column] = df[column].fillna(fill_val)
        elif strategy == "ffill":
            df[column] = df[column].ffill()
        elif strategy == "bfill":
            df[column] = df[column].bfill()
        elif strategy == "constant":
            if constant_value is None:
                raise ValueError("Constant strategy requires a constant_value")
            df[column] = df[column].fillna(constant_value)
        else:
            raise ValueError(f"Unknown imputation strategy: {strategy}")

        return df, null_count_before

    @staticmethod
    def remove_duplicates(
        df: pd.DataFrame,
        subset: Optional[List[str]] = None,
        keep: str = "first"
    ) -> Tuple[pd.DataFrame, int]:
        initial_rows = len(df)
        valid_subset = [c for c in subset if c in df.columns] if subset else None
        keep_val = keep if keep in ["first", "last"] else "first"
        df = df.drop_duplicates(subset=valid_subset, keep=keep_val)
        affected = initial_rows - len(df)
        return df, affected

    @staticmethod
    def cast_column_type(df: pd.DataFrame, column: str, target_type: str) -> pd.DataFrame:
        if column not in df.columns:
            raise ValueError(f"Column '{column}' not found in dataset")

        t = target_type.lower()
        if t == "string":
            df[column] = df[column].astype(str)
        elif t == "integer":
            df[column] = pd.to_numeric(df[column], errors="coerce").fillna(0).astype(int)
        elif t == "float":
            df[column] = pd.to_numeric(df[column], errors="coerce").astype(float)
        elif t == "boolean":
            df[column] = df[column].astype(bool)
        elif t in ["date", "datetime"]:
            df[column] = pd.to_datetime(df[column], errors="coerce")
        else:
            raise ValueError(f"Unsupported target type: {target_type}")

        return df

    @staticmethod
    def detect_outliers(
        df: pd.DataFrame,
        column: str,
        method: str = "iqr",
        threshold: float = 1.5
    ) -> Dict[str, Any]:
        if column not in df.columns:
            raise ValueError(f"Column '{column}' not found in dataset")

        series = pd.to_numeric(df[column], errors="coerce").dropna()
        if len(series) == 0:
            return {
                "column": column,
                "method": method,
                "outlier_count": 0,
                "outlier_percentage": 0.0,
                "lower_bound": None,
                "upper_bound": None,
                "sample_outliers": []
            }

        total_valid = len(series)
        outlier_mask = pd.Series(False, index=series.index)
        lower_bound = None
        upper_bound = None

        if method == "iqr":
            q1 = series.quantile(0.25)
            q3 = series.quantile(0.75)
            iqr = q3 - q1
            k = threshold if threshold > 0 else 1.5
            lower_bound = round(float(q1 - (k * iqr)), 4)
            upper_bound = round(float(q3 + (k * iqr)), 4)
            outlier_mask = (series < lower_bound) | (series > upper_bound)

        elif method == "zscore":
            mean = series.mean()
            std = series.std()
            z_thresh = threshold if threshold > 0 else 3.0
            if std > 0:
                z_scores = ((series - mean) / std).abs()
                outlier_mask = z_scores > z_thresh
                lower_bound = round(float(mean - (z_thresh * std)), 4)
                upper_bound = round(float(mean + (z_thresh * std)), 4)

        elif method == "isolation_forest":
            contamination = min(max(float(threshold) if threshold < 0.5 else 0.05, 0.01), 0.25)
            values = series.values.reshape(-1, 1)
            clf = IsolationForest(contamination=contamination, random_state=42)
            preds = clf.fit_predict(values)
            outlier_mask = pd.Series(preds == -1, index=series.index)
            outlier_vals = series[outlier_mask]
            if len(outlier_vals) > 0:
                lower_bound = round(float(outlier_vals.min()), 4)
                upper_bound = round(float(outlier_vals.max()), 4)

        outlier_count = int(outlier_mask.sum())
        outlier_pct = round((outlier_count / total_valid) * 100, 2) if total_valid > 0 else 0.0

        # Sample rows with outliers
        outlier_indices = series[outlier_mask].index[:10]
        sample_rows = []
        for idx in outlier_indices:
            row_data = df.loc[idx].to_dict()
            clean_row = {
                k: (None if pd.isna(v) else (round(v, 2) if isinstance(v, float) else str(v)))
                for k, v in row_data.items()
            }
            sample_rows.append(clean_row)

        return {
            "column": column,
            "method": method,
            "outlier_count": outlier_count,
            "outlier_percentage": outlier_pct,
            "lower_bound": lower_bound,
            "upper_bound": upper_bound,
            "sample_outliers": sample_rows
        }

    @classmethod
    def handle_outliers(
        cls,
        df: pd.DataFrame,
        column: str,
        method: str = "iqr",
        threshold: float = 1.5,
        action: str = "remove"
    ) -> Tuple[pd.DataFrame, int]:
        detection = cls.detect_outliers(df, column, method, threshold)
        outlier_count = detection["outlier_count"]
        if outlier_count == 0:
            return df, 0

        series = pd.to_numeric(df[column], errors="coerce")
        lower = detection["lower_bound"]
        upper = detection["upper_bound"]

        if method in ["iqr", "zscore"] and lower is not None and upper is not None:
            is_outlier = (series < lower) | (series > upper)
        else:
            # Recompute mask for isolation forest
            contamination = min(max(float(threshold) if threshold < 0.5 else 0.05, 0.01), 0.25)
            vals = series.dropna().values.reshape(-1, 1)
            clf = IsolationForest(contamination=contamination, random_state=42)
            preds = clf.fit_predict(vals)
            mask = pd.Series(preds == -1, index=series.dropna().index)
            is_outlier = series.index.isin(mask[mask].index)

        initial_len = len(df)
        if action == "remove":
            df = df[~is_outlier]
            affected = initial_len - len(df)
        elif action == "replace_mean":
            mean_val = df.loc[~is_outlier, column].mean()
            df.loc[is_outlier, column] = mean_val
            affected = outlier_count
        elif action == "replace_median":
            median_val = df.loc[~is_outlier, column].median()
            df.loc[is_outlier, column] = median_val
            affected = outlier_count
        elif action == "clamp":
            if lower is not None and upper is not None:
                df[column] = df[column].clip(lower=lower, upper=upper)
                affected = outlier_count
            else:
                affected = 0
        else:
            raise ValueError(f"Unknown outlier action: {action}")

        return df, affected

