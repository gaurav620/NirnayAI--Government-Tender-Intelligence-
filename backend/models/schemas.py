from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


def to_camel(snake: str) -> str:
    """Convert snake_case to camelCase for frontend compatibility."""
    parts = snake.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


class _CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


# ─────────────────────────────────────────────
# Officer / multi-reviewer schemas
# ─────────────────────────────────────────────

class Officer(_CamelModel):
    id: str
    name: str
    role: str  # e.g. "Procurement Officer" | "Legal Reviewer" | "Finance Head"


class Signature(_CamelModel):
    officer: Officer
    decision: str  # "approve" | "reject" | "override"
    note: str = ""
    signed_at: str


class AuditEntry(_CamelModel):
    id: str
    actor_name: str
    actor_role: str
    action: str  # e.g. "evaluation.run" | "report.created" | "report.signed" | "report.locked"
    target: str  # e.g. "report:<token>" | "vendor:<id>"
    note: str = ""
    timestamp: str


class Report(_CamelModel):
    token: str
    title: str
    created_at: str
    created_by: Officer
    criteria: List["Criteria"]
    vendors: List["VendorResult"]
    signatures: List[Signature] = []
    locked: bool = False
    locked_at: Optional[str] = None
    locked_by: Optional[Officer] = None


class CreateReportRequest(_CamelModel):
    title: str = "Tender Evaluation Report"
    officer: Officer
    criteria: List["Criteria"]
    vendors: List["VendorResult"]


class SignReportRequest(_CamelModel):
    officer: Officer
    decision: str  # approve | reject | override
    note: str = ""


class LockReportRequest(_CamelModel):
    officer: Officer


class UploadResponse(_CamelModel):
    tender_file_id: str = Field(..., description="ID of the uploaded tender file")
    vendor_file_ids: List[str] = Field(default_factory=list, description="IDs of uploaded vendor files")
    message: str = "Files uploaded successfully"


class Criteria(_CamelModel):
    id: str
    description: str
    threshold: str
    mandatory: bool = False
    confirmed: bool = True


class CriteriaResponse(_CamelModel):
    criteria: List[Criteria]
    extraction_confidence: float = Field(0.91, ge=0.0, le=1.0)


class EvidenceItem(_CamelModel):
    criterion_name: str
    status: str  # "Eligible" | "Not Eligible" | "Manual Review"
    extracted_value: str
    required_threshold: str
    source_document: str
    reason: str
    confidence: float = Field(..., ge=0.0, le=1.0)


class VendorResult(_CamelModel):
    id: str
    name: str
    technical_status: str
    financial_status: str
    compliance_status: str
    final_verdict: str
    evidence: List[EvidenceItem]


class ExtractCriteriaRequest(_CamelModel):
    tender_file_id: str


class EvaluateRequest(_CamelModel):
    vendor_file_ids: List[str]
    criteria: List[Criteria]


class EvaluateResponse(_CamelModel):
    results: List[VendorResult]
    evaluated_at: str


# Resolve forward references for Report and CreateReportRequest
Report.model_rebuild()
CreateReportRequest.model_rebuild()
