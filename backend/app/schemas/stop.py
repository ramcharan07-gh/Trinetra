"""backend/app/schemas/stop.py — Pydantic models for Stops and Routes."""
from pydantic import BaseModel
from typing import Optional

class StopBase(BaseModel):
    name: str
    latitude: float
    longitude: float
    location_type: str = "bus_stop"
    is_active: bool = True

class StopCreate(StopBase):
    pass

class Stop(StopBase):
    id: int
    created_at: str

    class Config:
        from_attributes = True

class RouteBase(BaseModel):
    name: str
    origin_stop_id: int
    destination_stop_id: int
    is_active: bool = True

class Route(RouteBase):
    id: int

    class Config:
        from_attributes = True

