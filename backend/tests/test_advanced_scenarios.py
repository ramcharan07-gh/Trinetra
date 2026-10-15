"""backend/tests/test_advanced_scenarios.py — Tests for multi-hotspot dispatch, double booking, adjust flow, and source protection."""
import pytest
import sqlite3
from app.repositories.stops import StopRepository
from app.repositories.vehicles import VehicleRepository
from app.repositories.demand import DemandRepository
from app.repositories.dispatch import DispatchRepository
from app.schemas.demand import DemandObservationCreate
from app.schemas.dispatch import DispatchRecommendationBase
from app.services.demand_detection import DemandDetectionService
from app.services.dispatch_engine import DispatchEngineService
from app.services.vehicle_selection import VehicleSelectionService

@pytest.fixture
def populated_db(test_db):
    """Seed test stops, vehicles, baselines, and observations."""
    conn = test_db

    from datetime import datetime, timezone
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Stops: 1: Madanapalle Bus Stand, 2: MITS College, 3: Railway Stn
    conn.execute("INSERT INTO stops (id, name, latitude, longitude) VALUES (1, 'Madanapalle Bus Stand', 13.5562, 78.5033)")
    conn.execute("INSERT INTO stops (id, name, latitude, longitude) VALUES (2, 'MITS College', 13.6288, 78.4802)")
    conn.execute("INSERT INTO stops (id, name, latitude, longitude) VALUES (3, 'Railway Station', 13.5420, 78.5200)")

    # Vehicles at stop 1 (Bus stand): 3 available vehicles with 50 seats each (total 150)
    conn.execute("INSERT INTO vehicles (id, vehicle_code, capacity, occupied_seats, latitude, longitude, status, location_updated_at) VALUES (1, 'AP-27-Z-0001', 50, 0, 13.5562, 78.5033, 'available', ?)", (now_iso,))
    conn.execute("INSERT INTO vehicles (id, vehicle_code, capacity, occupied_seats, latitude, longitude, status, location_updated_at) VALUES (2, 'AP-27-Z-0002', 50, 0, 13.5562, 78.5033, 'available', ?)", (now_iso,))
    conn.execute("INSERT INTO vehicles (id, vehicle_code, capacity, occupied_seats, latitude, longitude, status, location_updated_at) VALUES (3, 'AP-27-Z-0003', 50, 0, 13.5562, 78.5033, 'available', ?)", (now_iso,))

    # Demand observations: MITS has massive surge (120 queue)
    conn.execute("INSERT INTO demand_observations (stop_id, queue_count, booking_demand, observation_source, observed_at) VALUES (2, 120, 10, 'simulation', ?)", (now_iso,))
    # Madanapalle Bus Stand has normal demand
    conn.execute("INSERT INTO demand_observations (stop_id, queue_count, booking_demand, observation_source, observed_at) VALUES (1, 20, 0, 'simulation', ?)", (now_iso,))
    # Railway Station has normal demand
    conn.execute("INSERT INTO demand_observations (stop_id, queue_count, booking_demand, observation_source, observed_at) VALUES (3, 15, 0, 'simulation', ?)", (now_iso,))

    conn.commit()
    return conn

def test_prevent_double_booking_index(populated_db):
    """Enforce that database prevents two active 'approved' recommendations for same vehicle."""
    conn = populated_db
    repo = DispatchRepository(conn)

    # First approved recommendation
    rec1 = repo.create_recommendation(
        DispatchRecommendationBase(
            vehicle_id=1,
            source_stop_id=1,
            destination_stop_id=2,
            estimated_arrival_minutes=12.0,
            estimated_distance_km=8.5,
            useful_capacity=50,
            priority_score=85.0,
            reason="Test rec 1",
            route_source="haversine_estimate",
            status="proposed",
        )
    )
    repo.update_status(rec1.id, "approved")

    # Second recommendation for the same vehicle
    rec2 = repo.create_recommendation(
        DispatchRecommendationBase(
            vehicle_id=1,
            source_stop_id=1,
            destination_stop_id=3,
            estimated_arrival_minutes=10.0,
            estimated_distance_km=6.0,
            useful_capacity=50,
            priority_score=75.0,
            reason="Test rec 2",
            route_source="haversine_estimate",
            status="proposed",
        )
    )

    # Trying to approve second recommendation directly in DB must fail UNIQUE constraint
    with pytest.raises(sqlite3.IntegrityError):
        conn.execute("UPDATE dispatch_recommendations SET status = 'approved' WHERE id = ?", (rec2.id,))

@pytest.mark.asyncio
async def test_greedy_multi_vehicle_allocation(populated_db):
    """MITS shortage is 130 passengers. System should allocate multiple distinct buses greedily."""
    conn = populated_db
    engine = DispatchEngineService(conn)

    recs = await engine.run_pipeline()
    mits_recs = [r for r in recs if r.destination_stop_id == 2]

    # Verify at least 2 distinct buses were recommended for the large shortage
    assert len(mits_recs) >= 2
    allocated_vehicle_ids = {r.vehicle_id for r in mits_recs}
    assert len(allocated_vehicle_ids) == len(mits_recs), "Vehicles must be distinct in greedy assignment"
