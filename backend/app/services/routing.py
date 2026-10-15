"""backend/app/services/routing.py — Routing service with OSRM and Haversine fallback."""
import math
import httpx
from typing import Optional, List, Tuple
from pydantic import BaseModel
from app.config import settings
from app.schemas.dispatch import RouteGeometry, RouteSource

class RouteResult(BaseModel):
    duration_minutes: float
    distance_km: float
    geometry: Optional[List[Tuple[float, float]]] = None # [lon, lat] pairs from OSRM
    source: RouteSource

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in kilometers."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

async def get_route_estimate(
    origin_lat: float, origin_lon: float,
    dest_lat: float, dest_lon: float
) -> RouteResult:
    """
    Query OSRM public demo server for route duration and geometry.
    If fails/times out, fall back to Haversine * 1.3 road multiplier / 40 km/h.
    """
    try:
        # Note: OSRM expects longitude,latitude pairs in GeoJSON order
        url = (
            f"{settings.OSRM_BASE_URL}/route/v1/driving/"
            f"{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
        )
        params = {"overview": "full", "geometries": "geojson", "steps": "false"}
        async with httpx.AsyncClient(timeout=settings.OSRM_TIMEOUT_SECONDS) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("routes") and len(data["routes"]) > 0:
                    route = data["routes"][0]
                    duration_min = route["duration"] / 60.0
                    dist_km = route["distance"] / 1000.0
                    coords = [
                        (pt[0], pt[1]) for pt in route["geometry"]["coordinates"]
                    ]
                    return RouteResult(
                        duration_minutes=round(duration_min, 1),
                        distance_km=round(dist_km, 1),
                        geometry=coords,
                        source="osrm",
                    )
    except Exception:
        pass

    # Fallback to straight-line haversine distance with 1.3x road detour factor
    dist_km = haversine_km(origin_lat, origin_lon, dest_lat, dest_lon) * 1.3
    # Average speed in semi-urban / rural bus operation: 40 km/h
    duration_min = (dist_km / 40.0) * 60.0
    return RouteResult(
        duration_minutes=max(1.0, round(duration_min, 1)),
        distance_km=round(dist_km, 1),
        geometry=None,
        source="haversine_estimate",
    )

