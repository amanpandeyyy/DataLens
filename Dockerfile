# Multi-stage Dockerfile for DataLens — AI Data Analyst
# Stage 1: Build Vite React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Backend + Embedded SPA
FROM python:3.11-slim
WORKDIR /app

# Install build essentials if needed by DuckDB / Scikit-learn
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend application source
COPY backend ./backend

# Copy compiled frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create directories for SQLite and reports
RUN mkdir -p /app/data /app/reports

# Environment configuration
ENV PYTHONPATH=/app/backend
ENV APP_ENV=production
ENV APP_NAME=DataLens
ENV DATABASE_URL=sqlite:////app/data/datalens.db
ENV AI_PROVIDER=demo
ENV PORT=8000

EXPOSE 8000

# Run FastAPI production server
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
