"""backend/app/schemas/demand.py — Pydantic models for Demand Observations and Baselines."""
from pydantic import BaseModel, Field
from typing import Optional

class DemandObservationBase(BaseModel):
    stop_id: int
    queue_count: int = Field(default=0, ge=0)
    boarding_count: Optional[int] = None
    booking_demand: int = Field(default=0, ge=0)
    observation_source: str = "simulation"
    data_quality: str = "ok"

class DemandObservationCreate(DemandObservationBase):
    pass

class DemandObservation(DemandObservationBase):
    id: int
    stop_name: Optional[str] = None
    observed_at: str

    class Config:
        from_attributes = True

class DemandHistoryBase(BaseModel):
    stop_id: int
    day_of_week: int = Field(ge=0, le=6)
    time_window: str
    average_demand: float
    median_demand: Optional[float] = None
    sample_count: int = 0

class DemandHistory(DemandHistoryBase):
    id: int
    calculated_at: str

    class Config:
        from_attributes = True

