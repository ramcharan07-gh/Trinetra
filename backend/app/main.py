"""backend/app/main.py — FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import sys

from app.config import settings
from app.api import health, stops, vehicles, demand, hotspots, dispatch
from app.database import get_db_path

app = FastAPI(
    title="TRINETRA Dispatch Engine API",
    description="Intelligent, demand-driven bus reallocation on passenger surges.",
    version="0.1.0",
)

# Configure CORS
origins = [
    settings.FRONTEND_ORIGIN,
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(health.router, tags=["health"])
app.include_router(stops.router, prefix="/api", tags=["stops"])
app.include_router(vehicles.router, prefix="/api", tags=["vehicles"])
app.include_router(demand.router, prefix="/api", tags=["demand"])
app.include_router(hotspots.router, prefix="/api", tags=["hotspots"])
app.include_router(dispatch.router, prefix="/api", tags=["dispatch"])

@app.on_event("startup")
def on_startup():
    db_file = get_db_path()
    print(f"TRINETRA Backend initialized. Database path: {db_file}")

