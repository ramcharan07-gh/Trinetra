"""backend/app/services/demand_detection.py — Demand surge detection and hotspot ranking."""
from datetime import datetime, timezone
from typing import List, Dict
import sqlite3
from app.config import settings
from app.schemas.hotspot import Hotspot, PriorityLevel
from app.repositories.stops import StopRepository
from app.repositories.vehicles import VehicleRepository
from app.repositories.demand import DemandRepository

def get_current_time_window(dt: datetime) -> str:
    """Format time into 30-min window, e.g., '14:30-15:00'."""
    hour = dt.hour
    minute = dt.minute
    if minute < 30:
        start_m = 0
        end_m = 30
        end_h = hour
    else:
        start_m = 30
        end_m = 0
        end_h = (hour + 1) % 24
    return f"{hour:02d}:{start_m:02d}-{end_h:02d}:{end_m:02d}"

class DemandDetectionService:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn
        self.stop_repo = StopRepository(conn)
        self.vehicle_repo = VehicleRepository(conn)
        self.demand_repo = DemandRepository(conn)

    def detect_hotspots(self) -> List[Hotspot]:
        stops = {s.id: s for s in self.stop_repo.get_all(active_only=True)}
        vehicles = self.vehicle_repo.get_all()
        observations = self.demand_repo.get_latest_observations()

        now = datetime.now(timezone.utc)
        day_of_week = now.weekday()
        time_window = get_current_time_window(now)

        # Estimate currently available capacity specifically stationed at each stop
        # A vehicle is counted only at its single nearest stop within ~0.005 deg (~500m)
        available_capacity_by_stop: Dict[int, int] = {s_id: 0 for s_id in stops.keys()}
        for v in vehicles:
            if v.status == "available" and v.latitude is not None and v.longitude is not None:
                # Find the single nearest stop
                best_stop_id = None
                min_dist_sq = float("inf")
                for s_id, s in stops.items():
                    dist_sq = (v.latitude - s.latitude) ** 2 + (v.longitude - s.longitude) ** 2
                    if dist_sq < min_dist_sq:
                        min_dist_sq = dist_sq
                        best_stop_id = s_id
                # Only attribute capacity if within ~500m (0.005 deg squared = 0.000025)
                if best_stop_id and min_dist_sq < 0.000025:
                    available_capacity_by_stop[best_stop_id] += v.available_seats

        hotspots: List[Hotspot] = []

        for obs in observations:
            stop = stops.get(obs.stop_id)
            if not stop:
                continue

            current_demand = obs.queue_count + obs.booking_demand
            baseline_rec = self.demand_repo.get_baseline(obs.stop_id, day_of_week, time_window)
            historical_baseline = baseline_rec.average_demand if baseline_rec else 25.0

            surge_ratio = current_demand / max(historical_baseline, 1.0)
            avail_cap = available_capacity_by_stop.get(obs.stop_id, 0)
            capacity_shortage = max(0, current_demand - avail_cap)

            is_surge = (
                (surge_ratio >= settings.SURGE_THRESHOLD and capacity_shortage >= settings.MIN_SHORTAGE)
                or (capacity_shortage >= settings.ABSOLUTE_SHORTAGE_THRESHOLD) # Configurable absolute shortage condition
            )

            if is_surge:
                priority = self._calculate_priority(capacity_shortage, surge_ratio)
                hotspots.append(
                    Hotspot(
                        stop_id=obs.stop_id,
                        stop_name=stop.name,
                        latitude=stop.latitude,
                        longitude=stop.longitude,
                        current_demand=current_demand,
                        historical_baseline=round(historical_baseline, 1),
                        surge_ratio=round(surge_ratio, 2),
                        capacity_shortage=capacity_shortage,
                        available_capacity=avail_cap,
                        priority=priority,
                        observed_at=obs.observed_at,
                        data_quality=obs.data_quality,
                    )
                )

        # Sort hotspots by shortage DESC, then surge ratio DESC
        hotspots.sort(key=lambda h: (h.capacity_shortage, h.surge_ratio), reverse=True)
        return hotspots

    def _calculate_priority(self, shortage: int, surge_ratio: float) -> PriorityLevel:
        if shortage >= settings.PRIORITY_CRITICAL_SHORTAGE or surge_ratio >= settings.PRIORITY_CRITICAL_RATIO:
            return "critical"
        elif shortage >= settings.PRIORITY_HIGH_SHORTAGE or surge_ratio >= settings.PRIORITY_HIGH_RATIO:
            return "high"
        elif shortage >= settings.PRIORITY_MEDIUM_SHORTAGE:
            return "medium"
        return "low"

