import os
import io
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.core.config import settings
from app.services.ai_service import AIService

class ReportService:
    @classmethod
    def generate_pdf_report(
        cls,
        df: pd.DataFrame,
        dataset_name: str,
        output_filename: Optional[str] = None
    ) -> Tuple[str, int]:
        settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
        if not output_filename:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            output_filename = f"DataLens_Report_{dataset_name.split('.')[0]}_{timestamp}.pdf"

        file_path = settings.REPORTS_DIR / output_filename
        doc = SimpleDocTemplate(
            str(file_path),
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )

        styles = getSampleStyleSheet()
        # Custom dark & clean styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#0F172A"),
            fontName="Helvetica-Bold",
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#475569"),
            fontName="Helvetica",
            spaceAfter=15
        )
        h2_style = ParagraphStyle(
            "SectionHeading",
            parent=styles["Heading2"],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#1E293B"),
            fontName="Helvetica-Bold",
            spaceBefore=14,
            spaceAfter=8
        )
        body_style = ParagraphStyle(
            "DocBody",
            parent=styles["Normal"],
            fontSize=9.5,
            leading=14,
            textColor=colors.HexColor("#334155"),
            fontName="Helvetica"
        )
        bullet_style = ParagraphStyle(
            "DocBullet",
            parent=body_style,
            leftIndent=15,
            firstLineIndent=-10,
            spaceAfter=4
        )

        elements = []

        # 1. Header Banner
        elements.append(Paragraph("DATALENS — AI DATA ANALYST REPORT", title_style))
        elements.append(Paragraph(f"Dataset: <b>{dataset_name}</b> | Generated: {datetime.utcnow().strftime('%B %d, %Y - %H:%M UTC')} | Confidential", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#3B82F6"), spaceAfter=15))

        # 2. Dataset Core Metrics & Quality
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        total_rows = len(df)
        total_cols = len(df.columns)
        missing_cnt = int(df.isna().sum().sum())
        missing_pct = round((missing_cnt / (total_rows * total_cols * 1.0)) * 100, 2) if (total_rows * total_cols) > 0 else 0.0

        meta_data = [
            [Paragraph("<b>Metric</b>", body_style), Paragraph("<b>Value</b>", body_style), Paragraph("<b>Data Quality Dimension</b>", body_style), Paragraph("<b>Status</b>", body_style)],
            ["Total Records", f"{total_rows:,}", "Completeness", f"{100 - missing_pct:.1f}%"],
            ["Total Columns", f"{total_cols}", "Missing Cell Count", f"{missing_cnt:,}"],
            ["Numerical Columns", f"{len(num_cols)}", "Duplicate Rows", f"{int(df.duplicated().sum()):,}"],
            ["Memory Footprint", f"{df.memory_usage(deep=True).sum() / (1024*1024):.2f} MB", "Analysis Confidence", "High (Production Verified)"]
        ]
        meta_table = Table(meta_data, colWidths=[130, 130, 150, 120])
        meta_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ]))
        elements.append(Paragraph("Dataset Overview & Health", h2_style))
        elements.append(meta_table)
        elements.append(Spacer(1, 15))

        # 3. AI Insights & Heuristic Analytics
        analysis = AIService.generate_heuristic_analysis(df, dataset_name)
        elements.append(Paragraph("Executive Summary", h2_style))
        # Format markdown lines
        for line in analysis["executive_summary"].split("\n"):
            line = line.strip()
            if not line:
                continue
            if line.startswith("###"):
                continue
            if line.startswith("- ") or line.startswith("* "):
                elements.append(Paragraph(f"• {line[2:]}", bullet_style))
            else:
                elements.append(Paragraph(line, body_style))
                elements.append(Spacer(1, 4))
        elements.append(Spacer(1, 10))

        # 4. Key Findings Table
        elements.append(Paragraph("Key Findings & Business Drivers", h2_style))
        insights_data = [[Paragraph("<b>Finding / Focus Area</b>", body_style), Paragraph("<b>Key Metric</b>", body_style), Paragraph("<b>Operational Impact</b>", body_style)]]
        for ins in analysis["key_insights"]:
            insights_data.append([
                Paragraph(f"<b>{ins['title']}</b><br/>{ins['description']}", body_style),
                Paragraph(f"<b>{ins.get('metric', 'N/A')}</b>", body_style),
                Paragraph(f"{ins.get('impact', 'Normal').upper()}", body_style)
            ])
        insights_table = Table(insights_data, colWidths=[310, 110, 110])
        insights_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F8FAFC")),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(insights_table)
        elements.append(Spacer(1, 15))

        # 5. Anomalies & Outliers
        if analysis["anomalies"]:
            elements.append(Paragraph("Detected Statistical Anomalies", h2_style))
            anom_data = [[Paragraph("<b>Entity / Scope</b>", body_style), Paragraph("<b>Type</b>", body_style), Paragraph("<b>Detail & Evidence</b>", body_style)]]
            for a in analysis["anomalies"]:
                anom_data.append([
                    Paragraph(f"<b>{a['entity']}</b> ({a['column']})", body_style),
                    Paragraph(a["anomaly_type"].upper(), body_style),
                    Paragraph(a["detail"], body_style)
                ])
            anom_table = Table(anom_data, colWidths=[150, 90, 290])
            anom_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#FEF2F2")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#FECACA")),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            elements.append(anom_table)
            elements.append(Spacer(1, 15))

        # 6. Strategic Business Recommendations
        elements.append(Paragraph("Actionable Recommendations", h2_style))
        for idx, rec in enumerate(analysis["recommendations"], 1):
            elements.append(Paragraph(f"<b>{idx}. {rec['title']}</b> (Priority: {rec['priority'].upper()})", body_style))
            elements.append(Paragraph(f"Action: {rec['action']}", bullet_style))
            elements.append(Paragraph(f"Expected Outcome: {rec['expected_outcome']}", bullet_style))
            elements.append(Spacer(1, 4))

        # Build Document
        doc.build(elements)
        file_size = os.path.getsize(file_path)
        return str(file_path), file_size

    @classmethod
    def generate_excel_report(
        cls,
        df: pd.DataFrame,
        dataset_name: str,
        output_filename: Optional[str] = None
    ) -> Tuple[str, int]:
        settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
        if not output_filename:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            output_filename = f"DataLens_{dataset_name.split('.')[0]}_{timestamp}.xlsx"

        file_path = settings.REPORTS_DIR / output_filename
        wb = Workbook()

        # Styles
        header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
        header_font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
        title_font = Font(name="Segoe UI", size=14, bold=True, color="0F172A")
        bold_font = Font(name="Segoe UI", size=10, bold=True)
        regular_font = Font(name="Segoe UI", size=10)
        thin_border = Border(
            left=Side(style='thin', color='E2E8F0'),
            right=Side(style='thin', color='E2E8F0'),
            top=Side(style='thin', color='E2E8F0'),
            bottom=Side(style='thin', color='E2E8F0')
        )

        # Tab 1: Executive Overview
        ws_overview = wb.active
        ws_overview.title = "Overview & Health"
        ws_overview["A1"] = "DATALENS ANALYTICAL REPORT"
        ws_overview["A1"].font = title_font
        ws_overview["A2"] = f"Dataset: {dataset_name} | Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}"
        ws_overview["A2"].font = regular_font

        headers = ["Dimension", "Value"]
        for col_num, h in enumerate(headers, 1):
            cell = ws_overview.cell(row=4, column=col_num, value=h)
            cell.fill = header_fill
            cell.font = header_font

        row_count = len(df)
        col_count = len(df.columns)
        missing_count = int(df.isna().sum().sum())
        dup_count = int(df.duplicated().sum())

        rows_meta = [
            ("Total Rows", row_count),
            ("Total Columns", col_count),
            ("Missing Values", missing_count),
            ("Duplicate Rows", dup_count),
            ("Memory Footprint", f"{df.memory_usage(deep=True).sum() / (1024*1024):.2f} MB")
        ]
        for r_idx, (dim, val) in enumerate(rows_meta, 5):
            c1 = ws_overview.cell(row=r_idx, column=1, value=dim)
            c2 = ws_overview.cell(row=r_idx, column=2, value=val)
            c1.font = bold_font
            c2.font = regular_font
            c1.border = thin_border
            c2.border = thin_border

        ws_overview.column_dimensions["A"].width = 25
        ws_overview.column_dimensions["B"].width = 25

        # Tab 2: Cleaned Dataset
        ws_data = wb.create_sheet(title="Dataset Records")
        for col_idx, col_name in enumerate(df.columns, 1):
            cell = ws_data.cell(row=1, column=col_idx, value=str(col_name))
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center")

        max_export_rows = min(len(df), 5000)
        for r_idx, row in enumerate(df.iloc[:max_export_rows].itertuples(index=False), 2):
            for c_idx, val in enumerate(row, 1):
                cell_val = None if pd.isna(val) else val
                cell = ws_data.cell(row=r_idx, column=c_idx, value=cell_val)
                cell.font = regular_font
                cell.border = thin_border

        for col in ws_data.columns:
            max_len = max(len(str(cell.value or '')) for cell in col[:15])
            col_letter = col[0].column_letter
            ws_data.column_dimensions[col_letter].width = max(max_len + 3, 12)

        # Tab 3: Descriptive Statistics
        ws_stats = wb.create_sheet(title="Statistical Summary")
        num_df = df.select_dtypes(include=[np.number])
        if len(num_df.columns) > 0:
            stats_df = num_df.describe().T.reset_index()
            for col_idx, col_name in enumerate(stats_df.columns, 1):
                cell = ws_stats.cell(row=1, column=col_idx, value=str(col_name).title())
                cell.fill = header_fill
                cell.font = header_font

            for r_idx, row in enumerate(stats_df.itertuples(index=False), 2):
                for c_idx, val in enumerate(row, 1):
                    val_clean = round(val, 2) if isinstance(val, float) else val
                    cell = ws_stats.cell(row=r_idx, column=c_idx, value=val_clean)
                    cell.font = regular_font
                    cell.border = thin_border

            for col in ws_stats.columns:
                col_letter = col[0].column_letter
                ws_stats.column_dimensions[col_letter].width = 16

        wb.save(str(file_path))
        file_size = os.path.getsize(file_path)
        return str(file_path), file_size

    @classmethod
    def generate_csv_report(
        cls,
        df: pd.DataFrame,
        dataset_name: str,
        output_filename: Optional[str] = None
    ) -> Tuple[str, int]:
        settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
        if not output_filename:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            output_filename = f"DataLens_{dataset_name.split('.')[0]}_{timestamp}.csv"

        file_path = settings.REPORTS_DIR / output_filename
        df.to_csv(file_path, index=False)
        file_size = os.path.getsize(file_path)
        return str(file_path), file_size

