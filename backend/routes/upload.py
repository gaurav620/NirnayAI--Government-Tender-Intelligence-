"""Upload routes: accept tender + vendor files, return file IDs.

Exposes three endpoints:
  POST /upload            — combined (tender + vendors in one request)
  POST /upload-tender     — tender file only
  POST /upload-bidders    — vendor/bidder files only
"""

import logging
from typing import List

from fastapi import APIRouter, File, UploadFile

from models.schemas import UploadResponse
from utils.helpers import generate_id, save_temp_file

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Upload"])


@router.post("/upload", response_model=UploadResponse)
async def upload_files(
    tender_file: UploadFile = File(..., description="Tender document PDF"),
    vendor_files: List[UploadFile] = File(default_factory=list, description="Vendor submission PDFs or ZIPs"),
) -> UploadResponse:
    tender_id = generate_id("tender")
    save_temp_file(tender_id, tender_file.filename or "tender.pdf", await tender_file.read())
    logger.info("Saved tender file: %s", tender_id)

    vendor_ids: List[str] = []
    for vendor_file in vendor_files:
        vid = generate_id("vendor")
        save_temp_file(vid, vendor_file.filename or "vendor.pdf", await vendor_file.read())
        vendor_ids.append(vid)
        logger.info("Saved vendor file: %s (%s)", vid, vendor_file.filename)

    return UploadResponse(
        tender_file_id=tender_id,
        vendor_file_ids=vendor_ids,
        message=f"Uploaded 1 tender + {len(vendor_ids)} vendor file(s)",
    )


@router.post("/upload-tender", response_model=UploadResponse)
async def upload_tender(
    tender_file: UploadFile = File(..., description="Tender document PDF"),
) -> UploadResponse:
    tender_id = generate_id("tender")
    save_temp_file(tender_id, tender_file.filename or "tender.pdf", await tender_file.read())
    logger.info("Saved tender file: %s", tender_id)
    return UploadResponse(
        tender_file_id=tender_id,
        vendor_file_ids=[],
        message="Tender uploaded",
    )


@router.post("/upload-bidders", response_model=UploadResponse)
async def upload_bidders(
    vendor_files: List[UploadFile] = File(..., description="Vendor/bidder submission PDFs"),
) -> UploadResponse:
    vendor_ids: List[str] = []
    for vendor_file in vendor_files:
        vid = generate_id("vendor")
        save_temp_file(vid, vendor_file.filename or "vendor.pdf", await vendor_file.read())
        vendor_ids.append(vid)
        logger.info("Saved vendor file: %s (%s)", vid, vendor_file.filename)

    return UploadResponse(
        tender_file_id="",
        vendor_file_ids=vendor_ids,
        message=f"Uploaded {len(vendor_ids)} bidder file(s)",
    )
