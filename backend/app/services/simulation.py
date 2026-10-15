"""backend/app/services/simulation.py — Simulation scenario orchestrator and comparison engine."""
import json
import time
import sqlite3
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.schemas.simulation import SimulationScenario, SimulationComparison
from app.services.dispatch_engine import DispatchEngineService
from app.services.demand_detection import DemandDetectionService
from app.services.impact import calculate_waiting_time_impact

PREDEFINED_SCENARIOS = [
    {
        "name": "Scenario A: Normal Operations",
        "description": "Demand remains within regular scheduled capacity across all 8 transit hubs. No surge reallocations triggered.",
        "config": {
            "observations": [
                {"stop_id": 1, "queue_count": 22, "booking_demand": 5},
                {"stop_id": 2, "queue_count": 25, "booking_demand": 10},
                {"stop_id": 3, "queue_count": 18, "booking_demand": 4},
                {"stop_id": 4, "queue_count": 15, "booking_demand": 2},
                {"stop_id": 5, "queue_count": 12, "booking_demand": 0},
                {"stop_id": 6, "queue_count": 10, "booking_demand": 0},
                {"stop_id": 7, "queue_count": 20, "booking_demand": 5},
                {"stop_id": 8, "queue_count": 14, "booking_demand": 2},
            ],
            "vehicle_status": "all_available"
        }
    },
    {
        "name": "Scenario B: MITS College Surge",
        "description": "Classes end at 16:30 releasing sudden student crowd at MITS College. 180 passengers waiting against 20 normal baseline.",
        "config": {
            "observations": [
                {"stop_id": 1, "queue_count": 20, "booking_demand": 5},
                {"stop_id": 2, "queue_count": 160, "booking_demand": 20}, # 180 surge at MITS
                {"stop_id": 3, "queue_count": 25, "booking_demand": 5},
                {"stop_id": 4, "queue_count": 15, "booking_demand": 2},
                {"stop_id": 5, "queue_count": 12, "booking_demand": 0},
                {"stop_id": 6, "queue_count": 10, "booking_demand": 0},
                {"stop_id": 7, "queue_count": 18, "booking_demand": 0},
                {"stop_id": 8, "queue_count": 15, "booking_demand": 0},
            ],
            "vehicle_status": "mixed"
        }
    },
    {
        "name": "Scenario C: Multi-Hub Shortage (Insufficient Fleet)",
        "description": "Simultaneous surges at MITS College (150 passengers) and Railway Station (120 passengers) with limited spare buses.",
        "config": {
            "observations": [
                {"stop_id": 1, "queue_count": 30, "booking_demand": 10},
                {"stop_id": 2, "queue_count": 130, "booking_demand": 20}, # MITS
                {"stop_id": 3, "queue_count": 100, "booking_demand": 20}, # Railway Station
                {"stop_id": 4, "queue_count": 15, "booking_demand": 0},
                {"stop_id": 5, "queue_count": 10, "booking_demand": 0},
                {"stop_id": 6, "queue_count": 10, "booking_demand": 0},
                {"stop_id": 7, "queue_count": 15, "booking_demand": 0},
                {"stop_id": 8, "queue_count": 10, "booking_demand": 0},
            ],
            "vehicle_status": "constrained"
        }
    }
]

