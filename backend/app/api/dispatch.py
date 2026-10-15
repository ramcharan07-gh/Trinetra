"""backend/app/api/dispatch.py — Dispatch recommendation and approval workflow endpoints."""
from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from app.database import get_db
from app.schemas.dispatch import (
    DispatchRecommendation,
    DispatchRecommendationAdjust,
    DispatchRecommendationReject,
    DispatchLogEntry,
    DispatchStatus,
    ImpactMetrics,
)
from app.repositories.dispatch import DispatchRepository
from app.services.dispatch_engine import DispatchEngineService

router = APIRouter()

@router.post("/dispatch/recommendations", response_model=List[DispatchRecommendation])
async def generate_recommendations():
    with get_db() as conn:
        engine = DispatchEngineService(conn)
        return await engine.run_pipeline()

@router.get("/dispatch/recommendations", response_model=List[DispatchRecommendation])
def list_recommendations(status: Optional[DispatchStatus] = Query(default=None)):
    with get_db() as conn:
        engine = DispatchEngineService(conn)
        return engine.get_enriched_recommendations(status=status)

@router.get("/dispatch/recommendations/{rec_id}", response_model=DispatchRecommendation)
def get_recommendation(rec_id: int):
    with get_db() as conn:
        repo = DispatchRepository(conn)
        rec = repo.get_by_id(rec_id)
        if not rec:
            raise HTTPException(status_code=404, detail="Recommendation not found")
        return rec

@router.post("/dispatch/recommendations/{rec_id}/approve", response_model=DispatchRecommendation)
def approve_recommendation(rec_id: int):
    with get_db() as conn:
        repo = DispatchRepository(conn)
        rec = repo.get_by_id(rec_id)
        if not rec:
            raise HTTPException(status_code=404, detail="Recommendation not found")

        if rec.status == "approved":
            return rec

        if rec.status != "proposed":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot approve recommendation in '{rec.status}' status"
            )

        # Check if vehicle is already committed elsewhere
        if repo.has_active_approval(rec.vehicle_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Vehicle {rec.vehicle_code} is already approved for another active assignment"
            )

        updated = repo.update_status(rec_id, "approved", reviewed_by="dispatcher", notes="Approved by operator")
        return updated

@router.post("/dispatch/recommendations/{rec_id}/reject", response_model=DispatchRecommendation)
def reject_recommendation(rec_id: int, body: Optional[DispatchRecommendationReject] = None):
    notes = body.notes if body else "Rejected by operator"
    with get_db() as conn:
        repo = DispatchRepository(conn)
        rec = repo.get_by_id(rec_id)
        if not rec:
            raise HTTPException(status_code=404, detail="Recommendation not found")

        updated = repo.update_status(rec_id, "rejected", reviewed_by="dispatcher", notes=notes)
        return updated

@router.post("/dispatch/recommendations/{rec_id}/adjust", response_model=DispatchRecommendation)
def adjust_recommendation(rec_id: int, body: DispatchRecommendationAdjust):
    notes = body.notes or "Adjusted by operator"
    with get_db() as conn:
        repo = DispatchRepository(conn)
        rec = repo.get_by_id(rec_id)
        if not rec:
            raise HTTPException(status_code=404, detail="Recommendation not found")

        updated = repo.update_status(rec_id, "adjusted", reviewed_by="dispatcher", notes=notes)
        return updated

@router.get("/dispatch/history", response_model=List[DispatchLogEntry])
def get_dispatch_history(limit: int = 50):
    with get_db() as conn:
        repo = DispatchRepository(conn)
        return repo.get_logs(limit=limit)

@router.get("/impact", response_model=ImpactMetrics)
def get_impact_metrics():
    with get_db() as conn:
        engine = DispatchEngineService(conn)
        return engine.get_impact_metrics()

