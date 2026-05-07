"""Deterministic rule engine for vendor evaluation."""

from __future__ import annotations

from typing import List, Optional

from models.schemas import Criteria, EvidenceItem, VendorResult


def determine_final_verdict(evidence: List[EvidenceItem], criteria: List[Criteria]) -> str:
    """Determine final verdict based on mandatory criterion outcomes.

    Rules:
    - If any mandatory criterion is Not Eligible -> Not Eligible
    - If any mandatory criterion is Manual Review -> Manual Review
    - Otherwise -> Eligible
    """
    # Build name → mandatory map; include both description and label for ML criteria
    mandatory_map: dict[str, bool] = {}
    for c in criteria:
        mandatory_map[c.description] = c.mandatory
        if c.label:
            mandatory_map[c.label] = c.mandatory

    mandatory_fail = False
    mandatory_uncertain = False

    for item in evidence:
        is_mandatory = mandatory_map.get(item.criterion_name, False)
        if not is_mandatory:
            continue
        if item.status == "Not Eligible":
            mandatory_fail = True
        elif item.status == "Manual Review":
            mandatory_uncertain = True

    if mandatory_fail:
        return "Not Eligible"
    if mandatory_uncertain:
        return "Manual Review"
    return "Eligible"


def derive_category_status(
    evidence: List[EvidenceItem],
    category: str,
    criteria: List[Criteria],
) -> str:
    """Derive a category-level status from evidence items.

    Prefers the ML `type` field on Criteria for matching. Falls back to
    keyword matching on criterion_name when `type` is not populated.
    """
    # Build a name → type map from ML criteria
    type_by_name: dict[str, str] = {}
    for c in criteria:
        if c.type:
            key = c.label or c.description
            type_by_name[key] = c.type

    items: List[EvidenceItem] = []
    for e in evidence:
        ml_type = type_by_name.get(e.criterion_name)
        if ml_type:
            # ML-typed criterion: match by type field directly
            if ml_type == category:
                items.append(e)
        else:
            # Fallback: keyword matching on criterion name
            name_lower = e.criterion_name.lower()
            if category == "technical" and "technical" in name_lower:
                items.append(e)
            elif category == "financial" and (
                "turnover" in name_lower or "financial" in name_lower
            ):
                items.append(e)
            elif category == "compliance" and (
                "registration" in name_lower
                or "blacklist" in name_lower
                or "compliance" in name_lower
                or "statutory" in name_lower
            ):
                items.append(e)

    if not items:
        return "Manual Review"

    statuses = [i.status for i in items]
    if "Not Eligible" in statuses:
        return "Not Eligible"
    if "Manual Review" in statuses:
        return "Manual Review"
    return "Eligible"


def evaluate_vendor(
    vendor_name: str,
    vendor_id: str,
    vendor_data: dict,
    criteria: List[Criteria],
    ml_evidence: Optional[List[EvidenceItem]] = None,
) -> VendorResult:
    """Full evaluation pipeline for a single vendor.

    Uses ML evidence directly when provided (Railway /extract-values path).
    Falls back to mock evaluate_criterion when ml_evidence is None.
    """
    from services.ml_service import evaluate_criterion

    if ml_evidence is not None:
        evidence = ml_evidence
    else:
        evidence = [
            evaluate_criterion(c, vendor_data, vendor_name)
            for c in criteria
            if c.confirmed
        ]

    final_verdict = determine_final_verdict(evidence, criteria)

    return VendorResult(
        id=vendor_id,
        name=vendor_name,
        technical_status=derive_category_status(evidence, "technical", criteria),
        financial_status=derive_category_status(evidence, "financial", criteria),
        compliance_status=derive_category_status(evidence, "compliance", criteria),
        final_verdict=final_verdict,
        evidence=evidence,
    )