class SimulationService:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def seed_scenarios_if_empty(self) -> None:
        cursor = self.conn.execute("SELECT COUNT(*) as cnt FROM simulation_scenarios")
        count = cursor.fetchone()["cnt"]
        if count == 0:
            for s in PREDEFINED_SCENARIOS:
                self.conn.execute(
                    "INSERT INTO simulation_scenarios (name, description, config) VALUES (?, ?, ?)",
                    (s["name"], s["description"], json.dumps(s["config"])),
                )
            self.conn.commit()

    def get_all_scenarios(self) -> List[SimulationScenario]:
        self.seed_scenarios_if_empty()
        cursor = self.conn.execute("SELECT * FROM simulation_scenarios ORDER BY id ASC")
        rows = cursor.fetchall()
        return [
            SimulationScenario(
                id=r["id"],
                name=r["name"],
                description=r["description"],
                config=json.loads(r["config"]),
                created_at=r["created_at"],
            )
            for r in rows
        ]

    async def execute_scenario(self, scenario_id: int) -> SimulationComparison:
        """
        Load scenario inputs, inject observations, execute dispatch engine,
        and calculate comparative before/after waiting times.
        """
        cursor = self.conn.execute("SELECT * FROM simulation_scenarios WHERE id = ?", (scenario_id,))
        row = cursor.fetchone()
        if not row:
            raise ValueError(f"Scenario with ID {scenario_id} not found")

        scenario_name = row["name"]
        config = json.loads(row["config"])
        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        # 1. Clear any prior proposed/approved recommendations to reset simulation cleanly
        self.conn.execute("DELETE FROM dispatch_recommendations WHERE status = 'proposed'")
        self.conn.execute("UPDATE vehicles SET status = 'available', updated_at = ?", (now_iso,))
        self.conn.commit()

        # 2. Inject observations from scenario
        total_waiting_passengers = 0
        for obs in config.get("observations", []):
            self.conn.execute(
                """
                INSERT INTO demand_observations
                (stop_id, queue_count, booking_demand, observation_source, observed_at, data_quality)
                VALUES (?, ?, ?, 'simulation', ?, 'ok')
                """,
                (obs["stop_id"], obs["queue_count"], obs["booking_demand"], now_iso),
            )
            total_waiting_passengers += obs["queue_count"] + obs["booking_demand"]
        self.conn.commit()

        # 3. Measure recommendation latency
        start_time = time.perf_counter()
        engine = DispatchEngineService(self.conn)
        recs = await engine.run_pipeline()
        latency_ms = int((time.perf_counter() - start_time) * 1000)

        # 4. Compute baseline vs reallocation waiting times
        # Baseline: No emergency buses sent, wait based on typical 25-30 min headway
        baseline_headway = 25.0
        baseline_avg_wait = max(baseline_headway, total_waiting_passengers / 8.0)

        passengers_served = sum(r.useful_capacity for r in recs if r.status in ("proposed", "approved"))
        reassigned_count = len([r for r in recs if r.status in ("proposed", "approved")])
        residual_queue = max(0, total_waiting_passengers - passengers_served)

        if recs:
            # Average ETA of incoming buses
            etas = [r.estimated_arrival_minutes for r in recs if r.estimated_arrival_minutes]
            avg_eta = sum(etas) / len(etas) if etas else 8.0
            served_fraction = min(1.0, passengers_served / max(1, total_waiting_passengers))
            reallocation_avg_wait = (served_fraction * (avg_eta + 2.0)) + ((1.0 - served_fraction) * (avg_eta + baseline_headway))
        else:
            reallocation_avg_wait = baseline_avg_wait

        reallocation_avg_wait = min(reallocation_avg_wait, baseline_avg_wait)
        reduction_pct = round(((baseline_avg_wait - reallocation_avg_wait) / baseline_avg_wait) * 100.0, 1)

        # 5. Persist comparison run record
        self.conn.execute(
            """
            INSERT INTO simulation_runs
            (scenario_id, scenario_name, run_type, avg_wait_minutes, total_passengers_served,
             residual_queue, vehicles_reassigned, capacity_utilisation_pct, recommendation_latency_ms, summary_notes)
            VALUES (?, ?, 'reallocation', ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                scenario_id,
                scenario_name,
                round(reallocation_avg_wait, 1),
                passengers_served,
                residual_queue,
                reassigned_count,
                round((passengers_served / max(1, passengers_served + residual_queue)) * 100.0, 1),
                latency_ms,
                f"Generated {len(recs)} recommendations with {reduction_pct}% wait reduction.",
            ),
        )
        self.conn.commit()

        return SimulationComparison(
            scenario_name=scenario_name,
            baseline_avg_wait_minutes=round(baseline_avg_wait, 1),
            reallocation_avg_wait_minutes=round(reallocation_avg_wait, 1),
            wait_reduction_percent=reduction_pct,
            passengers_served=passengers_served,
            residual_queue=residual_queue,
            vehicles_reassigned=reassigned_count,
            recommendation_latency_ms=latency_ms,
        )

