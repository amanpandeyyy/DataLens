import os
import math
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np

class DataService:
    @staticmethod
    def load_dataframe(file_path: str) -> pd.DataFrame:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        suffix = path.suffix.lower()
        if suffix == ".csv":
            try:
                df = pd.read_csv(file_path, encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(file_path, encoding="latin1")
        elif suffix in [".xlsx", ".xls"]:
            df = pd.read_excel(file_path)
        elif suffix == ".json":
            try:
                df = pd.read_json(file_path)
            except ValueError:
                df = pd.read_json(file_path, lines=True)
        else:
            raise ValueError(f"Unsupported file format: {suffix}")

        return df

    @staticmethod
    def save_dataframe(df: pd.DataFrame, file_path: str) -> None:
        path = Path(file_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        suffix = path.suffix.lower()

        if suffix == ".csv":
            df.to_csv(file_path, index=False)
        elif suffix in [".xlsx", ".xls"]:
            df.to_excel(file_path, index=False)
        elif suffix == ".json":
            df.to_json(file_path, orient="records", date_format="iso")
        else:
            df.to_csv(file_path, index=False)

    @staticmethod
    def detect_column_type(series: pd.Series) -> str:
        name = str(series.name).lower()
        if any(id_word in name for id_word in ["_id", "id", "uuid", "guid", "code"]) and series.nunique() > 0.8 * len(series):
            return "id"

        if pd.api.types.is_bool_dtype(series):
            return "boolean"
        elif pd.api.types.is_numeric_dtype(series):
            return "numeric"
        elif pd.api.types.is_datetime64_any_dtype(series):
            return "datetime"
        else:
            sample = series.dropna().head(20).astype(str)
            # Check if string could be parsed as datetime
            if any(date_word in name for date_word in ["date", "time", "created", "updated", "day", "month", "year"]):
                if len(sample) > 0:
                    try:
                        pd.to_datetime(sample, errors="raise", format="mixed")
                        return "datetime"
                    except Exception:
                        pass

            # Check if boolean strings
            if len(sample) > 0:
                unique_vals = set(sample.str.lower().unique())
                if unique_vals.issubset({"true", "false", "yes", "no", "1", "0"}):
                    return "boolean"

            if series.nunique() <= 30 or (len(series) > 0 and (series.nunique() / len(series)) < 0.2):
                return "categorical"

            return "text"

    @classmethod
    def get_dataset_metadata(cls, df: pd.DataFrame) -> Dict[str, Any]:
        row_count = len(df)
        col_count = len(df.columns)
        memory_usage_mb = round(df.memory_usage(deep=True).sum() / (1024 * 1024), 2)
        missing_count = int(df.isna().sum().sum())
        missing_pct = round((missing_count / (row_count * col_count * 1.0)) * 100, 2) if (row_count * col_count) > 0 else 0.0
        duplicate_count = int(df.duplicated().sum())

        columns_info = []
        for col in df.columns:
            series = df[col]
            detected_type = cls.detect_column_type(series)
            null_cnt = int(series.isna().sum())
            null_percentage = round((null_cnt / row_count) * 100, 2) if row_count > 0 else 0.0
            unique_cnt = int(series.nunique())

            # Grab clean sample values
            non_nulls = series.dropna().head(5).tolist()
            sample_vals = []
            for val in non_nulls:
                if isinstance(val, (np.floating, float)):
                    if math.isnan(val) or math.isinf(val):
                        sample_vals.append(None)
                    else:
                        sample_vals.append(round(val, 2))
                elif isinstance(val, (pd.Timestamp, np.datetime64)):
                    sample_vals.append(str(val))
                elif isinstance(val, (np.integer, int)):
                    sample_vals.append(int(val))
                else:
                    sample_vals.append(str(val))

            columns_info.append({
                "name": str(col),
                "dtype": str(series.dtype),
                "detected_type": detected_type,
                "non_null_count": int(row_count - null_cnt),
                "null_count": null_cnt,
                "null_percentage": null_percentage,
                "unique_count": unique_cnt,
                "sample_values": sample_vals
            })

        return {
            "row_count": row_count,
            "col_count": col_count,
            "memory_usage_mb": memory_usage_mb,
            "missing_values_count": missing_count,
            "missing_percentage": missing_pct,
            "duplicate_rows_count": duplicate_count,
            "columns": columns_info
        }

    @staticmethod
    def get_preview(
        df: pd.DataFrame,
        page: int = 1,
        page_size: int = 25,
        search: Optional[str] = None,
        sort_by: Optional[str] = None,
        sort_desc: bool = False
    ) -> Dict[str, Any]:
        working_df = df

        if search:
            search_term = str(search).lower()
            mask = working_df.astype(str).apply(lambda row: row.str.lower().str.contains(search_term, regex=False)).any(axis=1)
            working_df = working_df[mask]

        if sort_by and sort_by in working_df.columns:
            working_df = working_df.sort_values(by=sort_by, ascending=not sort_desc)

        total_rows = len(working_df)
        total_pages = max(1, math.ceil(total_rows / page_size))
        page = min(max(1, page), total_pages)

        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        page_df = working_df.iloc[start_idx:end_idx]

        columns = [{"name": str(col), "type": DataService.detect_column_type(working_df[col])} for col in working_df.columns]
        
        # Clean records for JSON safety
        records = []
        for _, row in page_df.iterrows():
            row_dict = {}
            for col in working_df.columns:
                val = row[col]
                if pd.isna(val) or (isinstance(val, (float, np.floating)) and (math.isnan(val) or math.isinf(val))):
                    row_dict[str(col)] = None
                elif isinstance(val, (np.integer, int)):
                    row_dict[str(col)] = int(val)
                elif isinstance(val, (np.floating, float)):
                    row_dict[str(col)] = round(float(val), 4)
                elif isinstance(val, (pd.Timestamp, np.datetime64)):
                    row_dict[str(col)] = str(val)
                else:
                    row_dict[str(col)] = str(val)
            records.append(row_dict)

        return {
            "total_rows": total_rows,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "columns": columns,
            "rows": records
        }
