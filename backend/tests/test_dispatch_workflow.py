"""backend/tests/test_dispatch_workflow.py — End-to-end integration test for dispatch workflow."""
import pytest
from app.services.dispatch_engine import DispatchEngineService
from app.repositories.dispatch import DispatchRepository
from app.repositories.demand import DemandRepository
from app.schemas.demand import DemandObservationCreate

@pytest.mark.asyncio
async def test_full_dispatch_approval_lifecycle(test_db):
    # 1. Seed stops
    test_db.execute("INSERT INTO stops (id, name, latitude, longitude) VALUES (1, 'Madanapalle Bus Stand', 13.5500, 78.5012)")
    test_db.execute("INSERT INTO stops (id, name, latitude, longitude) VALUES (2, 'MITS College', 13.5622, 78.5134)")

    # 2. Seed vehicle at Stop 1
    test_db.execute(
        "INSERT INTO vehicles (id, vehicle_code, capacity, occupied_seats, latitude, longitude, status) "
        "VALUES (10, 'AP 27 Z 9999', 50, 10, 13.5500, 78.5012, 'available')"
    )

    # 3. Inject demand surge at Stop 2
    demand_repo = DemandRepository(test_db)
    demand_repo.add_observation(
        DemandObservationCreate(stop_id=2, queue_count=130, booking_demand=20)
    )

    # 4. Run pipeline
    engine = DispatchEngineService(test_db)
    recs = await engine.run_pipeline()

    assert len(recs) >= 1
    rec = [r for r in recs if r.vehicle_id == 10][0]
    assert rec.status == "proposed"
    assert rec.destination_stop_id == 2
    assert rec.impact is not None
    assert rec.impact.baseline_wait_minutes > 0

    # 5. Approve recommendation
    dispatch_repo = DispatchRepository(test_db)
    approved = dispatch_repo.update_status(rec.id, "approved")
    assert approved.status == "approved"

    # Verify vehicle status is now 'assigned'
    v_row = test_db.execute("SELECT status FROM vehicles WHERE id = 10").fetchone()
    assert v_row["status"] == "assigned"

    # Verify audit log recorded approval
    logs = dispatch_repo.get_logs()
    assert any(l.recommendation_id == rec.id and l.action == "approved" for l in logs)

    # 6. Verify conflict prevention: attempting to approve a second rec for vehicle 10 should be detected
    assert dispatch_repo.has_active_approval(10) is True

