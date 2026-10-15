"""backend/app/api/stops.py — Stops and routes endpoints."""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
import sqlite3
from app.database import get_db
from app.schemas.stop import Stop, Route
from app.repositories.stops import StopRepository

router = APIRouter()

@router.get("/stops", response_model=List[Stop])
def list_stops(active_only: bool = True):
    with get_db() as conn:
        repo = StopRepository(conn)
        return repo.get_all(active_only=active_only)

@router.get("/stops/{stop_id}", response_model=Stop)
def get_stop(stop_id: int):
    with get_db() as conn:
        repo = StopRepository(conn)
        stop = repo.get_by_id(stop_id)
        if not stop:
            raise HTTPException(status_code=404, detail="Stop not found")
        return stop

@router.get("/routes", response_model=List[Route])
def list_routes(active_only: bool = True):
    with get_db() as conn:
        repo = StopRepository(conn)
        return repo.get_routes(active_only=active_only)

