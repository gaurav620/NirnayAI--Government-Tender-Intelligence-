"""Reports: shareable snapshots with multi-officer sign + lock."""

from __future__ import annotations

import logging
import secrets
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException

from models.schemas import (
    AuditEntry,
    CreateReportRequest,
    LockReportRequest,
    Report,
    Signature,
    SignReportRequest,
)
from services.store import append_audit, get_report, list_reports, save_report
from utils.helpers import generate_id

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["Reports"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _audit(action: str, target: str, actor_name: str, actor_role: str, note: str = "") -> None:
    entry = AuditEntry(
        id=generate_id("audit"),
        actor_name=actor_name,
        actor_role=actor_role,
        action=action,
        target=target,
        note=note,
        timestamp=_now(),
    )
    append_audit(entry.model_dump(by_alias=True))


@router.post("", response_model=Report)
async def create_report(request: CreateReportRequest) -> Report:
    token = secrets.token_urlsafe(10)
    report = Report(
        token=token,
        title=request.title,
        created_at=_now(),
        created_by=request.officer,
        criteria=request.criteria,
        vendors=request.vendors,
        signatures=[],
        locked=False,
    )
    save_report(token, report.model_dump(by_alias=True))
    _audit(
        action="report.created",
        target=f"report:{token}",
        actor_name=request.officer.name,
        actor_role=request.officer.role,
        note=f"Created report with {len(request.vendors)} vendor(s)",
    )
    logger.info("Created report %s by %s", token, request.officer.name)
    return report


@router.get("", response_model=List[Report])
async def list_all_reports() -> List[Report]:
    return [Report(**r) for r in list_reports()]


@router.get("/{token}", response_model=Report)
async def get_shared_report(token: str) -> Report:
    raw = get_report(token)
    if not raw:
        raise HTTPException(status_code=404, detail="Report not found")
    return Report(**raw)


@router.post("/{token}/sign", response_model=Report)
async def sign_report(token: str, request: SignReportRequest) -> Report:
    raw = get_report(token)
    if not raw:
        raise HTTPException(status_code=404, detail="Report not found")
    if raw.get("locked"):
        raise HTTPException(status_code=409, detail="Report is locked — signatures frozen")

    if request.decision not in {"approve", "reject", "override"}:
        raise HTTPException(status_code=400, detail="Invalid decision")

    report = Report(**raw)
    signature = Signature(
        officer=request.officer,
        decision=request.decision,
        note=request.note,
        signed_at=_now(),
    )
    report.signatures.append(signature)
    save_report(token, report.model_dump(by_alias=True))
    _audit(
        action="report.signed",
        target=f"report:{token}",
        actor_name=request.officer.name,
        actor_role=request.officer.role,
        note=f"Decision: {request.decision}. {request.note}".strip(),
    )
    logger.info("Report %s signed by %s (%s)", token, request.officer.name, request.decision)
    return report


@router.post("/{token}/lock", response_model=Report)
async def lock_report(token: str, request: LockReportRequest) -> Report:
    raw = get_report(token)
    if not raw:
        raise HTTPException(status_code=404, detail="Report not found")
    if raw.get("locked"):
        raise HTTPException(status_code=409, detail="Report already locked")

    report = Report(**raw)
    report.locked = True
    report.locked_at = _now()
    report.locked_by = request.officer
    save_report(token, report.model_dump(by_alias=True))
    _audit(
        action="report.locked",
        target=f"report:{token}",
        actor_name=request.officer.name,
        actor_role=request.officer.role,
        note=f"Report locked with {len(report.signatures)} signature(s)",
    )
    logger.info("Report %s locked by %s", token, request.officer.name)
    return report
