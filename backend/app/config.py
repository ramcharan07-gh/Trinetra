"""backend/app/config.py — Application settings loaded from environment / .env file."""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database — path to the SQLite file (relative to where uvicorn is launched)
    DB_PATH: str = "../trinetra.db"

    # OSRM routing service (public demo; falls back to Haversine if unavailable)
    OSRM_BASE_URL: str = "https://router.project-osrm.org"
    OSRM_TIMEOUT_SECONDS: float = 5.0

    # CORS — the React dev server origin
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    # ── Demand detection thresholds ──────────────────────────────────────────
    # Surge is detected when current_demand / historical_baseline >= SURGE_THRESHOLD
    SURGE_THRESHOLD: float = 1.5
    # Minimum passenger gap to flag as a hotspot (prevents false positives at tiny stops)
    MIN_SHORTAGE: int = 10
    # Vehicle locations older than this are marked stale
    STALE_LOCATION_MINUTES: int = 30

    # ── Vehicle selection constraints ────────────────────────────────────────
    # A candidate must have at least this many free seats
    MIN_USEFUL_SEATS: int = 10
    # The source stop must retain at least this many available seats after reassignment
    MIN_SOURCE_CAPACITY: int = 20

    # ── Scoring weights (must be positive; relative importance only) ─────────
    W_URGENCY: float = 0.35   # How urgently the shortage needs to be addressed
    W_CAPACITY: float = 0.30  # How many passengers the bus can take
    W_ETA: float = 0.25       # Penalise buses that arrive late
    W_IMPACT: float = 0.10    # Penalise moves that hurt the source area


settings = Settings()

