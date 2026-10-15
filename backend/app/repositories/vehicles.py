"""backend/app/repositories/vehicles.py — Data access for vehicles."""
import sqlite3
from typing import List, Optional
from datetime import datetime, timezone
from app.schemas.vehicle import Vehicle, VehicleStatus

def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

class VehicleRepository:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def get_all(self, status: Optional[VehicleStatus] = None) -> List[Vehicle]:
        query = "SELECT * FROM vehicles"
        params = []
        if status:
            query += " WHERE status = ?"
            params.append(status)
        query += " ORDER BY id ASC"
        cursor = self.conn.execute(query, params)
        rows = cursor.fetchall()
        return [self._map_row(r) for r in rows]

    def get_by_id(self, vehicle_id: int) -> Optional[Vehicle]:
        cursor = self.conn.execute("SELECT * FROM vehicles WHERE id = ?", (vehicle_id,))
        r = cursor.fetchone()
        if not r:
            return None
        return self._map_row(r)

    def update_status(self, vehicle_id: int, status: VehicleStatus) -> Optional[Vehicle]:
        now = _now_iso()
        self.conn.execute(
            "UPDATE vehicles SET status = ?, updated_at = ? WHERE id = ?",
            (status, now, vehicle_id),
        )
        self.conn.commit()
        return self.get_by_id(vehicle_id)

    def update_location(self, vehicle_id: int, lat: float, lon: float) -> Optional[Vehicle]:
        now = _now_iso()
        self.conn.execute(
            "UPDATE vehicles SET latitude = ?, longitude = ?, location_updated_at = ?, updated_at = ? WHERE id = ?",
            (lat, lon, now, now, vehicle_id),
        )
        self.conn.commit()
        return self.get_by_id(vehicle_id)

    def _map_row(self, r: sqlite3.Row) -> Vehicle:
        cap = r["capacity"]
        occ = r["occupied_seats"]
        available_seats = max(0, cap - occ)
        return Vehicle(
            id=r["id"],
            vehicle_code=r["vehicle_code"],
            capacity=cap,
            occupied_seats=occ,
            available_seats=available_seats,
            latitude=r["latitude"],
            longitude=r["longitude"],
            current_route_id=r["current_route_id"],
            status=r["status"],
            location_updated_at=r["location_updated_at"],
            updated_at=r["updated_at"],
        )

