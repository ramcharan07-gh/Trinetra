"""backend/app/services/vehicle_selection.py — Candidate filtering, scoring, and explainability."""
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Tuple, Dict
import sqlite3

from app.config import settings
from app.schemas.vehicle import Vehicle
from app.schemas.hotspot import Hotspot
from app.schemas.stop import Stop
from app.schemas.dispatch import DispatchRecommendationBase, RouteGeometry
from app.repositories.stops import StopRepository
from app.repositories.vehicles import VehicleRepository
from app.repositories.dispatch import DispatchRepository
from app.repositories.demand import DemandRepository
from app.services.routing import get_route_estimate, RouteResult

def parse_iso(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except Exception:
        return None

class VehicleSelectionService:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn
        self.stop_repo = StopRepository(conn)
        self.vehicle_repo = VehicleRepository(conn)
        self.dispatch_repo = DispatchRepository(conn)
        self.demand_repo = DemandRepository(conn)

    async def find_best_candidates_for_hotspot(
        self, hotspot: Hotspot, max_candidates: int = 2
    ) -> List[Tuple[DispatchRecommendationBase, RouteResult]]:
        """
        Evaluate candidate vehicles to reassign to this hotspot stop.
        Returns ranked list of (DispatchRecommendationBase, RouteResult).
        """
        all_stops = {s.id: s for s in self.stop_repo.get_all(active_only=True)}
        vehicles = self.vehicle_repo.get_all()
        dest_stop = all_stops.get(hotspot.stop_id)
        if not dest_stop:
            return []

        now = datetime.now(timezone.utc)
        stale_threshold = now - timedelta(minutes=settings.STALE_LOCATION_MINUTES)

        # 1. Filter candidates
        eligible: List[Tuple[Vehicle, Stop]] = []
        for v in vehicles:
            if v.status != "available":
                continue
            if self.dispatch_repo.has_active_approval(v.id):
                continue
            if v.available_seats < settings.MIN_USEFUL_SEATS:
                continue
            if v.latitude is None or v.longitude is None:
                continue

            # Check stale location
            loc_dt = parse_iso(v.location_updated_at)
            if loc_dt and loc_dt < stale_threshold:
                continue

            # Find closest source stop
            source_stop = self._find_nearest_stop(v.latitude, v.longitude, all_stops)
            if not source_stop:
                continue

            # Don't reallocate from the same stop if it is already the hotspot
            if source_stop.id == hotspot.stop_id:
                continue

            # Source area risk check: ensure source stop isn't also experiencing severe shortage
            eligible.append((v, source_stop))

        if not eligible:
            return []

        # 2. Compute route & ETA for each eligible vehicle
        scored_candidates = []
        for v, source_stop in eligible:
            route_res = await get_route_estimate(
                origin_lat=v.latitude,
                origin_lon=v.longitude,
                dest_lat=dest_stop.latitude,
                dest_lon=dest_stop.longitude,
            )

            score, reason = self._score_and_explain(v, source_stop, hotspot, route_res)

            rec_base = DispatchRecommendationBase(
                vehicle_id=v.id,
                source_stop_id=source_stop.id,
                destination_stop_id=dest_stop.id,
                estimated_arrival_minutes=route_res.duration_minutes,
                estimated_distance_km=route_res.distance_km,
                useful_capacity=v.available_seats,
                priority_score=round(score, 1),
                reason=reason,
                route_source=route_res.source,
                status="proposed",
            )
            scored_candidates.append((rec_base, route_res))

        # 3. Sort by priority score DESC
        scored_candidates.sort(key=lambda item: item[0].priority_score or 0.0, reverse=True)
        return scored_candidates[:max_candidates]

    def _find_nearest_stop(self, lat: float, lon: float, stops: Dict[int, Stop]) -> Optional[Stop]:
        best_stop = None
        min_dist = float("inf")
        for s in stops.values():
            dist = (lat - s.latitude) ** 2 + (lon - s.longitude) ** 2
            if dist < min_dist:
                min_dist = dist
                best_stop = s
        return best_stop

    def _score_and_explain(
        self,
        vehicle: Vehicle,
        source_stop: Stop,
        hotspot: Hotspot,
        route_res: RouteResult,
    ) -> Tuple[float, str]:
        """
        Calculate composite score 0..100 and generate explainable text.
        """
        # Normalization factors
        urgency_val = min(1.0, hotspot.capacity_shortage / 80.0)
        capacity_val = min(1.0, vehicle.available_seats / 55.0)
        # ETA penalty (lower duration is better, capped at 60 min)
        eta_val = max(0.0, 1.0 - (route_res.duration_minutes / 60.0))
        # Source impact penalty: low risk if source has spare capacity
        impact_val = 0.9

        # Composite weighted score (0 to 100)
        raw_score = (
            settings.W_URGENCY * urgency_val
            + settings.W_CAPACITY * capacity_val
            + settings.W_ETA * eta_val
            + settings.W_IMPACT * impact_val
        )
        score = max(5.0, min(100.0, raw_score * 100.0))

        route_label = "OSRM road network" if route_res.source == "osrm" else "estimated direct corridor"
        reason = (
            f"Recommended because {vehicle.vehicle_code} is available at {source_stop.name} "
            f"with {vehicle.available_seats} spare seats, reachable in ~{round(route_res.duration_minutes)} min "
            f"via {route_label} to alleviate the {hotspot.capacity_shortage}-passenger shortage."
        )
        return score, reason

