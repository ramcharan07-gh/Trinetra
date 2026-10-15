"""backend/app/api/hotspots.py — Detected demand surge hotspots endpoint."""
from fastapi import APIRouter
from typing import List
from app.database import get_db
from app.schemas.hotspot import Hotspot
from app.services.demand_detection import DemandDetectionService

router = APIRouter()

@router.get("/hotspots", response_model=List[Hotspot])
def list_hotspots():
    with get_db() as conn:
        service = DemandDetectionService(conn)
        return service.detect_hotspots()

