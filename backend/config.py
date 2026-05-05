"""Centralized configuration loaded from environment variables."""

import os
from pathlib import Path

try:
    from dotenv import load_dotenv

    # Load .env from backend root
    load_dotenv(Path(__file__).resolve().parent / ".env")
except ImportError:
    pass


class Settings:
    # App
    APP_NAME: str = os.getenv("APP_NAME", "NirnayAI Backend")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # CORS — comma-separated list of allowed origins
    CORS_ORIGINS: list[str] = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")

    # File storage
    TEMP_UPLOAD_DIR: Path = Path(
        os.getenv(
            "TEMP_UPLOAD_DIR",
            str(Path(__file__).resolve().parent / "temp_uploads"),
        )
    )
    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "50"))

    # ML integration — to be wired when pickle files are ready
    ML_MODEL_PATH: str = os.getenv("ML_MODEL_PATH", "")  # e.g. ./models/criteria_extractor.pkl
    ML_VENDOR_MODEL_PATH: str = os.getenv("ML_VENDOR_MODEL_PATH", "")
    USE_ML: bool = os.getenv("USE_ML", "false").lower() == "true"

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")


settings = Settings()
settings.TEMP_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
