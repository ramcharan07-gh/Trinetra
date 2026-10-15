"""backend/tests/test_routing.py — Unit tests for routing and Haversine fallback."""
import pytest
from app.services.routing import haversine_km, get_route_estimate

def test_haversine_accuracy():
    # Distance between Madanapalle (13.5500, 78.5012) and MITS (13.5622, 78.5134)
    dist = haversine_km(13.5500, 78.5012, 13.5622, 78.5134)
    assert 1.0 < dist < 3.0

@pytest.mark.asyncio
async def test_get_route_estimate_returns_valid_duration():
    res = await get_route_estimate(13.5500, 78.5012, 13.5622, 78.5134)
    assert res.duration_minutes > 0
    assert res.distance_km > 0
    assert res.source in ("osrm", "haversine_estimate")

