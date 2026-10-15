"""backend/app/api/simulation.py — Endpoints for simulation scenarios and comparison runs."""
from fastapi import APIRouter, HTTPException
from typing import List
from app.database import get_db
from app.schemas.simulation import SimulationScenario, SimulationComparison
from app.services.simulation import SimulationService

router = APIRouter()

@router.get("/simulation/scenarios", response_model=List[SimulationScenario])
def list_scenarios():
    with get_db() as conn:
        svc = SimulationService(conn)
        return svc.get_all_scenarios()

@router.post("/simulation/run/{scenario_id}", response_model=SimulationComparison)
async def run_scenario(scenario_id: int):
    with get_db() as conn:
        svc = SimulationService(conn)
        try:
            return await svc.execute_scenario(scenario_id)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))

