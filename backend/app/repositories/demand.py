"""backend/app/repositories/demand.py — Data access for demand observations and baselines."""
import sqlite3
from typing import List, Optional
from datetime import datetime, timezone
from app.schemas.demand import DemandObservation, DemandObservationCreate, DemandHistory

def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

class DemandRepository:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def get_latest_observations(self) -> List[DemandObservation]:
        """Fetch the latest observation for each stop."""
        query = """
            SELECT o.*, s.name as stop_name
            FROM demand_observations o
            JOIN stops s ON o.stop_id = s.id
            WHERE o.id IN (
                SELECT MAX(id)
                FROM demand_observations
                GROUP BY stop_id
            )
            ORDER BY o.stop_id ASC
        """
        cursor = self.conn.execute(query)
        rows = cursor.fetchall()
        return [
            DemandObservation(
                id=r["id"],
                stop_id=r["stop_id"],
                stop_name=r["stop_name"],
                queue_count=r["queue_count"],
                boarding_count=r["boarding_count"],
                booking_demand=r["booking_demand"],
                observation_source=r["observation_source"],
                observed_at=r["observed_at"],
                data_quality=r["data_quality"],
            )
            for r in rows
        ]

    def add_observation(self, obs: DemandObservationCreate) -> DemandObservation:
        now = _now_iso()
        cursor = self.conn.execute(
            """
            INSERT INTO demand_observations
            (stop_id, queue_count, boarding_count, booking_demand, observation_source, observed_at, data_quality)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                obs.stop_id,
                obs.queue_count,
                obs.boarding_count,
                obs.booking_demand,
                obs.observation_source,
                now,
                obs.data_quality,
            ),
        )
        self.conn.commit()
        new_id = cursor.lastrowid
        # Get stop name
        stop_cursor = self.conn.execute("SELECT name FROM stops WHERE id = ?", (obs.stop_id,))
        stop_row = stop_cursor.fetchone()
        stop_name = stop_row["name"] if stop_row else None

        return DemandObservation(
            id=new_id,
            stop_id=obs.stop_id,
            stop_name=stop_name,
            queue_count=obs.queue_count,
            boarding_count=obs.boarding_count,
            booking_demand=obs.booking_demand,
            observation_source=obs.observation_source,
            observed_at=now,
            data_quality=obs.data_quality,
        )

    def get_baseline(self, stop_id: int, day_of_week: int, time_window: str) -> Optional[DemandHistory]:
        cursor = self.conn.execute(
            """
            SELECT * FROM demand_history
            WHERE stop_id = ? AND day_of_week = ? AND time_window = ?
            """,
            (stop_id, day_of_week, time_window),
        )
        r = cursor.fetchone()
        if not r:
            # Fallback to general average for this stop and day
            cursor = self.conn.execute(
                """
                SELECT AVG(average_demand) as avg_d, AVG(median_demand) as med_d, SUM(sample_count) as s_count
                FROM demand_history
                WHERE stop_id = ? AND day_of_week = ?
                """,
                (stop_id, day_of_week),
            )
            fallback = cursor.fetchone()
            if fallback and fallback["avg_d"] is not None:
                return DemandHistory(
                    id=0,
                    stop_id=stop_id,
                    day_of_week=day_of_week,
                    time_window=time_window,
                    average_demand=float(fallback["avg_d"]),
                    median_demand=float(fallback["med_d"]) if fallback["med_d"] else None,
                    sample_count=int(fallback["s_count"] or 0),
                    calculated_at=_now_iso(),
                )
            return None

        return DemandHistory(
            id=r["id"],
            stop_id=r["stop_id"],
            day_of_week=r["day_of_week"],
            time_window=r["time_window"],
            average_demand=r["average_demand"],
            median_demand=r["median_demand"],
            sample_count=r["sample_count"],
            calculated_at=r["calculated_at"],
        )

