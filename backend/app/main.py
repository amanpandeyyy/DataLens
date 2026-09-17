from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.database.session import init_db
from app.api import auth, projects, datasets, clean, analytics, visualize, ai, sql, reports

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed demo user
    init_db()
    yield

app = FastAPI(
    title="DataLens — AI Data Analyst API",
    description="Production-grade AI Data Analyst API with DuckDB analytics, Scikit-learn ML, and automated reporting.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global friendly exception handling
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An unexpected analytical error occurred. Your dataset remains safe.",
            "detail": str(exc),
            "path": str(request.url.path)
        }
    )

# Include API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(datasets.router, prefix="/api")
app.include_router(clean.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(visualize.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(sql.router, prefix="/api")
app.include_router(reports.router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "ai_provider": settings.AI_PROVIDER
    }

# Serve built frontend static files if present (Unified fullstack deployment on Render)
import os
from fastapi.responses import FileResponse

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))
if not os.path.exists(frontend_dist):
    frontend_dist = os.path.abspath(os.path.join(os.getcwd(), "frontend/dist"))

if os.path.exists(frontend_dist) and os.path.isdir(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="static_assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api"):
            return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"detail": "Frontend build not found"})

