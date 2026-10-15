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
async def adjust_recommendation(rec_id: int, body: DispatchRecommendationAdjust):
    notes = body.notes or "Adjusted by operator"
    with get_db() as conn:
        repo = DispatchRepository(conn)
        rec = repo.get_by_id(rec_id)
        if not rec:
            raise HTTPException(status_code=404, detail="Recommendation not found")

        # If vehicle_id or destination_stop_id changed, validate and update recommendation details
        new_veh_id = body.vehicle_id or rec.vehicle_id
        new_dest_id = body.destination_stop_id or rec.destination_stop_id

        if new_veh_id != rec.vehicle_id or new_dest_id != rec.destination_stop_id:
            from app.repositories.vehicles import VehicleRepository
            from app.repositories.stops import StopRepository
            from app.services.routing import get_route_estimate

            veh_repo = VehicleRepository(conn)
            stop_repo = StopRepository(conn)
            veh = veh_repo.get_by_id(new_veh_id)
            dest = stop_repo.get_by_id(new_dest_id)

            if not veh or not dest:
                raise HTTPException(status_code=400, detail="Invalid vehicle or destination stop")

            if veh.status != "available" and veh.id != rec.vehicle_id:
                raise HTTPException(status_code=400, detail=f"Vehicle {veh.vehicle_code} is not available")

            # Compute new route estimate
            route_res = await get_route_estimate(
                origin_lat=veh.latitude,
                origin_lon=veh.longitude,
                dest_lat=dest.latitude,
                dest_lon=dest.longitude,
            )

            conn.execute(
                """
                UPDATE dispatch_recommendations
                SET vehicle_id = ?, destination_stop_id = ?, useful_capacity = ?,
                    estimated_arrival_minutes = ?, estimated_distance_km = ?, route_source = ?,
                    status = 'adjusted', reviewed_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), reviewed_by = 'dispatcher',
                    reason = ?
                WHERE id = ?
                """,
                (
                    new_veh_id,
                    new_dest_id,
                    veh.available_seats,
                    route_res.duration_minutes,
                    route_res.distance_km,
                    route_res.source,
                    f"Adjusted by operator to assign {veh.vehicle_code} to {dest.name} (~{round(route_res.duration_minutes)} min).",
                    rec_id,
                ),
            )
            repo.create_log(
                rec_id=rec_id,
                vehicle_id=new_veh_id,
                action="adjusted",
                previous_state=rec.status,
                new_state="adjusted",
                notes=f"Adjusted target to vehicle {veh.vehicle_code}, destination {dest.name}. {notes}",
            )
            conn.commit()
            return repo.get_by_id(rec_id)

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

