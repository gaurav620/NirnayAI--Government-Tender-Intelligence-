"""ML extraction service with pickle model integration.

If a real ML model is loaded via `services.ml_loader.ml_service`, its
predictions are used. Otherwise, falls back to deterministic mock data
so the system remains fully functional during development and for demos.
"""

import random
from typing import List

from models.schemas import Criteria, EvidenceItem
from services.ml_loader import ml_service


def extract_criteria_from_tender(tender_text: str) -> List[Criteria]:
    """Extract criteria using ML model if available, else deterministic mock."""
    predicted = ml_service.predict_criteria(tender_text)
    if predicted:
        try:
            return [Criteria(**item) if isinstance(item, dict) else item for item in predicted]
        except Exception:
            pass  # Fall through to mock on shape mismatch

    return [
        Criteria(
            id="crit-001",
            description="Minimum technical capability score",
            threshold="75 marks",
            mandatory=True,
            confirmed=True,
        ),
        Criteria(
            id="crit-002",
            description="Average annual turnover",
            threshold="INR 50 crores",
            mandatory=True,
            confirmed=True,
        ),
        Criteria(
            id="crit-003",
            description="Valid statutory registrations and non-blacklisting certificate",
            threshold="Valid",
            mandatory=True,
            confirmed=True,
        ),
        Criteria(
            id="crit-004",
            description="Delivery timeline compliance",
            threshold="Within 6 months",
            mandatory=False,
            confirmed=True,
        ),
    ]


def extract_vendor_data(vendor_text: str, vendor_name: str) -> dict:
    """Extract vendor submission data using ML model if available, else mock."""
    predicted = ml_service.predict_vendor_data(vendor_text)
    if predicted and isinstance(predicted, dict):
        return predicted

    # Deterministic random based on vendor name for demo consistency
    seed = sum(ord(c) for c in vendor_name)
    rng = random.Random(seed)

    return {
        "technical_score": rng.choice([68, 78, 82, 91, 65, 74]),
        "turnover_crores": rng.choice([35, 52, 75, 120, 45, 60]),
        "has_registrations": rng.choice([True, True, False, True]),
        "delivery_months": rng.choice([4, 5, 6, 7, 8]),
    }


def evaluate_criterion(
    criterion: Criteria,
    vendor_data: dict,
    vendor_name: str,
) -> EvidenceItem:
    """Evaluate a single criterion against vendor data."""
    value = ""
    status = "Manual Review"
    reason = ""
    confidence = 0.85

    if criterion.id == "crit-001":
        score = vendor_data.get("technical_score", 0)
        value = f"{score} marks"
        threshold_num = 75
        if score >= threshold_num:
            status = "Eligible"
            reason = f"Technical score ({score}) meets the required threshold of {threshold_num} marks."
        else:
            status = "Not Eligible"
            reason = f"Technical score ({score}) is below the required threshold of {threshold_num} marks."
        confidence = 0.94

    elif criterion.id == "crit-002":
        turnover = vendor_data.get("turnover_crores", 0)
        value = f"INR {turnover} crores"
        threshold_num = 50
        if turnover >= threshold_num:
            status = "Eligible"
            reason = f"Annual turnover (INR {turnover} crores) meets the minimum requirement of INR {threshold_num} crores."
        else:
            status = "Not Eligible"
            reason = f"Annual turnover (INR {turnover} crores) is below the minimum requirement of INR {threshold_num} crores."
        confidence = 0.91

    elif criterion.id == "crit-003":
        has_reg = vendor_data.get("has_registrations", False)
        value = "Valid" if has_reg else "Missing"
        if has_reg:
            status = "Eligible"
            reason = "Vendor holds valid statutory registrations and non-blacklisting certificate."
        else:
            status = "Not Eligible"
            reason = "Vendor is missing required statutory registrations or blacklisting clearance."
        confidence = 0.97

    elif criterion.id == "crit-004":
        months = vendor_data.get("delivery_months", 0)
        value = f"{months} months"
        if months <= 6:
            status = "Eligible"
            reason = f"Proposed delivery timeline ({months} months) is within the acceptable window."
        else:
            status = "Manual Review"
            reason = f"Proposed delivery timeline ({months} months) exceeds preference; may be considered during final review."
        confidence = 0.88

    else:
        value = "N/A"
        status = "Manual Review"
        reason = "Unable to evaluate criterion with available data."
        confidence = 0.5

    return EvidenceItem(
        criterion_name=criterion.description,
        status=status,
        extracted_value=value,
        required_threshold=criterion.threshold,
        source_document=f"{vendor_name}_submission.pdf",
        reason=reason,
        confidence=confidence,
    )
