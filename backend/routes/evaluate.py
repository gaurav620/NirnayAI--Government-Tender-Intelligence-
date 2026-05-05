"""Evaluation route: run AI extraction + rule engine."""

import logging
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter

from models.schemas import AuditEntry, EvaluateRequest, VendorResult
from services.ai_extractor import extract_vendor_snapshot
from services.rule_engine import evaluate_vendor
from services.store import append_audit
from utils.helpers import generate_id, get_temp_path

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/evaluate", tags=["Evaluate"])

# In-memory cache for /results
evaluated_results: List[VendorResult] = []


@router.post("", response_model=List[VendorResult])
async def evaluate_vendors(request: EvaluateRequest) -> List[VendorResult]:
    results: List[VendorResult] = []

    for idx, vendor_id in enumerate(request.vendor_file_ids):
        path = get_temp_path(vendor_id)
        vendor_name = f"Vendor {idx + 1}"
        if not path.exists():
            temp_dir = path.parent
            candidates = list(temp_dir.glob(f"{vendor_id}*"))
            path = candidates[0] if candidates else None

        vendor_data = extract_vendor_snapshot(path, vendor_name)

        vendor_result = evaluate_vendor(
            vendor_name=vendor_name,
            vendor_id=vendor_id,
            vendor_data=vendor_data,
            criteria=request.criteria,
        )
        results.append(vendor_result)
        logger.info("Evaluated %s -> %s", vendor_name, vendor_result.final_verdict)

    # Audit the evaluation run
    append_audit(
        AuditEntry(
            id=generate_id("audit"),
            actor_name="System",
            actor_role="Rule Engine",
            action="evaluation.run",
            target=f"{len(results)} vendor(s)",
            note=f"{sum(1 for r in results if r.final_verdict == 'Eligible')} eligible, "
                 f"{sum(1 for r in results if r.final_verdict == 'Manual Review')} review, "
                 f"{sum(1 for r in results if r.final_verdict == 'Not Eligible')} rejected",
            timestamp=datetime.now(timezone.utc).isoformat(),
        ).model_dump(by_alias=True)
    )

    global evaluated_results
    evaluated_results = results
    return results
