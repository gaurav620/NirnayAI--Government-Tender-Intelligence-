"""Unified AI extraction service — wired to Railway ML pipeline.

Calls the Railway-deployed nirnay-ml HTTP API for real OCR + LLM extraction.
Falls back to the deterministic mock pipeline if ML is unreachable or disabled.

Environment variables:
    ML_PIPELINE_URL  — Railway ML base URL (default: Railway production URL)
    USE_ML_HTTP      — Set to "true" to enable HTTP calls to Railway ML (default: "true")
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import List, Optional

import httpx

from models.schemas import Criteria, EvidenceItem
from services.ml_service import extract_criteria_from_tender, extract_vendor_data, evaluate_criterion

logger = logging.getLogger(__name__)

ML_PIPELINE_URL = os.getenv(
    "ML_PIPELINE_URL",
    "https://web-production-50a8f.up.railway.app",
).rstrip("/")

USE_ML_HTTP: bool = os.getenv("USE_ML_HTTP", "true").lower() == "true"

_HTTP_TIMEOUT = 120.0  # seconds — ML pipeline can be slow on first request (cold start)


# ──────────────────────────────────────────────────────────────
# Railway ML HTTP helpers
# ──────────────────────────────────────────────────────────────

def _read_file_bytes(file_path: Optional[Path]) -> Optional[bytes]:
    if file_path is None or not file_path.exists():
        return None
    try:
        return file_path.read_bytes()
    except OSError as exc:
        logger.warning("Could not read file %s: %s", file_path, exc)
        return None


def _call_extract_criteria(file_path: Path) -> Optional[List[Criteria]]:
    """POST file to Railway /extract-criteria; return Criteria list or None on failure."""
    file_bytes = _read_file_bytes(file_path)
    if not file_bytes:
        return None

    filename = file_path.name
    try:
        with httpx.Client(timeout=_HTTP_TIMEOUT) as client:
            resp = client.post(
                f"{ML_PIPELINE_URL}/extract-criteria",
                files={"file": (filename, file_bytes, "application/octet-stream")},
            )
            resp.raise_for_status()
            raw: list = resp.json()  # flat array of criterion dicts

        criteria: List[Criteria] = []
        for item in raw:
            try:
                # ML returns: id, label, description, type, mandatory, threshold, unit, extraction_confidence
                criteria.append(
                    Criteria(
                        id=item["id"],
                        description=item.get("description", item.get("label", "")),
                        threshold=str(item.get("threshold", "")),
                        mandatory=bool(item.get("mandatory", False)),
                        confirmed=True,
                        label=item.get("label"),
                        type=item.get("type"),
                        unit=item.get("unit"),
                        extraction_confidence=item.get("extraction_confidence"),
                    )
                )
            except (KeyError, TypeError) as exc:
                logger.debug("Skipping malformed criterion %s: %s", item, exc)

        logger.info("ML /extract-criteria returned %d criteria for %s", len(criteria), filename)
        return criteria if criteria else None

    except Exception as exc:
        logger.warning("ML /extract-criteria failed for %s: %s", filename, exc)
        return None


def _call_extract_values(
    file_path: Path,
    criteria: List[Criteria],
) -> Optional[List[EvidenceItem]]:
    """POST file + criteria to Railway /extract-values; return EvidenceItem list or None."""
    file_bytes = _read_file_bytes(file_path)
    if not file_bytes:
        return None

    filename = file_path.name
    # Send criteria as JSON matching the ML prompt format
    criteria_payload = json.dumps(
        [
            {
                "id": c.id,
                "label": c.label or c.description,
                "description": c.description,
                "type": c.type or "general",
                "mandatory": c.mandatory,
                "threshold": c.threshold,
                "unit": c.unit or "",
                "extraction_confidence": c.extraction_confidence or 0.9,
            }
            for c in criteria
            if c.confirmed
        ]
    )

    try:
        with httpx.Client(timeout=_HTTP_TIMEOUT) as client:
            resp = client.post(
                f"{ML_PIPELINE_URL}/extract-values",
                files={"file": (filename, file_bytes, "application/octet-stream")},
                data={"criteria": criteria_payload},
            )
            resp.raise_for_status()
            result: dict = resp.json()

        extractions: list = result.get("extractions", [])
        ocr_confidence: float = float(result.get("ocr_confidence", 0.5))
        criteria_by_id = {c.id: c for c in criteria}

        evidence_items: List[EvidenceItem] = []
        for ext in extractions:
            criterion_id: str = ext.get("criterion_id", "")
            criterion = criteria_by_id.get(criterion_id)
            routing: str = ext.get("routing", "MANUAL_REVIEW")
            value_found: bool = bool(ext.get("value_found", False))
            extracted_value: str = str(ext.get("extracted_value", "N/A"))
            confidence: float = float(ext.get("confidence", 0.5))
            source_section: str = ext.get("source_section", filename)
            notes: str = ext.get("notes", "")

            if routing == "MANUAL_REVIEW" or not value_found:
                status = "Manual Review"
                reason = notes or "Confidence below threshold — requires manual verification."
            else:
                # PASS_TO_RULE_ENGINE: compare extracted value against criterion threshold
                status = _apply_threshold_rule(
                    extracted_value,
                    criterion.threshold if criterion else "",
                    criterion.type if criterion else None,
                )
                reason = notes or (
                    f"Extracted '{extracted_value}' against threshold "
                    f"'{criterion.threshold if criterion else 'N/A'}'."
                )

            evidence_items.append(
                EvidenceItem(
                    criterion_name=(
                        (criterion.label or criterion.description)
                        if criterion
                        else criterion_id
                    ),
                    status=status,
                    extracted_value=extracted_value,
                    required_threshold=criterion.threshold if criterion else "N/A",
                    source_document=source_section,
                    reason=reason,
                    confidence=confidence,
                    routing=routing,
                    ocr_confidence=ocr_confidence,
                )
            )

        logger.info(
            "ML /extract-values returned %d extractions for %s", len(evidence_items), filename
        )
        return evidence_items if evidence_items else None

    except Exception as exc:
        logger.warning("ML /extract-values failed for %s: %s", filename, exc)
        return None


def _apply_threshold_rule(extracted_value: str, threshold: str, criterion_type: Optional[str]) -> str:
    """Simple rule engine: compare numeric extracted value against threshold string.

    Returns "Eligible" or "Not Eligible". Falls back to "Manual Review" if
    values can't be parsed as numbers.
    """
    import re

    def extract_number(s: str) -> Optional[float]:
        m = re.search(r"[\d,]+(?:\.\d+)?", s.replace(",", ""))
        if m:
            try:
                return float(m.group(0).replace(",", ""))
            except ValueError:
                return None
        return None

    extracted_num = extract_number(extracted_value)
    threshold_num = extract_number(threshold)

    if extracted_num is None or threshold_num is None:
        # Non-numeric: check for presence (boolean compliance criteria)
        val_lower = extracted_value.lower()
        if any(word in val_lower for word in ("valid", "yes", "true", "compliant", "registered")):
            return "Eligible"
        if any(word in val_lower for word in ("invalid", "no", "false", "missing", "expired")):
            return "Not Eligible"
        return "Manual Review"

    # For financial/technical criteria: extracted must be >= threshold
    if criterion_type in ("financial", "technical", None):
        return "Eligible" if extracted_num >= threshold_num else "Not Eligible"

    # For deadline/timeline criteria: extracted must be <= threshold
    if criterion_type == "timeline":
        return "Eligible" if extracted_num <= threshold_num else "Not Eligible"

    return "Eligible" if extracted_num >= threshold_num else "Not Eligible"


# ──────────────────────────────────────────────────────────────
# Public API — used by routes
# ──────────────────────────────────────────────────────────────

def extract_criteria_from_file(file_path: Optional[Path]) -> List[Criteria]:
    """Extract structured criteria from a tender document.

    Calls Railway ML /extract-criteria if USE_ML_HTTP is enabled.
    Falls back to deterministic mock criteria on failure or when disabled.

    Returns:
        list[Criteria] — always returns at least mock criteria, never empty.
    """
    if USE_ML_HTTP and file_path and file_path.exists():
        ml_result = _call_extract_criteria(file_path)
        if ml_result:
            return ml_result
        logger.warning("ML criteria extraction failed — falling back to mock data")

    # Fallback: deterministic mock (keeps demo functional when ML is unreachable)
    logger.info("ai_extractor: using mock criteria pipeline")
    return extract_criteria_from_tender("")


def extract_ml_evidence(
    file_path: Optional[Path],
    criteria: List[Criteria],
) -> Optional[List[EvidenceItem]]:
    """Extract evidence items from a vendor document using Railway ML.

    Returns List[EvidenceItem] on success, None if ML is disabled or fails
    (caller should fall back to mock pipeline).
    """
    if not USE_ML_HTTP or not file_path or not file_path.exists():
        return None
    return _call_extract_values(file_path, criteria)


def extract_vendor_snapshot(file_path: Optional[Path], vendor_name: str) -> dict:
    """Extract vendor submission data (mock/pickle path — used as fallback).

    Returns:
        dict with keys: technical_score, turnover_crores,
                        has_registrations, delivery_months
    """
    logger.info("ai_extractor: vendor snapshot (mock) for %s", vendor_name)
    return extract_vendor_data("", vendor_name)
