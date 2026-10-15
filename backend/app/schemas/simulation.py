"""backend/app/schemas/simulation.py — Pydantic models for simulation scenarios and run comparisons."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal

class ScenarioConfig(BaseModel):
    name: str
    description: str
    demand_observations: List[Dict[str, Any]]
    vehicle_overrides: Optional[List[Dict[str, Any]]] = None

class SimulationScenario(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    config: Dict[str, Any]
    created_at: str

    class Config:
        from_attributes = True

class SimulationComparison(BaseModel):
    scenario_name: str
    baseline_avg_wait_minutes: float
    reallocation_avg_wait_minutes: float
    wait_reduction_percent: float
    passengers_served: int
    residual_queue: int
    vehicles_reassigned: int
    recommendation_latency_ms: int
    data_mode: str = "[SIMULATED DATA]"

