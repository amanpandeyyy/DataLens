# DataLens — AI Data Analyst

> **Turn raw data into decisions.**  
> A modern, production-quality AI-powered Data Analyst web application featuring an ultra-premium dark analytics interface (Linear/Vercel-inspired), in-memory DuckDB querying, Scikit-learn outlier detection, automated business insights, conversational data exploration, and publication-grade PDF/Excel report generation.

---

## 1. Product Overview

DataLens enables data analysts, executives, product managers, and developers to upload tabular datasets, understand schema characteristics, execute data cleaning pipelines, construct interactive charts, ask natural questions backed by SQL calculations, and export comprehensive executive reports.

### Core Analytical Workflow:
$$\text{Upload Data} \longrightarrow \text{Understand Data} \longrightarrow \text{Clean Data} \longrightarrow \text{Analyze} \longrightarrow \text{Visualize} \longrightarrow \text{Ask AI} \longrightarrow \text{Generate Insights} \longrightarrow \text{Generate Report} \longrightarrow \text{Export}$$

---

## 2. Key Features

- **Executive Analytics Dashboard**:
  - Greeting banner (`Good evening, [User]`) with dynamic KPI cards calculated directly from uploaded data.
  - One-click **"Try Sample Dataset"** with enterprise sales figures (1,250+ rows).
  - Recent datasets with row counts, columns, memory usage, and health badges.
- **Data Upload**:
  - Drag-and-drop ingestion supporting **CSV**, **XLSX**, and **JSON**.
  - Immediate metadata extraction: Row count, column count, missing cell counts & %, duplicate records, memory footprint, and column data type inference.
- **Spreadsheet Data Table (TanStack Table)**:
  - Global search filter across all records.
  - Multi-column sorting (ascending / descending).
  - Column visibility toggle menu.
  - Data type indicators on headers (`numeric`, `categorical`, `datetime`, `id`, `boolean`).
  - Configurable pagination controls (10, 25, 50, 100 rows/page).
- **Data Cleaning Studio**:
  - **Missing Values**: Impute using Mean, Median, Mode, Forward Fill, Backward Fill, Drop Rows, or Drop Column.
  - **Duplicate Rows**: Real-time detection and one-click deduplication.
  - **Schema Casting**: Convert columns between String, Integer, Float, Boolean, Date, and Datetime.
  - **Outlier Remediation**: IQR (Interquartile Range), Z-Score, and Scikit-learn **Isolation Forest** with actions to Remove rows, Replace with median/mean, or Clamp to boundaries.
  - **Undo / Redo**: Snapshot-backed action history stack allows rolling back changes safely.
- **Automated Statistics & Correlation Matrix**:
  - Numerical summary: Count, Mean, Median, Standard Deviation, Min, Max, Q25, Q75, Skewness, Kurtosis.
  - Categorical distribution: Unique counts, top values, and frequency breakdown bars.
  - Interactive Pearson correlation heatmap grid (-1.0 to +1.0).
- **Interactive Visualization Builder**:
  - Chart types: **Bar Chart**, **Line Chart**, **Area Chart**, **Scatter Plot**, **Histogram**, and **Pie/Donut Chart** powered by Recharts.
  - Customizable X-Axis, Y-Axis, Group By (multi-series breakdown), and Aggregations (Sum, Avg, Count, Min, Max).
- **Autonomous AI Data Analyst**:
  - Computes exact dataset distributions and produces:
    - **Executive Summary**: High-level strategic overview with bold KPI callouts.
    - **Key Insights**: 3 to 8 structured takeaways with impact badges.
    - **Statistical Anomalies**: Identifies revenue spikes, deep-discount margin losses, and category swings.
    - **Business Recommendations**: Prioritized, actionable corporate strategies with projected outcomes.
  - **Zero-Hallucination Guarantee**: Every statement is directly anchored in computed mathematical values.
- **Chat with Data**:
  - Conversational interface with suggested prompt chips.
  - **Data Safety Pipeline**: User question $\rightarrow$ Intent Detection $\rightarrow$ Safe DuckDB execution $\rightarrow$ Exact Computed Result $\rightarrow$ Conversational explanation + Inline interactive chart generation!
  - Expandable **DuckDB Query** drawer showing execution time in milliseconds.
