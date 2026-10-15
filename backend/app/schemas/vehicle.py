"""backend/app/schemas/vehicle.py — Pydantic models for Vehicles."""
from pydantic import BaseModel, Field
from typing import Optional, Literal

VehicleStatus = Literal["available", "assigned", "in_service", "out_of_service"]

class VehicleBase(BaseModel):
    vehicle_code: str
    capacity: int = Field(gt=0)
    occupied_seats: int = Field(default=0, ge=0)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    current_route_id: Optional[int] = None
    status: VehicleStatus = "available"

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    capacity: Optional[int] = Field(default=None, gt=0)
    occupied_seats: Optional[int] = Field(default=None, ge=0)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    current_route_id: Optional[int] = None
    status: Optional[VehicleStatus] = None

class Vehicle(VehicleBase):
    id: int
    available_seats: int
    location_updated_at: Optional[str] = None
    updated_at: str

    class Config:
        from_attributes = True

