"""Results route: return all vendor evaluations."""

import logging
from typing import List

from fastapi import APIRouter

from models.schemas import VendorResult
from routes.evaluate import evaluated_results

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/results", tags=["Results"])


@router.get("", response_model=List[VendorResult])
async def get_results() -> List[VendorResult]:
    if not evaluated_results:
        logger.info("No results yet; returning demo data")
        return _demo_results()
    return evaluated_results


def _demo_results() -> List[VendorResult]:
    """Return hard-coded demo results when no evaluation has run yet."""
    from models.schemas import EvidenceItem

    return [
        VendorResult(
            id="vendor-1",
            name="Vendor A",
            technical_status="Eligible",
            financial_status="Eligible",
            compliance_status="Eligible",
            final_verdict="Eligible",
            evidence=[
                EvidenceItem(
                    criterion_name="Minimum technical capability score",
                    status="Eligible",
                    extracted_value="82 marks",
                    required_threshold="75 marks",
                    source_document="Vendor A_submission.pdf",
                    reason="Technical score (82) meets the required threshold of 75 marks.",
                    confidence=0.94,
                ),
                EvidenceItem(
                    criterion_name="Average annual turnover",
                    status="Eligible",
                    extracted_value="INR 75 crores",
                    required_threshold="INR 50 crores",
                    source_document="Vendor A_submission.pdf",
                    reason="Annual turnover (INR 75 crores) meets the minimum requirement of INR 50 crores.",
                    confidence=0.91,
                ),
                EvidenceItem(
                    criterion_name="Valid statutory registrations and non-blacklisting certificate",
                    status="Eligible",
                    extracted_value="Valid",
                    required_threshold="Valid",
                    source_document="Vendor A_submission.pdf",
                    reason="Vendor holds valid statutory registrations and non-blacklisting certificate.",
                    confidence=0.97,
                ),
            ],
        ),
        VendorResult(
            id="vendor-2",
            name="Vendor B",
            technical_status="Not Eligible",
            financial_status="Eligible",
            compliance_status="Eligible",
            final_verdict="Not Eligible",
            evidence=[
                EvidenceItem(
                    criterion_name="Minimum technical capability score",
                    status="Not Eligible",
                    extracted_value="65 marks",
                    required_threshold="75 marks",
                    source_document="Vendor B_submission.pdf",
                    reason="Technical score (65) is below the required threshold of 75 marks.",
                    confidence=0.94,
                ),
                EvidenceItem(
                    criterion_name="Average annual turnover",
                    status="Eligible",
                    extracted_value="INR 120 crores",
                    required_threshold="INR 50 crores",
                    source_document="Vendor B_submission.pdf",
                    reason="Annual turnover (INR 120 crores) meets the minimum requirement of INR 50 crores.",
                    confidence=0.91,
                ),
                EvidenceItem(
                    criterion_name="Valid statutory registrations and non-blacklisting certificate",
                    status="Eligible",
                    extracted_value="Valid",
                    required_threshold="Valid",
                    source_document="Vendor B_submission.pdf",
                    reason="Vendor holds valid statutory registrations and non-blacklisting certificate.",
                    confidence=0.97,
                ),
            ],
        ),
        VendorResult(
            id="vendor-3",
            name="Vendor C",
            technical_status="Eligible",
            financial_status="Not Eligible",
            compliance_status="Manual Review",
            final_verdict="Not Eligible",
            evidence=[
                EvidenceItem(
                    criterion_name="Minimum technical capability score",
                    status="Eligible",
                    extracted_value="91 marks",
                    required_threshold="75 marks",
                    source_document="Vendor C_submission.pdf",
                    reason="Technical score (91) meets the required threshold of 75 marks.",
                    confidence=0.94,
                ),
                EvidenceItem(
                    criterion_name="Average annual turnover",
                    status="Not Eligible",
                    extracted_value="INR 35 crores",
                    required_threshold="INR 50 crores",
                    source_document="Vendor C_submission.pdf",
                    reason="Annual turnover (INR 35 crores) is below the minimum requirement of INR 50 crores.",
                    confidence=0.91,
                ),
                EvidenceItem(
                    criterion_name="Valid statutory registrations and non-blacklisting certificate",
                    status="Manual Review",
                    extracted_value="Missing",
                    required_threshold="Valid",
                    source_document="Vendor C_submission.pdf",
                    reason="Vendor is missing required statutory registrations or blacklisting clearance.",
                    confidence=0.97,
                ),
            ],
        ),
    ]
