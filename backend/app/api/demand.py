"""backend/app/api/demand.py — Demand observation ingestion and inspection endpoints."""
from fastapi import APIRouter, HTTPException
from typing import List
from app.database import get_db
from app.schemas.demand import DemandObservation, DemandObservationCreate
from app.repositories.demand import DemandRepository
from app.repositories.stops import StopRepository

router = APIRouter()

@router.get("/demand", response_model=List[DemandObservation])
def get_demand_observations():
    with get_db() as conn:
        repo = DemandRepository(conn)
        return repo.get_latest_observations()

@router.post("/demand/observations", response_model=DemandObservation)
def submit_observation(obs: DemandObservationCreate):
    with get_db() as conn:
        stop_repo = StopRepository(conn)
        if not stop_repo.get_by_id(obs.stop_id):
            raise HTTPException(status_code=404, detail="Stop ID not found")

        repo = DemandRepository(conn)
        return repo.add_observation(obs)