- **DuckDB SQL Lab (Developer)**:
  - Natural Language to SQL converter.
  - Syntax-styled SQL editor querying virtual `dataset` table in a read-only, safe sandbox.
  - Execution metrics banner: execution duration in ms, row count, column count.
  - Query History log with one-click re-run, copy SQL, and explain plan.
- **Report Generator**:
  - **PDF Export**: Publication-ready document generated via **ReportLab** with corporate typography, data quality scorecard, KPI metric tables, and recommendations.
  - **Excel Export**: Multi-tab workbook (`.xlsx`) generated via **OpenPyXL** containing Overview & Health, Cleaned Records, and Descriptive Statistics.
  - **CSV Export**: Cleaned dataset download.
- **System Settings & Authentication**:
  - User profiles with bcrypt password hashing and JWT tokens.
  - Provider-independent AI configuration: switch between **Deterministic Local Engine (Zero Key Required)**, **OpenAI**, **Anthropic**, **Groq**, or local **Ollama**.

---

## 3. Technology Stack

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS (Strict Dark Theme `#050505`, `#0B0B0B`, `#111111`, `#242424`, `#3B82F6`)
- **Data Table**: `@tanstack/react-table` v8
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios with automatic auth interceptors

### Backend
- **Framework**: Python 3.10+ / FastAPI + Uvicorn
- **Validation**: Pydantic v2 & Pydantic-Settings
- **Data Processing**: Pandas, NumPy, OpenPyXL
- **In-Memory Analytics**: DuckDB
- **Machine Learning**: Scikit-Learn (Isolation Forest anomaly detection, IQR, Z-Score)
- **Database & ORM**: SQLAlchemy (SQLite for instant zero-configuration local use, PostgreSQL ready)
- **Security**: PyJWT, Bcrypt
- **Reporting**: ReportLab (PDF), OpenPyXL (Excel)

---

## 4. Folder Structure

```text
AI_Data_Analyst/
├── backend/
│   ├── app/
│   │   ├── api/             # REST API routes (auth, datasets, clean, analytics, visualize, ai, sql, reports)
│   │   │   ├── auth.py
│   │   │   ├── projects.py
│   │   │   ├── datasets.py
│   │   │   ├── clean.py
│   │   │   ├── analytics.py
│   │   │   ├── visualize.py
│   │   │   ├── ai.py
│   │   │   ├── sql.py
│   │   │   └── reports.py
│   │   ├── core/            # App settings, security, hashing, JWT
│   │   ├── database/        # Engine, session, migrations & init seeder
│   │   ├── models/          # SQLAlchemy ORM models (User, Project, Dataset, QueryHistory, Report)
│   │   ├── schemas/         # Pydantic request & response models
│   │   ├── services/        # Business logic: data_service, clean_service, duckdb_service, ai_service, report_service
│   │   └── main.py          # FastAPI application entrypoint
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # Header, Sidebar, Toast, SkeletonLoader, EmptyState
│   │   ├── pages/           # Dashboard, Upload, Datasets, Overview, Cleaning, Statistics, Visualization, AIAnalyst, ChatData, SQLLab, Reports, Settings
│   │   ├── layouts/         # AppLayout with persistent desktop sidebar and mobile drawer
│   │   ├── hooks/           # useDataLens state context
│   │   ├── services/        # Axios API client
│   │   ├── utils/           # Formatters (currency, numbers, bytes, dates)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── data/
│   ├── samples/
│   │   └── sales_sample.csv # 1,250+ enterprise records with intentional test outliers
│   └── uploads/             # User uploaded files & snapshots
├── reports/                 # Generated PDF and Excel artifacts
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 5. Installation & Quick Start

### Prerequisites
- Python 3.10+ (Python 3.12+ fully supported)
- Node.js 18+ and pnpm (or npm)

### 1. Clone & Setup Backend

```bash
cd AI_Data_Analyst

# Install Python requirements
python -m pip install -r backend/requirements.txt

# Create environment configuration (defaults to SQLite + Heuristic AI mode)
cp backend/.env.example backend/.env
```

### 2. Setup Frontend

```bash
cd frontend

