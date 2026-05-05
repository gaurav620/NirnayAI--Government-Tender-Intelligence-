"""Criteria extraction route."""

import logging
from typing import List

from fastapi import APIRouter

from models.schemas import Criteria, ExtractCriteriaRequest
from services.ai_extractor import extract_criteria_from_file
from utils.helpers import get_temp_path

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/extract-criteria", tags=["Criteria"])


@router.post("", response_model=List[Criteria])
async def extract_criteria(request: ExtractCriteriaRequest) -> List[Criteria]:
    path = get_temp_path(request.tender_file_id)
    if not path.exists():
        temp_dir = path.parent
        candidates = list(temp_dir.glob(f"{request.tender_file_id}*"))
        path = candidates[0] if candidates else None

    criteria = extract_criteria_from_file(path)
    logger.info("Extracted %d criteria for %s", len(criteria), request.tender_file_id)
    return criteria
