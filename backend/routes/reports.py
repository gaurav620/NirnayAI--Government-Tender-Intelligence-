"""Reports: shareable snapshots with multi-officer sign + lock."""

from __future__ import annotations

import logging
import secrets
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse

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


@router.get("/{token}/pdf", response_class=HTMLResponse)
async def export_report_pdf(token: str) -> HTMLResponse:
    """Return a print-optimized HTML page the browser can save as PDF."""
    raw = get_report(token)
    if not raw:
        raise HTTPException(status_code=404, detail="Report not found")

    report = Report(**raw)

    def verdict_color(v: str) -> str:
        v = v.upper()
        if "ELIGIBLE" in v and "NOT" not in v:
            return "#16a34a"
        if "NOT" in v or "REJECT" in v:
            return "#dc2626"
        return "#d97706"

    def sig_color(d: str) -> str:
        return {"approve": "#16a34a", "reject": "#dc2626"}.get(d.lower(), "#d97706")

    def conf_bar(v: float) -> str:
        pct = round(v * 100)
        color = "#16a34a" if pct >= 80 else "#d97706" if pct >= 50 else "#dc2626"
        return (
            f'<div style="display:flex;align-items:center;gap:6px">'
            f'<div style="flex:1;background:#e2e8f0;height:6px;border-radius:3px">'
            f'<div style="width:{pct}%;height:6px;border-radius:3px;background:{color}"></div>'
            f'</div><span style="font-size:10px;font-weight:700;color:#64748b;width:32px">{pct}%</span>'
            f'</div>'
        )

    # ── Vendor sections ────────────────────────────────────────────────────
    vendor_html = ""
    for v in report.vendors:
        rows = ""
        for e in v.evidence:
            status_color = verdict_color(e.status)
            rows += (
                f'<tr>'
                f'<td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;font-size:12px">{e.criterion_name}</td>'
                f'<td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;font-size:12px">{e.extracted_value}</td>'
                f'<td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;font-size:12px">{e.required_threshold}</td>'
                f'<td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;font-size:11px;color:{status_color};font-weight:700">{e.status}</td>'
                f'<td style="padding:8px 10px;border-bottom:1px solid #f1f5f9">{conf_bar(e.confidence)}</td>'
                f'<td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#64748b">{e.reason}</td>'
                f'</tr>'
            )
        vc = verdict_color(v.final_verdict)
        vendor_html += f"""
        <div style="margin-bottom:28px;border:1px solid #e2e8f0;border-radius:4px;overflow:hidden;break-inside:avoid">
          <div style="background:#f8fafc;padding:14px 16px;border-bottom:2px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:15px;font-weight:900;color:#003366;text-transform:uppercase;letter-spacing:.5px">{v.name}</span>
            <span style="font-size:11px;font-weight:900;color:{vc};text-transform:uppercase;letter-spacing:1px;padding:3px 10px;border:2px solid {vc};border-radius:3px">{v.final_verdict}</span>
          </div>
          <div style="padding:10px 16px 4px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;background:#fff">
            <div><span style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Technical</span>
              <div style="font-size:12px;font-weight:700;color:{verdict_color(v.technical_status)}">{v.technical_status}</div></div>
            <div><span style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Financial</span>
              <div style="font-size:12px;font-weight:700;color:{verdict_color(v.financial_status)}">{v.financial_status}</div></div>
            <div><span style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Compliance</span>
              <div style="font-size:12px;font-weight:700;color:{verdict_color(v.compliance_status)}">{v.compliance_status}</div></div>
          </div>
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#f1f5f9">
                  <th style="padding:8px 10px;text-align:left;font-size:9px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:1px">Criterion</th>
                  <th style="padding:8px 10px;text-align:left;font-size:9px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:1px">Extracted</th>
                  <th style="padding:8px 10px;text-align:left;font-size:9px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:1px">Required</th>
                  <th style="padding:8px 10px;text-align:left;font-size:9px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:1px">Status</th>
                  <th style="padding:8px 10px;text-align:left;font-size:9px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:1px">Confidence</th>
                  <th style="padding:8px 10px;text-align:left;font-size:9px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:1px">Reason</th>
                </tr>
              </thead>
              <tbody>{rows or "<tr><td colspan='6' style='padding:12px 10px;text-align:center;color:#94a3b8;font-size:12px'>No evidence recorded</td></tr>"}</tbody>
            </table>
          </div>
        </div>"""

    # ── Criteria reference ─────────────────────────────────────────────────
    criteria_rows = ""
    for c in report.criteria:
        mand = '<span style="color:#FF9933;font-weight:900;font-size:10px">●</span> Mandatory' if c.mandatory else "Optional"
        criteria_rows += (
            f'<tr>'
            f'<td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:11px;font-family:monospace;color:#64748b">{c.id}</td>'
            f'<td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px">{c.label or c.description}</td>'
            f'<td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:700;color:#003366">{c.threshold}</td>'
            f'<td style="padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:11px">{mand}</td>'
            f'</tr>'
        )

    # ── Signatures ─────────────────────────────────────────────────────────
    sig_html = ""
    for s in report.signatures:
        sc = sig_color(s.decision)
        sig_html += f"""
        <div style="border:1px solid #e2e8f0;padding:14px 18px;border-radius:4px;break-inside:avoid">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:14px;font-weight:900;color:#003366">{s.officer.name}</div>
              <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-top:2px">{s.officer.role}</div>
            </div>
            <span style="font-size:11px;font-weight:900;color:{sc};text-transform:uppercase;letter-spacing:1px;padding:3px 10px;border:2px solid {sc};border-radius:3px">{s.decision}</span>
          </div>
          {f'<div style="margin-top:8px;font-size:12px;color:#475569;border-left:3px solid {sc};padding-left:10px">{s.note}</div>' if s.note else ""}
          <div style="margin-top:8px;font-size:10px;color:#94a3b8">{s.signed_at}</div>
        </div>"""

    lock_banner = ""
    if report.locked and report.locked_by:
        lock_banner = f"""
        <div style="background:#fef9c3;border:1px solid #fde047;padding:10px 16px;border-radius:4px;margin-bottom:24px;font-size:12px;font-weight:700;color:#854d0e">
          LOCKED — {report.locked_by.name} ({report.locked_by.role}) · {report.locked_at or ""}
        </div>"""

    eligible_count = sum(1 for v in report.vendors if "NOT" not in v.final_verdict.upper() and "REJECT" not in v.final_verdict.upper() and "ELIGIBLE" in v.final_verdict.upper())
    review_count = sum(1 for v in report.vendors if "REVIEW" in v.final_verdict.upper() or "MANUAL" in v.final_verdict.upper())
    rejected_count = len(report.vendors) - eligible_count - review_count

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>{report.title}</title>
  <style>
    @media print {{
      body {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
      .no-print {{ display: none !important; }}
      @page {{ margin: 18mm 16mm; size: A4; }}
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #1e293b; }}
    .page {{ max-width: 960px; margin: 0 auto; padding: 32px 24px; }}
    h2 {{ font-size: 13px; font-weight: 900; color: #003366; text-transform: uppercase; letter-spacing: 1px; margin: 28px 0 12px; border-bottom: 2px solid #FF9933; padding-bottom: 6px; display: inline-block; }}
    .sig-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }}
  </style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div style="border-top:4px solid #003366;border-bottom:2px solid #FF9933;padding:20px 0 16px;margin-bottom:28px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div style="font-size:22px;font-weight:900;color:#003366;text-transform:uppercase;letter-spacing:.5px">{report.title}</div>
        <div style="font-size:11px;color:#64748b;margin-top:6px">
          Created by <strong>{report.created_by.name}</strong> ({report.created_by.role}) &nbsp;·&nbsp; {report.created_at}
        </div>
        <div style="font-size:10px;color:#94a3b8;margin-top:4px;font-family:monospace">Token: {report.token}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:10px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">NirnayAI</div>
        <div style="font-size:10px;color:#94a3b8">Procurement Intelligence</div>
        {"<div style='margin-top:6px;font-size:10px;font-weight:900;color:#dc2626;border:1px solid #dc2626;padding:2px 8px;border-radius:3px'>LOCKED</div>" if report.locked else ""}
      </div>
    </div>
  </div>

  {lock_banner}

  <!-- Summary Stats -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:28px">
    {"".join(f'<div style="border:1px solid #e2e8f0;padding:14px;border-radius:4px"><div style="font-size:9px;font-weight:900;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">{lbl}</div><div style="font-size:26px;font-weight:900;color:{col}">{val}</div></div>' for lbl, val, col in [("Total Vendors", len(report.vendors), "#003366"), ("Eligible", eligible_count, "#16a34a"), ("Manual Review", review_count, "#d97706"), ("Rejected", rejected_count, "#dc2626")])}
  </div>

  <!-- Vendor Results -->
  <h2>Vendor Evaluation Results</h2>
  <div style="margin-top:16px">{vendor_html or "<p style='color:#94a3b8;font-size:13px'>No vendor results.</p>"}</div>

  <!-- Criteria Reference -->
  <h2>Criteria Reference</h2>
  <div style="margin-top:12px;border:1px solid #e2e8f0;border-radius:4px;overflow:hidden">
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f1f5f9">
          <th style="padding:8px 10px;text-align:left;font-size:9px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:1px">ID</th>
          <th style="padding:8px 10px;text-align:left;font-size:9px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:1px">Criterion</th>
          <th style="padding:8px 10px;text-align:left;font-size:9px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:1px">Threshold</th>
          <th style="padding:8px 10px;text-align:left;font-size:9px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:1px">Type</th>
        </tr>
      </thead>
      <tbody>{criteria_rows or "<tr><td colspan='4' style='padding:12px;text-align:center;color:#94a3b8'>No criteria defined</td></tr>"}</tbody>
    </table>
  </div>

  <!-- Signatures -->
  <h2>Officer Signatures</h2>
  <div class="sig-grid" style="margin-top:12px">
    {sig_html or "<p style='color:#94a3b8;font-size:13px'>No signatures yet.</p>"}
  </div>

  <!-- Print Button -->
  <div class="no-print" style="margin-top:32px;text-align:center">
    <button onclick="window.print()"
      style="background:#003366;color:#fff;border:none;padding:12px 32px;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:2px;cursor:pointer;border-radius:2px">
      Save as PDF / Print
    </button>
  </div>

  <!-- Footer -->
  <div style="margin-top:36px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;display:flex;justify-content:space-between">
    <span>NirnayAI — Procurement Intelligence Platform</span>
    <span>Generated: {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")}</span>
  </div>
</div>
</body>
</html>"""

    return HTMLResponse(
        content=html,
        headers={"Content-Disposition": f'inline; filename="report-{token}.html"'},
    )
