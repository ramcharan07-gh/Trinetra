"""backend/app/api/vehicles.py — Vehicle tracking and availability endpoints."""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.database import get_db
from app.schemas.vehicle import Vehicle, VehicleStatus
from app.repositories.vehicles import VehicleRepository

router = APIRouter()

@router.get("/vehicles", response_model=List[Vehicle])
def list_vehicles(status: Optional[VehicleStatus] = Query(default=None)):
    with get_db() as conn:
        repo = VehicleRepository(conn)
        return repo.get_all(status=status)

@router.get("/vehicles/{vehicle_id}", response_model=Vehicle)
def get_vehicle(vehicle_id: int):
    with get_db() as conn:
        repo = VehicleRepository(conn)
        v = repo.get_by_id(vehicle_id)
        if not v:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        return v

