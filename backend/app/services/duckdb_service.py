import time
import re
import math
from typing import Dict, Any, List, Optional, Tuple
import duckdb
import pandas as pd
import numpy as np

class DuckDBService:
    DANGEROUS_PATTERNS = [
        r"\bATTACH\b", r"\bDETACH\b", r"\bCOPY\b", r"\bINSTALL\b", r"\bLOAD\b",
        r"\bEXPORT\b", r"\bIMPORT\b", r"\bPRAGMA\b", r"\bread_csv\b", r"\bread_parquet\b",
        r"\bread_json\b", r"\bwrite_\w+\b", r"\bDROP\b", r"\bALTER\b", r"\bDELETE\b",
        r"\bUPDATE\b", r"\bINSERT\b", r"\bCREATE\b"
    ]

    @classmethod
    def validate_query(cls, query: str) -> None:
        clean_q = query.strip()
        if not clean_q:
            raise ValueError("SQL query cannot be empty")

        for pattern in cls.DANGEROUS_PATTERNS:
            if re.search(pattern, clean_q, re.IGNORECASE):
                matched = re.search(pattern, clean_q, re.IGNORECASE).group(0)
                raise ValueError(f"Security restriction: Operation '{matched}' is not permitted in SQL Lab.")

        # Ensure the query begins with SELECT or WITH
        first_word = clean_q.split()[0].upper()
        if first_word not in ["SELECT", "WITH", "DESCRIBE", "EXPLAIN"]:
            raise ValueError("Only read-only SELECT or WITH statements are allowed.")

    @classmethod
    def execute_query(
        cls,
        df: pd.DataFrame,
        query: str,
        limit: int = 500
    ) -> Dict[str, Any]:
        cls.validate_query(query)

        con = duckdb.connect(database=":memory:")
        try:
            # Register dataframe as 'dataset' and 'sales'
            con.register("dataset", df)
            con.register("sales", df)
            con.register("data", df)

            start_time = time.perf_counter()
            result = con.execute(query)
            exec_time_ms = round((time.perf_counter() - start_time) * 1000, 2)

            col_names = [desc[0] for desc in result.description]
            fetched_df = result.fetchdf()
            total_rows = len(fetched_df)

            # Limit output preview if large
            preview_df = fetched_df.head(limit)

            columns_info = []
            for col in preview_df.columns:
                columns_info.append({
                    "name": str(col),
                    "type": str(preview_df[col].dtype)
                })

            rows = []
            for _, row in preview_df.iterrows():
                row_dict = {}
                for col in preview_df.columns:
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
                rows.append(row_dict)

            return {
                "success": True,
                "query": query,
                "execution_time_ms": exec_time_ms,
                "row_count": total_rows,
                "column_count": len(col_names),
                "columns": columns_info,
                "rows": rows,
                "error": None
            }

        except Exception as e:
            return {
                "success": False,
                "query": query,
                "execution_time_ms": 0.0,
                "row_count": 0,
                "column_count": 0,
                "columns": [],
                "rows": [],
                "error": str(e)
            }
        finally:
            con.close()

    @classmethod
    def explain_query(cls, df: pd.DataFrame, query: str) -> Dict[str, Any]:
        cls.validate_query(query)
        con = duckdb.connect(database=":memory:")
        try:
            con.register("dataset", df)
            con.register("sales", df)
            con.register("data", df)

            explain_res = con.execute(f"EXPLAIN {query}").fetchall()
            plan_text = "\n".join([str(row[1]) if len(row) > 1 else str(row[0]) for row in explain_res])

            summary = "The query plans an optimized in-memory scan over the active dataset."
            if "HASH_GROUP_BY" in plan_text or "GROUP_BY" in plan_text:
                summary += " Aggregation is accelerated via hash grouping."
            if "FILTER" in plan_text:
                summary += " Predicates are pushed down to filter rows early."
            if "ORDER_BY" in plan_text:
                summary += " Results are sorted using parallel radix/top-N sorting."

            return {
                "query": query,
                "explain_plan": plan_text,
                "summary": summary
            }
        finally:
            con.close()

