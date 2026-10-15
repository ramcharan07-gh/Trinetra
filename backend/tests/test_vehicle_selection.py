"""backend/tests/test_vehicle_selection.py — Unit tests for vehicle filtering and scoring."""
import pytest
from app.services.vehicle_selection import VehicleSelectionService
from app.schemas.hotspot import Hotspot

@pytest.mark.asyncio
async def test_candidate_filtering_excludes_out_of_service(test_db):
    # Stops
    test_db.execute("INSERT INTO stops (id, name, latitude, longitude) VALUES (1, 'Stop A', 13.55, 78.50)")
    test_db.execute("INSERT INTO stops (id, name, latitude, longitude) VALUES (2, 'Stop B', 13.56, 78.51)")

    # Vehicles: 1 out of service, 1 available
    test_db.execute(
        "INSERT INTO vehicles (id, vehicle_code, capacity, occupied_seats, latitude, longitude, status) "
        "VALUES (1, 'BUS-01', 50, 0, 13.55, 78.50, 'out_of_service')"
    )
    test_db.execute(
        "INSERT INTO vehicles (id, vehicle_code, capacity, occupied_seats, latitude, longitude, status) "
        "VALUES (2, 'BUS-02', 50, 10, 13.55, 78.50, 'available')"
    )

    hotspot = Hotspot(
        stop_id=2,
        stop_name="Stop B",
        latitude=13.56,
        longitude=78.51,
        current_demand=100,
        historical_baseline=20.0,
        surge_ratio=5.0,
        capacity_shortage=80,
        available_capacity=0,
        priority="critical",
        observed_at="2026-10-15T12:00:00Z",
        data_quality="ok",
    )

    service = VehicleSelectionService(test_db)
    candidates = await service.find_best_candidates_for_hotspot(hotspot)

    assert len(candidates) == 1
    rec_base, route_res = candidates[0]
    assert rec_base.vehicle_id == 2
    assert rec_base.useful_capacity == 40
    assert rec_base.priority_score is not None
    assert "BUS-02" in rec_base.reason

