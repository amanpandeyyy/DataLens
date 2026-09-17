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

