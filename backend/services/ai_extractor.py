"""Unified AI extraction service.

Consolidates document parsing, OCR hooks, and structured extraction for both
tender documents and vendor bid submissions. Inspired by the extraction
pipeline pattern from Agentic-Procure-Audit-AI but rewritten as a clean,
dependency-light service.

Pipeline:
    raw file path → parse text → [optional ML model] → structured output

Graceful fallback chain:
    1. If a pickle model is loaded (USE_ML=true), use it
    2. Otherwise run the deterministic mock pipeline
    3. On any error, return the mock — never crash the API

When real OCR is needed, plug PyMuPDF / pytesseract in `_parse_document_text`.
The rest of the pipeline remains unchanged.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

from models.schemas import Criteria
from services.ml_loader import ml_service
from services.ml_service import extract_criteria_from_tender, extract_vendor_data

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────
# Document parsing layer
# ──────────────────────────────────────────────────────────────

def _parse_document_text(file_path: Path) -> str:
    """Parse readable text from an uploaded document.

    For demo/dev:
      * Reads text-based files directly
      * Skips binary PDFs (returns empty string → triggers mock path)

    Production wiring (when ready):
      * PDF → PyMuPDF (`fitz.open(path).get_text()`)
      * Scanned PDF → pdf2image + pytesseract OCR
      * DOCX → python-docx
    """
    if not file_path.exists():
        return ""

    try:
        size = file_path.stat().st_size
        if size == 0 or size > 10_000_000:  # 10MB safety cap for demo
            return ""
        return file_path.read_text(errors="ignore")
    except Exception as exc:  # noqa: BLE001
        logger.debug("Could not parse %s as text: %s", file_path, exc)
        return ""


# ──────────────────────────────────────────────────────────────
# Public API — used by routes
# ──────────────────────────────────────────────────────────────

def extract_criteria_from_file(file_path: Optional[Path]) -> list[Criteria]:
    """Extract structured criteria from a tender document.

    Returns:
        list[Criteria] — always returns at least mock criteria, never empty.
    """
    text = _parse_document_text(file_path) if file_path else ""
    logger.info(
        "ai_extractor: criteria extraction (%d chars, ml=%s)",
        len(text),
        ml_service.criteria_model is not None,
    )
    return extract_criteria_from_tender(text)


def extract_vendor_snapshot(file_path: Optional[Path], vendor_name: str) -> dict:
    """Extract structured vendor submission data.

    Returns:
        dict with keys: technical_score, turnover_crores,
                        has_registrations, delivery_months
    """
    text = _parse_document_text(file_path) if file_path else ""
    logger.info(
        "ai_extractor: vendor extraction for %s (%d chars, ml=%s)",
        vendor_name,
        len(text),
        ml_service.vendor_model is not None,
    )
    return extract_vendor_data(text, vendor_name)
