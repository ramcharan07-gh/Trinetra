"""backend/app/services/dispatch_engine.py — Core pipeline orchestrator."""
import sqlite3
from typing import List, Optional
from app.schemas.dispatch import (
    DispatchRecommendation,
    RouteGeometry,
    ImpactMetrics,
)
from app.repositories.dispatch import DispatchRepository
from app.repositories.stops import StopRepository
from app.repositories.vehicles import VehicleRepository
from app.services.demand_detection import DemandDetectionService
from app.services.vehicle_selection import VehicleSelectionService
from app.services.impact import calculate_waiting_time_impact

class DispatchEngineService:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn
        self.dispatch_repo = DispatchRepository(conn)
        self.stop_repo = StopRepository(conn)
        self.vehicle_repo = VehicleRepository(conn)
        self.demand_service = DemandDetectionService(conn)
        self.selection_service = VehicleSelectionService(conn)

    async def run_pipeline(self) -> List[DispatchRecommendation]:
        """
        Run end-to-end recommendation generation:
        1. Detect hotspots
        2. Filter & rank candidate vehicles
        3. Calculate waiting-time impact
        4. Persist recommendations into database
        5. Return enriched recommendations
        """
        hotspots = self.demand_service.detect_hotspots()
        existing_recs = self.dispatch_repo.get_all()
        # Avoid creating duplicate proposed recs for the same vehicle & dest
        existing_keys = {
            (r.vehicle_id, r.destination_stop_id)
            for r in existing_recs
            if r.status in ("proposed", "approved")
        }

        created_recs: List[DispatchRecommendation] = []

        for hotspot in hotspots:
            candidates = await self.selection_service.find_best_candidates_for_hotspot(hotspot)
            for rec_base, route_res in candidates:
                key = (rec_base.vehicle_id, rec_base.destination_stop_id)
                if key in existing_keys:
                    continue

                saved_rec = self.dispatch_repo.create_recommendation(rec_base)
                existing_keys.add(key)

                # Attach geometry
                if route_res.geometry:
                    saved_rec.route_geometry = RouteGeometry(
                        coordinates=route_res.geometry,
                        source=route_res.source,
                    )

                # Attach impact
                impact = calculate_waiting_time_impact(
                    queue_size=hotspot.current_demand,
                    bus_capacity=rec_base.useful_capacity,
                    eta_minutes=rec_base.estimated_arrival_minutes or 10.0,
                )
                saved_rec.impact = impact

                created_recs.append(saved_rec)

        # Return all recommendations (new + existing), enriched
        return self.get_enriched_recommendations()

    def get_enriched_recommendations(self, status: Optional[str] = None) -> List[DispatchRecommendation]:
        """Get recommendations from DB and calculate live impact estimations."""
        recs = self.dispatch_repo.get_all(status=status)
        hotspots = {h.stop_id: h for h in self.demand_service.detect_hotspots()}

        for r in recs:
            hotspot = hotspots.get(r.destination_stop_id)
            queue_val = hotspot.current_demand if hotspot else 40
            r.impact = calculate_waiting_time_impact(
                queue_size=queue_val,
                bus_capacity=r.useful_capacity,
                eta_minutes=r.estimated_arrival_minutes or 10.0,
            )
        return recs

    def get_impact_metrics(self) -> ImpactMetrics:
        """Compute aggregated impact metrics for the operational dashboard."""
        hotspots = self.demand_service.detect_hotspots()
        recs = self.dispatch_repo.get_all()

        approved = [r for r in recs if r.status == "approved"]
        rejected = [r for r in recs if r.status == "rejected"]

        avg_eta = None
        if recs:
            valid_etas = [r.estimated_arrival_minutes for r in recs if r.estimated_arrival_minutes is not None]
            if valid_etas:
                avg_eta = round(sum(valid_etas) / len(valid_etas), 1)

        enriched_recs = self.get_enriched_recommendations()
        reductions = [
            r.impact.reduction_percent
            for r in enriched_recs
            if r.impact and r.impact.reduction_percent is not None
        ]
        avg_reduction = round(sum(reductions) / len(reductions), 1) if reductions else None

        return ImpactMetrics(
            total_hotspots=len(hotspots),
            total_recommendations=len(recs),
            approved_count=len(approved),
            rejected_count=len(rejected),
            average_eta_minutes=avg_eta,
            average_wait_reduction_percent=avg_reduction,
        )

