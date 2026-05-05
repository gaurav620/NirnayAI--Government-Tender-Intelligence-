"""NirnayAI FastAPI backend.

Run with:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from config import settings
from routes import (
    audit_router,
    criteria_router,
    evaluate_router,
    reports_router,
    results_router,
    upload_router,
)
from services.ml_loader import ml_service
from utils.helpers import cleanup_temp_files

# Logging setup
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info("Starting %s v%s (%s)", settings.APP_NAME, settings.APP_VERSION, settings.ENVIRONMENT)
    logger.info("CORS origins: %s", settings.CORS_ORIGINS)
    logger.info("ML enabled: %s", settings.USE_ML)
    logger.info("=" * 60)
    cleanup_temp_files()
    ml_service.load()
    yield
    logger.info("Shutting down %s", settings.APP_NAME)


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-based tender evaluation system API — explainable, deterministic, officer-verified.",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler — never leak internals to client
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "path": request.url.path,
        },
    )


# Routes
app.include_router(upload_router)
app.include_router(criteria_router)
app.include_router(evaluate_router)
app.include_router(results_router)
app.include_router(reports_router)
app.include_router(audit_router)


@app.get("/", include_in_schema=False)
async def root_redirect():
    return RedirectResponse(url="/docs")


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "ml_enabled": settings.USE_ML,
        "ml_criteria_model_loaded": ml_service.criteria_model is not None,
        "ml_vendor_model_loaded": ml_service.vendor_model is not None,
    }
