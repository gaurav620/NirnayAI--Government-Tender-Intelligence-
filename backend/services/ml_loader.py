"""ML model loader with graceful fallback.

When the user provides pickle files (from Colab training), this module
loads them at startup and exposes predict functions. If no model is
available, it falls back to the deterministic mock logic.

To wire real models later:
    1. Train in Colab and export: pickle.dump(model, open('model.pkl', 'wb'))
    2. Drop the .pkl file somewhere accessible
    3. Set ML_MODEL_PATH in backend/.env
    4. Set USE_ML=true
    5. Restart the server
"""

import logging
import pickle
from pathlib import Path
from typing import Any, Optional

from config import settings

logger = logging.getLogger(__name__)


class MLService:
    def __init__(self) -> None:
        self.criteria_model: Optional[Any] = None
        self.vendor_model: Optional[Any] = None
        self.enabled = settings.USE_ML

    def load(self) -> None:
        if not self.enabled:
            logger.info("ML disabled — using deterministic mock logic")
            return

        if settings.ML_MODEL_PATH:
            path = Path(settings.ML_MODEL_PATH)
            if path.exists():
                try:
                    with open(path, "rb") as f:
                        self.criteria_model = pickle.load(f)
                    logger.info("Loaded criteria model: %s", path)
                except Exception as exc:  # noqa: BLE001
                    logger.warning("Failed to load criteria model: %s", exc)
            else:
                logger.warning("ML_MODEL_PATH set but file not found: %s", path)

        if settings.ML_VENDOR_MODEL_PATH:
            path = Path(settings.ML_VENDOR_MODEL_PATH)
            if path.exists():
                try:
                    with open(path, "rb") as f:
                        self.vendor_model = pickle.load(f)
                    logger.info("Loaded vendor model: %s", path)
                except Exception as exc:  # noqa: BLE001
                    logger.warning("Failed to load vendor model: %s", exc)
            else:
                logger.warning("ML_VENDOR_MODEL_PATH set but file not found: %s", path)

    def predict_criteria(self, tender_text: str) -> Optional[list]:
        """Return structured criteria list, or None to fall back to mock."""
        if not self.criteria_model:
            return None
        try:
            return self.criteria_model.predict(tender_text)
        except Exception as exc:  # noqa: BLE001
            logger.error("Criteria prediction failed: %s", exc)
            return None

    def predict_vendor_data(self, vendor_text: str) -> Optional[dict]:
        """Return vendor extraction dict, or None to fall back to mock."""
        if not self.vendor_model:
            return None
        try:
            return self.vendor_model.predict(vendor_text)
        except Exception as exc:  # noqa: BLE001
            logger.error("Vendor prediction failed: %s", exc)
            return None


ml_service = MLService()
