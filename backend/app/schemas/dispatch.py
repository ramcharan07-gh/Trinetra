"""backend/app/schemas/dispatch.py — Pydantic models for Dispatch Recommendations, Logs, and Impact."""
from pydantic import BaseModel, Field
from typing import Optional, List, Tuple, Literal

DispatchStatus = Literal["proposed", "approved", "adjusted", "rejected", "cancelled", "completed"]
RouteSource = Literal["osrm", "haversine_estimate", "unknown"]

class RouteGeometry(BaseModel):
    coordinates: List[Tuple[float, float]] # [lon, lat] pairs from OSRM
    source: RouteSource

class ImpactEstimate(BaseModel):
    baseline_wait_minutes: float
    projected_wait_minutes: float
    reduction_percent: Optional[float] = None
    passengers_cleared: int
    remaining_queue: int

class DispatchRecommendationBase(BaseModel):
    vehicle_id: int
    source_stop_id: int
    destination_stop_id: int
    estimated_arrival_minutes: Optional[float] = None
    estimated_distance_km: Optional[float] = None
    useful_capacity: int
    priority_score: Optional[float] = None
    reason: str
    route_source: RouteSource = "unknown"
    status: DispatchStatus = "proposed"

class DispatchRecommendation(DispatchRecommendationBase):
    id: int
    vehicle_code: str
    source_stop_name: str
    destination_stop_name: str
    created_at: str
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None
    route_geometry: Optional[RouteGeometry] = None
    impact: Optional[ImpactEstimate] = None

    class Config:
        from_attributes = True

class DispatchRecommendationAdjust(BaseModel):
    vehicle_id: Optional[int] = None
    destination_stop_id: Optional[int] = None
    notes: Optional[str] = None

class DispatchRecommendationReject(BaseModel):
    notes: Optional[str] = None

class DispatchLogEntry(BaseModel):
    id: int
    recommendation_id: int
    vehicle_id: int
    vehicle_code: str
    action: str
    previous_state: Optional[str] = None
    new_state: Optional[str] = None
    notes: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True

class ImpactMetrics(BaseModel):
    total_hotspots: int
    total_recommendations: int
    approved_count: int
    rejected_count: int
    average_eta_minutes: Optional[float] = None
    average_wait_reduction_percent: Optional[float] = None