# Install Node dependencies
pnpm install   # or: npm install

# Build production bundle (or run dev server)
pnpm run build
```

---

## 6. Running the Application

### Option A: Running Backend and Frontend

**Terminal 1 (Backend - Port 8000):**
```bash
# From AI_Data_Analyst root
$env:PYTHONPATH="backend"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 (Frontend - Port 5173):**
```bash
cd frontend
pnpm run dev   # or: npm run dev
```

Visit **`http://localhost:5173`** in your browser!

### Option B: Docker Compose

```bash
docker-compose up --build
```

---

## 7. Environment Variables (`.env`)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `APP_NAME` | `DataLens` | Application display name |
| `DATABASE_URL` | `sqlite:///./data/datalens.db` | SQLAlchemy database connection string (PostgreSQL or SQLite) |
| `SECRET_KEY` | `datalens-super-secret-key-2026` | Secret key used for signing JWT auth tokens |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | JWT token validity in minutes (24 hours) |
| `UPLOAD_DIR` | `./data/uploads` | Path to store user datasets and snapshots |
| `SAMPLE_DIR` | `./data/samples` | Path for sample enterprise datasets |
| `REPORTS_DIR` | `./reports` | Path for generated PDF and Excel reports |
| `MAX_UPLOAD_SIZE_MB` | `50` | Maximum file size allowed for upload |
| `AI_PROVIDER` | `demo` | Provider: `demo` (Offline heuristic rule engine), `openai`, `anthropic`, `groq`, `ollama` |
| `AI_API_KEY` | *None* | Optional LLM API key |
| `AI_MODEL` | `gpt-4o-mini` | LLM model identifier |
| `AI_BASE_URL` | *None* | Custom OpenAI-compatible endpoint |

---

## 8. REST API Documentation

FastAPI provides automated Swagger UI at **`http://localhost:8000/docs`**.

### Key Endpoints:
- `POST /api/auth/demo-login` — Frictionless 1-click authentication.
- `POST /api/datasets/upload` — Upload CSV, XLSX, or JSON file.
- `POST /api/datasets/sample` — Load enterprise sales sample dataset.
- `GET  /api/datasets/{id}/preview` — Paginated TanStack Table preview slice.
- `GET  /api/clean/{id}/quality` — Data health score, missing columns, and duplicates.
- `POST /api/clean/{id}/impute` — Mean, median, mode, ffill, bfill, drop imputation.
- `POST /api/clean/{id}/outliers/detect` — IQR, Z-Score, Isolation Forest anomaly scanner.
- `POST /api/clean/{id}/outliers/handle` — Remove, replace, or clamp outliers.
- `POST /api/clean/{id}/undo` — Revert previous cleaning step.
- `GET  /api/analytics/{id}/overview` — Descriptive stats, dynamic KPIs, and correlations.
- `POST /api/visualize/{id}` — Aggregation engine for interactive charts.
- `POST /api/ai/{id}/analyze` — Automated AI executive summary, insights, and recommendations.
- `POST /api/ai/{id}/chat` — Conversational data chat with SQL translation and embedded chart specifications.
- `POST /api/sql/{id}/execute` — Run safe DuckDB SQL queries against `dataset`.
- `POST /api/reports/{id}` — Generate publication-grade PDF or Excel report.
- `GET  /api/reports/download/{id}` — Download report file.

---

## 9. Security & Data Safety

- **Read-Only SQL Sandbox**: User SQL queries are validated against AST rules, disallowing destructive commands (`DROP`, `ALTER`, `DELETE`, `ATTACH`, `COPY`, `INSTALL`, file system operations).
- **Isolated Table Scope**: In-memory DuckDB queries run against a temporary table view `dataset` with zero access to the host database.
- **Zero-Hallucination AI Pipeline**: When querying numbers, the system generates SQL, calculates the exact mathematical values with DuckDB, and feeds the ground truth to the AI for plain-English synthesis.
- **File Validation & Path Traversal Prevention**: File extensions, MIME types, and filenames are sanitized and stored using cryptographic UUIDs.

#   D a t a L e n s  
 #   D a t a L e n s  
 