"""Deterministic rule engine for vendor evaluation."""

from typing import List

from models.schemas import Criteria, EvidenceItem, VendorResult


def determine_final_verdict(evidence: List[EvidenceItem], criteria: List[Criteria]) -> str:
    """Determine final verdict based on mandatory criterion outcomes.

    Rules:
    - If any mandatory criterion fails (Not Eligible) -> Not Eligible
    - If any mandatory criterion is uncertain (Manual Review) -> Manual Review
    - Otherwise -> Eligible
    """
    # Map criteria by description for mandatory lookup
    mandatory_map = {c.description: c.mandatory for c in criteria}

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


def derive_category_status(evidence: List[EvidenceItem], category: str) -> str:
    """Derive a category-level status from evidence items.

    Simplified mapping by criterion keywords.
    """
    items = []
    if category == "technical":
        items = [e for e in evidence if "technical" in e.criterion_name.lower()]
    elif category == "financial":
        items = [e for e in evidence if "turnover" in e.criterion_name.lower() or "financial" in e.criterion_name.lower()]
    elif category == "compliance":
        items = [e for e in evidence if "registration" in e.criterion_name.lower() or "blacklist" in e.criterion_name.lower() or "compliance" in e.criterion_name.lower()]

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
) -> VendorResult:
    """Full evaluation pipeline for a single vendor."""
    from services.ml_service import evaluate_criterion

    evidence = [evaluate_criterion(c, vendor_data, vendor_name) for c in criteria if c.confirmed]

    final_verdict = determine_final_verdict(evidence, criteria)

    return VendorResult(
        id=vendor_id,
        name=vendor_name,
        technical_status=derive_category_status(evidence, "technical"),
        financial_status=derive_category_status(evidence, "financial"),
        compliance_status=derive_category_status(evidence, "compliance"),
        final_verdict=final_verdict,
        evidence=evidence,
    )
