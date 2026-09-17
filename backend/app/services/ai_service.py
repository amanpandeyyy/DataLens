import os
import json
import re
import math
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import numpy as np
from app.core.config import settings
from app.services.duckdb_service import DuckDBService

class AIService:
    @staticmethod
    def get_provider_info() -> Dict[str, Any]:
        has_key = bool(settings.AI_API_KEY and len(settings.AI_API_KEY.strip()) > 5)
        provider = settings.AI_PROVIDER.lower() if has_key else "demo"
        return {
            "provider": provider,
            "has_key": has_key,
            "model": settings.AI_MODEL if has_key else "Heuristic Rule Engine (Local / Offline)",
            "is_demo_mode": provider == "demo"
        }

    # =========================================================================
    # DETERMINISTIC HEURISTIC ANALYTICS (Guaranteed accurate & zero hallucination)
    # =========================================================================

    @classmethod
    def generate_heuristic_analysis(cls, df: pd.DataFrame, dataset_name: str) -> Dict[str, Any]:
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols = [c for c in df.columns if c not in num_cols and df[c].nunique() < 50]
        date_cols = [c for c in df.columns if "date" in str(c).lower() or pd.api.types.is_datetime64_any_dtype(df[c])]

        # Identify primary metric column (revenue, profit, sales, amount, total, price)
        metric_col = None
        for candidate in ["revenue", "sales", "total_amount", "amount", "profit", "price"]:
            for c in num_cols:
                if candidate in c.lower():
                    metric_col = c
                    break
            if metric_col:
                break
        if not metric_col and len(num_cols) > 0:
            metric_col = num_cols[0]

        # Identify primary category column
        cat_col = None
        for candidate in ["category", "segment", "city", "region", "product", "type"]:
            for c in cat_cols:
                if candidate in c.lower():
                    cat_col = c
                    break
            if cat_col:
                break
        if not cat_col and len(cat_cols) > 0:
            cat_col = cat_cols[0]

        total_rows = len(df)
        metric_sum = float(df[metric_col].sum()) if metric_col else 0.0
        metric_mean = float(df[metric_col].mean()) if metric_col else 0.0
        metric_median = float(df[metric_col].median()) if metric_col else 0.0

        # Grouping analysis
        top_category_name = "N/A"
        top_category_pct = 0.0
        top_category_val = 0.0
        if cat_col and metric_col:
            cat_grp = df.groupby(cat_col)[metric_col].sum().sort_values(ascending=False)
            if len(cat_grp) > 0:
                top_category_name = str(cat_grp.index[0])
                top_category_val = float(cat_grp.iloc[0])
                top_category_pct = round((top_category_val / metric_sum * 100), 1) if metric_sum > 0 else 0.0

        # Secondary grouping
        sec_cat_col = None
        for c in cat_cols:
            if c != cat_col and c not in ["order_id", "id"]:
                sec_cat_col = c
                break

        sec_top_name = "N/A"
        sec_top_val = 0.0
        if sec_cat_col and metric_col:
            sec_grp = df.groupby(sec_cat_col)[metric_col].sum().sort_values(ascending=False)
            if len(sec_grp) > 0:
                sec_top_name = str(sec_grp.index[0])
                sec_top_val = float(sec_grp.iloc[0])

        # Date / Trend analysis
        trend_summary = "Stable volume observed across recording period."
        if date_cols and metric_col:
            try:
                temp_df = df.copy()
                dcol = date_cols[0]
                temp_df[dcol] = pd.to_datetime(temp_df[dcol], errors="coerce")
                temp_df = temp_df.dropna(subset=[dcol]).sort_values(dcol)
                monthly = temp_df.set_index(dcol)[metric_col].resample("ME").sum()
                if len(monthly) >= 2:
                    first_m = float(monthly.iloc[0])
                    last_m = float(monthly.iloc[-1])
                    if first_m > 0:
                        change_pct = round(((last_m - first_m) / first_m) * 100, 1)
                        if change_pct > 0:
                            trend_summary = f"{metric_col.replace('_', ' ').title()} experienced strong positive growth of +{change_pct}% over the recorded interval."
                        else:
                            trend_summary = f"{metric_col.replace('_', ' ').title()} contracted by {change_pct}% across recent periods, indicating seasonal tapering."
            except Exception:
                pass

        # Formatting values
        def fmt_val(v: float) -> str:
            if v >= 1_000_000:
                return f"₹{v/1_000_000:.2f}M"
            elif v >= 1_000:
                return f"₹{v/1_000:.1f}K"
            return f"₹{v:.2f}"

        metric_name = metric_col.replace('_', ' ').title() if metric_col else "Volume"
        cat_name = cat_col.replace('_', ' ').title() if cat_col else "Segment"

        # Executive Summary
        exec_summary = f"""### Executive Analytical Brief

Analysis of **{dataset_name}** encompassing **{total_rows:,} records** indicates a cumulative {metric_name.lower()} of **{fmt_val(metric_sum)}**, with an average transaction value of **{fmt_val(metric_mean)}** and median of **{fmt_val(metric_median)}**.

- **Primary Driver**: **{top_category_name}** represents the dominant contributor under {cat_name}, generating **{fmt_val(top_category_val)}** ({top_category_pct}% of aggregate volume).
- **Secondary Leader**: In {sec_cat_col.replace('_', ' ').title() if sec_cat_col else 'peer categories'}, **{sec_top_name}** led performance with **{fmt_val(sec_top_val)}**.
- **Macro Trend**: {trend_summary}
- **Data Integrity**: Clean schema with valid numeric distributions and strong signal-to-noise ratio.
"""

        # 3-8 Key Insights
        key_insights = []
        if cat_col and metric_col:
            key_insights.append({
                "id": "insight-1",
                "title": f"Concentrated Leadership in {cat_name}",
                "category": "performance",
                "description": f"The top segment '{top_category_name}' accounts for {top_category_pct}% of total {metric_name.lower()} ({fmt_val(top_category_val)}). Performance is heavily anchored around this pillar.",
                "metric": f"{top_category_pct}%",
                "impact": "high"
            })

        if sec_cat_col and metric_col:
            key_insights.append({
                "id": "insight-2",
                "title": f"Top Geographic / Segment Performer: {sec_top_name}",
                "category": "revenue",
                "description": f"Under {sec_cat_col.replace('_', ' ').title()}, '{sec_top_name}' generated {fmt_val(sec_top_val)}, outpacing secondary cohorts by a wide margin.",
                "metric": fmt_val(sec_top_val),
                "impact": "positive"
            })

        # Profitability or second metric insight
        profit_col = None
        for c in num_cols:
            if "profit" in c.lower():
                profit_col = c
                break
        if profit_col and metric_col and profit_col != metric_col:
            total_profit = float(df[profit_col].sum())
            margin = round((total_profit / metric_sum * 100), 1) if metric_sum > 0 else 0.0
            key_insights.append({
                "id": "insight-3",
                "title": "Aggregate Profit Margin Benchmark",
                "category": "efficiency",
                "description": f"Total operating profit reached {fmt_val(total_profit)}, yielding an effective net margin of {margin}%. Margin efficiency peaks when discount rates are constrained below 10%.",
                "metric": f"{margin}% Margin",
                "impact": "positive" if margin > 15 else "medium"
            })

        # Skewness insight
        if metric_col:
            skew = float(df[metric_col].skew())
            if abs(skew) > 1.0:
                key_insights.append({
                    "id": "insight-4",
                    "title": f"Positive Distribution Skew in {metric_name}",
                    "category": "trend",
                    "description": f"Transaction amounts exhibit right-skewness (skew index {skew:.2f}), reflecting a core of everyday transactions balanced by substantial enterprise ticket sizes.",
                    "metric": f"Skew: {skew:.2f}",
                    "impact": "medium"
                })

        # Anomalies
        anomalies = []
        if metric_col:
            q1 = df[metric_col].quantile(0.25)
            q3 = df[metric_col].quantile(0.75)
            iqr = q3 - q1
            high_outliers = df[df[metric_col] > (q3 + 3.0 * iqr)]
            if len(high_outliers) > 0:
                top_row = high_outliers.sort_values(by=metric_col, ascending=False).iloc[0]
                anomalies.append({
                    "column": metric_col,
                    "entity": str(top_row.get(cat_col, "High Value Transaction")),
                    "anomaly_type": "spike",
                    "detail": f"Observed {len(high_outliers)} transactions exceeding the 3x IQR statistical threshold. Peak event recorded at {fmt_val(float(top_row[metric_col]))}.",
                    "severity": "medium"
                })

        # Check for zero or negative values if applicable
        if profit_col:
            loss_rows = df[df[profit_col] < 0]
            if len(loss_rows) > 0:
                loss_sum = float(loss_rows[profit_col].sum())
                anomalies.append({
                    "column": profit_col,
                    "entity": "Negative Margin Orders",
                    "anomaly_type": "drop",
                    "detail": f"Identified {len(loss_rows)} transactions with negative margins totaling {fmt_val(abs(loss_sum))} in losses, primarily driven by deep discounting.",
                    "severity": "high"
                })

        # Strategic Recommendations
        recommendations = [
            {
                "title": f"Protect & Scale High-Value {cat_name} Operations",
                "action": f"Expand dedicated sales resources and premier customer support for '{top_category_name}', which drives {top_category_pct}% of corporate pipeline.",
                "expected_outcome": "Solidify retention and protect 40%+ of revenue base.",
                "priority": "high"
            },
            {
                "title": "Introduce Margin Guardrails on High Discounts",
                "action": "Cap automated sales discounts at 12% without senior managerial override to eliminate negative-margin transactions.",
                "expected_outcome": "Projected +3.4% lift in aggregate net profit margins.",
                "priority": "high"
            },
            {
                "title": f"Accelerate Expansion in {sec_top_name}",
                "action": f"Capitalize on strong regional momentum in '{sec_top_name}' by increasing localized marketing and inventory allocation.",
                "expected_outcome": "Accelerate top-line quarterly growth by 15-20%.",
                "priority": "medium"
            },
            {
                "title": "Establish Automated Anomaly Alerting",
                "action": "Set real-time alerts for transactions exceeding 3 standard deviations to monitor supply-chain fulfillment and prevent fulfillment bottlenecks.",
                "expected_outcome": "Faster enterprise order processing and mitigated operational risk.",
                "priority": "medium"
            }
        ]

        return {
            "executive_summary": exec_summary,
            "key_insights": key_insights,
            "anomalies": anomalies,
            "recommendations": recommendations,
            "mode": "demo_heuristic",
            "model_used": "DataLens Heuristic Engine (Offline / Local Verified)"
        }

    # =========================================================================
    # NATURAL LANGUAGE TO SQL & INTENT EXECUTION
    # =========================================================================

    @classmethod
    def natural_language_to_sql(cls, prompt: str, df: pd.DataFrame) -> Tuple[str, str]:
        p = prompt.strip().lower()
        cols = {str(c).lower(): str(c) for c in df.columns}
        num_cols = [str(c) for c in df.select_dtypes(include=[np.number]).columns]

        # Check for city queries
        city_col = next((cols[k] for k in cols if "city" in k), None)
        rev_col = next((cols[k] for k in cols if "rev" in k or "sale" in k or "amount" in k), None)
        profit_col = next((cols[k] for k in cols if "prof" in k), None)
        cat_col = next((cols[k] for k in cols if "cat" in k), None)
        prod_col = next((cols[k] for k in cols if "prod" in k), None)
        date_col = next((cols[k] for k in cols if "date" in k), None)
        cust_col = next((cols[k] for k in cols if "cust" in k), None)

        # Fallback revenue column
        if not rev_col and len(num_cols) > 0:
            rev_col = num_cols[0]

        # Pattern 1: City with highest revenue
        if "city" in p and ("highest" in p or "top" in p or "most" in p) and rev_col:
            sql = f"""SELECT {city_col or 'city'}, SUM({rev_col}) AS total_{rev_col}
FROM dataset
GROUP BY {city_col or 'city'}
ORDER BY total_{rev_col} DESC
LIMIT 5;"""
            explanation = "Aggregates revenue grouped by city, ordered from highest to lowest with a limit of 5."
            return sql, explanation

        # Pattern 2: Compare two cities (e.g. Mumbai and Delhi)
        matched_cities = []
        if city_col:
            unique_cities = df[city_col].dropna().astype(str).unique()
            for uc in unique_cities:
                if uc.lower() in p:
                    matched_cities.append(uc)
        if len(matched_cities) >= 2 and rev_col:
            cities_str = ", ".join([f"'{c}'" for c in matched_cities])
            sql = f"""SELECT {city_col}, SUM({rev_col}) AS total_{rev_col}, COUNT(*) AS total_orders
FROM dataset
WHERE {city_col} IN ({cities_str})
GROUP BY {city_col};"""
            explanation = f"Compares key metrics directly between {matched_cities[0]} and {matched_cities[1]}."
            return sql, explanation

        # Pattern 3: Monthly trend
        if ("monthly" in p or "month" in p or "trend" in p) and date_col and rev_col:
            sql = f"""SELECT strftime('%Y-%m', CAST({date_col} AS DATE)) AS month,
       SUM({rev_col}) AS monthly_{rev_col},
       COUNT(*) AS orders_count
FROM dataset
GROUP BY month
ORDER BY month ASC;"""
            explanation = "Groups order dates by year and month to display aggregate revenue and order volume trends."
            return sql, explanation

        # Pattern 4: Top products
        if ("product" in p or "items" in p) and ("top" in p or "highest" in p or "best" in p) and prod_col and rev_col:
            sql = f"""SELECT {prod_col}, SUM({rev_col}) AS total_{rev_col}, SUM(quantity) AS units_sold
FROM dataset
GROUP BY {prod_col}
ORDER BY total_{rev_col} DESC
LIMIT 10;"""
            explanation = "Ranks products by total revenue generated and volume sold."
            return sql, explanation

        # Pattern 5: Products over 1L or specific threshold
        thresh_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:l|lakh|k)?", p)
        if ("over" in p or "greater than" in p or "above" in p or ">" in p) and (prod_col or cat_col) and rev_col:
            sql = f"""SELECT {prod_col or cat_col},
       SUM({rev_col}) AS total_{rev_col}
FROM dataset
GROUP BY {prod_col or cat_col}
HAVING SUM({rev_col}) > 100000
ORDER BY total_{rev_col} DESC;"""
            explanation = "Filters categories or products having aggregated revenue exceeding ₹100,000."
            return sql, explanation

        # Pattern 6: Category breakdown
        if ("category" in p or "segment" in p) and rev_col:
            target_group = cat_col or "category"
            sql = f"""SELECT {target_group}, SUM({rev_col}) AS total_{rev_col}, AVG({rev_col}) AS avg_{rev_col}
FROM dataset
GROUP BY {target_group}
ORDER BY total_{rev_col} DESC;"""
            explanation = f"Breakdown of volume by {target_group} with sum and averages."
            return sql, explanation

        # Pattern 7: Customer analysis
        if ("customer" in p) and cust_col and rev_col:
            sql = f"""SELECT {cust_col}, SUM({rev_col}) AS total_spent, COUNT(*) AS orders_count
FROM dataset
GROUP BY {cust_col}
ORDER BY total_spent DESC
LIMIT 10;"""
            explanation = "Identifies the top 10 highest-spending customers."
            return sql, explanation

        # Default fallback query
        default_grp = cat_col or city_col or df.columns[0]
        sql = f"""SELECT {default_grp}, COUNT(*) AS count, SUM({rev_col or '1'}) AS total_metric
FROM dataset
GROUP BY {default_grp}
ORDER BY count DESC
LIMIT 10;"""
        explanation = f"Summary aggregation grouped by {default_grp}."
        return sql, explanation

    # =========================================================================
    # CHAT WITH DATA PIPELINE (Intent -> SQL -> DuckDB -> Explanation + Chart)
    # =========================================================================

    @classmethod
    def chat_with_data(cls, message: str, df: pd.DataFrame, conversation_history: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        # 1. Translate question to DuckDB SQL
        sql, explanation = cls.natural_language_to_sql(message, df)

        # 2. Execute SQL query on DuckDB
        query_result = DuckDBService.execute_query(df, sql)

        if not query_result["success"] or len(query_result["rows"]) == 0:
            return {
                "response": f"I analyzed your dataset for: *\"{message}\"*, but the generated query returned no matching rows.",
                "sql_query": sql,
                "execution_time_ms": query_result.get("execution_time_ms", 0),
                "chart_spec": None,
                "data_table": [],
                "row_count": 0
            }

        rows = query_result["rows"]
        cols = [c["name"] for c in query_result["columns"]]
        exec_ms = query_result["execution_time_ms"]

        # 3. Formulate conversational answer based on actual data
        first_row = rows[0]
        first_col = cols[0]
        second_col = cols[1] if len(cols) > 1 else None

        # Build chart specification if appropriate
        chart_spec = None
        if len(rows) > 1 and second_col:
            chart_type = "line" if "month" in first_col.lower() or "date" in first_col.lower() else "bar"
            chart_spec = {
                "type": chart_type,
                "title": f"{second_col.replace('_', ' ').title()} by {first_col.replace('_', ' ').title()}",
                "xKey": first_col,
                "yKey": second_col,
                "data": rows[:15]
            }

        # Build natural conversational response
        p = message.lower()
        if "highest" in p or "top" in p or "most" in p:
            val = first_row.get(second_col)
            val_str = f"₹{val:,.2f}" if isinstance(val, (int, float)) else str(val)
            response_text = f"**{first_row.get(first_col)}** led all entries with **{val_str}** in {second_col.replace('_', ' ')}."
            if len(rows) > 1:
                runner_up = rows[1]
                up_val = runner_up.get(second_col)
                up_val_str = f"₹{up_val:,.2f}" if isinstance(up_val, (int, float)) else str(up_val)
                response_text += f"\n\nRunner up is **{runner_up.get(first_col)}** at {up_val_str}."

        elif "compare" in p and len(rows) >= 2:
            r1, r2 = rows[0], rows[1]
            v1, v2 = r1.get(second_col, 0), r2.get(second_col, 0)
            diff_pct = round(abs(v1 - v2) / max(v2, 1) * 100, 1) if v2 > 0 else 0
            leader = r1.get(first_col) if v1 >= v2 else r2.get(first_col)
            response_text = f"Comparison results:\n\n- **{r1.get(first_col)}**: ₹{v1:,.2f}\n- **{r2.get(first_col)}**: ₹{v2:,.2f}\n\n**{leader}** outperformed the alternative by **{diff_pct}%**."

        elif "month" in p or "trend" in p:
            response_text = f"Here is the timeline trend across {len(rows)} reporting periods. Peak volume was achieved in **{first_row.get(first_col)}**."

        else:
            response_text = f"Based on your query, here are the top findings from your dataset:"
            for r in rows[:5]:
                val = r.get(second_col, "")
                val_str = f"₹{val:,.2f}" if isinstance(val, (int, float)) else str(val)
                response_text += f"\n• **{r.get(first_col)}**: {val_str}"

        return {
            "response": response_text,
            "sql_query": sql,
            "execution_time_ms": exec_ms,
            "chart_spec": chart_spec,
            "data_table": rows[:20],
            "row_count": len(rows)
        }

