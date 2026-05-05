"""Simple JSON-file-backed store for reports and audit entries.

Demo-grade persistence. For production, replace with Postgres / SQLite
behind the same interface.
"""

from __future__ import annotations

import json
import logging
import threading
from pathlib import Path
from typing import Any

from config import settings

logger = logging.getLogger(__name__)

_STORE_PATH = Path(settings.TEMP_UPLOAD_DIR).parent / "store.json"
_LOCK = threading.Lock()


def _default_state() -> dict[str, Any]:
    return {"reports": {}, "audit": []}


def _load() -> dict[str, Any]:
    if not _STORE_PATH.exists():
        return _default_state()
    try:
        return json.loads(_STORE_PATH.read_text())
    except Exception as exc:  # noqa: BLE001
        logger.warning("Corrupt store.json, resetting: %s", exc)
        return _default_state()


def _save(state: dict[str, Any]) -> None:
    _STORE_PATH.write_text(json.dumps(state, indent=2, default=str))


# ─────────── Report helpers ───────────

def get_report(token: str) -> dict | None:
    with _LOCK:
        return _load()["reports"].get(token)


def save_report(token: str, report: dict) -> None:
    with _LOCK:
        state = _load()
        state["reports"][token] = report
        _save(state)


def list_reports() -> list[dict]:
    with _LOCK:
        reports = _load()["reports"]
        return list(reports.values())


# ─────────── Audit helpers ───────────

def append_audit(entry: dict) -> None:
    with _LOCK:
        state = _load()
        state["audit"].append(entry)
        _save(state)


def list_audit(limit: int = 200) -> list[dict]:
    with _LOCK:
        entries = _load()["audit"]
        return entries[-limit:][::-1]  # newest first
