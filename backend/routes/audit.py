"""Audit log endpoints — read-only timeline of decisions."""

import logging
from typing import List

from fastapi import APIRouter

from models.schemas import AuditEntry
from services.store import list_audit

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("", response_model=List[AuditEntry])
async def get_audit_log(limit: int = 200) -> List[AuditEntry]:
    """Return the most recent audit entries (newest first)."""
    return [AuditEntry(**e) for e in list_audit(limit=limit)]
