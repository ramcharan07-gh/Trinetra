"""backend/tests/test_demand_detection.py — Unit tests for demand surge detection."""
import pytest
from app.services.demand_detection import DemandDetectionService
from app.repositories.demand import DemandRepository
from app.schemas.demand import DemandObservationCreate

def test_detect_no_hotspots_on_normal_demand(test_db):
    # Seed 1 stop
    test_db.execute(
        "INSERT INTO stops (id, name, latitude, longitude, location_type, is_active) VALUES (1, 'Madanapalle', 13.55, 78.50, 'bus_stand', 1)"
    )
    # Seed normal demand history
    test_db.execute(
        "INSERT INTO demand_history (stop_id, day_of_week, time_window, average_demand) VALUES (1, 0, '12:00-12:30', 20.0)"
    )
    # Seed small observation
    repo = DemandRepository(test_db)
    repo.add_observation(DemandObservationCreate(stop_id=1, queue_count=10, booking_demand=5))

    service = DemandDetectionService(test_db)
    hotspots = service.detect_hotspots()
    assert len(hotspots) == 0

def test_detect_hotspot_on_surge(test_db):
    test_db.execute(
        "INSERT INTO stops (id, name, latitude, longitude, location_type, is_active) VALUES (2, 'MITS College', 13.56, 78.51, 'college', 1)"
    )
    # Baseline is 30
    test_db.execute(
        "INSERT INTO demand_history (stop_id, day_of_week, time_window, average_demand) VALUES (2, 0, '12:00-12:30', 30.0)"
    )
    # Surge observation: queue 120 + booking 30 = 150
    repo = DemandRepository(test_db)
    repo.add_observation(DemandObservationCreate(stop_id=2, queue_count=120, booking_demand=30))

    service = DemandDetectionService(test_db)
    hotspots = service.detect_hotspots()
    assert len(hotspots) == 1
    h = hotspots[0]
    assert h.stop_id == 2
    assert h.current_demand == 150
    assert h.capacity_shortage >= 100
    assert h.priority in ("critical", "high")

