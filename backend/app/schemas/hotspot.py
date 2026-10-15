"""backend/app/schemas/hotspot.py — Pydantic models for Hotspot Results."""
from pydantic import BaseModel
from typing import Literal

PriorityLevel = Literal["critical", "high", "medium", "low"]

class Hotspot(BaseModel):
    stop_id: int
    stop_name: str
    latitude: float
    longitude: float
    current_demand: int
    historical_baseline: float
    surge_ratio: float
    capacity_shortage: int
    available_capacity: int
    priority: PriorityLevel
    observed_at: str
    data_quality: str

    class Config:
        from_attributes = True

