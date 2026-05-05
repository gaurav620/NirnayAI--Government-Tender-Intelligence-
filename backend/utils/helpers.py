import os
import uuid
from pathlib import Path

from config import settings

TEMP_DIR = settings.TEMP_UPLOAD_DIR
TEMP_DIR.mkdir(parents=True, exist_ok=True)


def generate_id(prefix: str = "file") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:12]}"


def get_temp_path(file_id: str, filename: str = "") -> Path:
    if filename:
        return TEMP_DIR / f"{file_id}_{filename}"
    return TEMP_DIR / file_id


def save_temp_file(file_id: str, filename: str, content: bytes) -> Path:
    path = get_temp_path(file_id, filename)
    with open(path, "wb") as f:
        f.write(content)
    return path


def cleanup_temp_files():
    for f in TEMP_DIR.iterdir():
        try:
            f.unlink()
        except OSError:
            pass
