"""Evaluation route: run ML extraction + rule engine."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Tuple

from fastapi import APIRouter

from models.schemas import AuditEntry, EvaluateRequest, VendorResult
from services.ai_extractor import extract_ml_evidence, extract_vendor_snapshot
from services.rule_engine import evaluate_vendor
from services.store import append_audit
from utils.helpers import generate_id, get_temp_path

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/evaluate", tags=["Evaluate"])

# In-memory cache for /results
evaluated_results: List[VendorResult] = []


def _resolve_vendor_path(vendor_id: str) -> Tuple[Optional[Path], str]:
    """Resolve the temp file path and extract the real filename for a vendor ID.

    Files are stored as {vendor_id}_{original_filename}. Returns (path, name).
    """
    direct = get_temp_path(vendor_id)
    if direct.exists():
        return direct, direct.name

    # Glob for {vendor_id}_* pattern (actual save format)
    temp_dir: Path = direct.parent
    candidates = list(temp_dir.glob(f"{vendor_id}_*"))
    if candidates:
        path = candidates[0]
        # Strip the vendor_id prefix to get the original filename
        raw_name = path.name[len(vendor_id) + 1:]  # skip "{id}_"
        vendor_name = Path(raw_name).stem  # drop extension
        return path, vendor_name

    return None, f"Vendor-{vendor_id[:6]}"


@router.post("", response_model=List[VendorResult])
async def evaluate_vendors(request: EvaluateRequest) -> List[VendorResult]:
    results: List[VendorResult] = []

    for vendor_id in request.vendor_file_ids:
        path, vendor_name = _resolve_vendor_path(vendor_id)

        # Try Railway ML extraction first; fall back to mock on failure
        ml_evidence = extract_ml_evidence(path, request.criteria)
        if ml_evidence is None:
            logger.info(
                "ML evidence unavailable for %s — using mock pipeline", vendor_name
            )
            vendor_data = extract_vendor_snapshot(path, vendor_name)
        else:
            vendor_data = {}  # not needed when ML evidence is available

        vendor_result = evaluate_vendor(
            vendor_name=vendor_name,
            vendor_id=vendor_id,
            vendor_data=vendor_data,
            criteria=request.criteria,
            ml_evidence=ml_evidence,
        )
        results.append(vendor_result)
        logger.info("Evaluated %s -> %s", vendor_name, vendor_result.final_verdict)

    append_audit(
        AuditEntry(
            id=generate_id("audit"),
            actor_name="System",
            actor_role="Rule Engine",
            action="evaluation.run",
            target=f"{len(results)} vendor(s)",
            note=(
                f"{sum(1 for r in results if r.final_verdict == 'Eligible')} eligible, "
                f"{sum(1 for r in results if r.final_verdict == 'Manual Review')} review, "
                f"{sum(1 for r in results if r.final_verdict == 'Not Eligible')} rejected"
            ),
            timestamp=datetime.now(timezone.utc).isoformat(),
        ).model_dump(by_alias=True)
    )

    global evaluated_results
    evaluated_results = results
    return results
