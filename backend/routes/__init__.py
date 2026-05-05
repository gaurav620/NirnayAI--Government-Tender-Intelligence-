from .audit import router as audit_router
from .criteria import router as criteria_router
from .evaluate import router as evaluate_router
from .reports import router as reports_router
from .results import router as results_router
from .upload import router as upload_router

__all__ = [
    "audit_router",
    "criteria_router",
    "evaluate_router",
    "reports_router",
    "results_router",
    "upload_router",
]
