"""backend/app/repositories/stops.py — Data access for stops and routes."""
import sqlite3
from typing import List, Optional
from app.schemas.stop import Stop, Route

class StopRepository:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def get_all(self, active_only: bool = True) -> List[Stop]:
        query = "SELECT * FROM stops"
        if active_only:
            query += " WHERE is_active = 1"
        query += " ORDER BY id ASC"
        cursor = self.conn.execute(query)
        rows = cursor.fetchall()
        return [
            Stop(
                id=r["id"],
                name=r["name"],
                latitude=r["latitude"],
                longitude=r["longitude"],
                location_type=r["location_type"],
                is_active=bool(r["is_active"]),
                created_at=r["created_at"],
            )
            for r in rows
        ]

    def get_by_id(self, stop_id: int) -> Optional[Stop]:
        cursor = self.conn.execute("SELECT * FROM stops WHERE id = ?", (stop_id,))
        r = cursor.fetchone()
        if not r:
            return None
        return Stop(
            id=r["id"],
            name=r["name"],
            latitude=r["latitude"],
            longitude=r["longitude"],
            location_type=r["location_type"],
            is_active=bool(r["is_active"]),
            created_at=r["created_at"],
        )

    def get_routes(self, active_only: bool = True) -> List[Route]:
        query = "SELECT * FROM routes"
        if active_only:
            query += " WHERE is_active = 1"
        query += " ORDER BY id ASC"
        cursor = self.conn.execute(query)
        rows = cursor.fetchall()
        return [
            Route(
                id=r["id"],
                name=r["name"],
                origin_stop_id=r["origin_stop_id"],
                destination_stop_id=r["destination_stop_id"],
                is_active=bool(r["is_active"]),
            )
            for r in rows
        ]

