"""
database/seed/seed_madanapalle.py
Seeds the database with simulated APSRTC-style transport data
for the Madanapalle / Chittoor district, Andhra Pradesh.

Run AFTER apply_migrations.py:
    python database/seed/seed_madanapalle.py

Data is entirely simulated — not actual APSRTC operational data.
"""
import sqlite3
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
import random

PROJECT_ROOT = Path(__file__).parent.parent.parent
DB_PATH = PROJECT_ROOT / "trinetra.db"

# ─── Simulated stops ────────────────────────────────────────────────────────
STOPS = [
    # id=1
    {"name": "Madanapalle Bus Stand",     "lat": 13.5500, "lon": 78.5012, "type": "bus_stand"},
    # id=2
    {"name": "MITS College",              "lat": 13.5622, "lon": 78.5134, "type": "college"},
    # id=3
    {"name": "Madanapalle Railway Stn",   "lat": 13.5478, "lon": 78.4961, "type": "railway_station"},
    # id=4
    {"name": "Punganur Bus Stand",        "lat": 13.3681, "lon": 78.5726, "type": "bus_stand"},
    # id=5
    {"name": "Pileru Bus Stand",          "lat": 13.6534, "lon": 78.9465, "type": "bus_stand"},
    # id=6
    {"name": "Vayalpad Bus Stand",        "lat": 13.8200, "lon": 78.6300, "type": "bus_stand"},
    # id=7
    {"name": "Palamaner Bus Stand",       "lat": 13.2028, "lon": 78.7482, "type": "bus_stand"},
    # id=8
    {"name": "Kuppam Bus Stand",          "lat": 12.7453, "lon": 78.3430, "type": "bus_stand"},
]

# ─── Simulated routes ───────────────────────────────────────────────────────
ROUTES = [
    {"name": "MND-PUN", "origin": 1, "dest": 4},  # Madanapalle ↔ Punganur
    {"name": "MND-PIL", "origin": 1, "dest": 5},  # Madanapalle ↔ Pileru
    {"name": "MND-VAY", "origin": 1, "dest": 6},  # Madanapalle ↔ Vayalpad
    {"name": "MND-PAL", "origin": 1, "dest": 7},  # Madanapalle ↔ Palamaner
    {"name": "MND-KUP", "origin": 1, "dest": 8},  # Madanapalle ↔ Kuppam
    {"name": "MND-MITS","origin": 1, "dest": 2},  # Bus Stand ↔ MITS College
    {"name": "MND-RLY", "origin": 1, "dest": 3},  # Bus Stand ↔ Railway Station
]

# ─── Simulated vehicles ─────────────────────────────────────────────────────
# Positions are slightly offset from stop coordinates to simulate realistic placement.
VEHICLES = [
    # Buses near Madanapalle Bus Stand (stop 1)
    {"code": "AP 27 Z 0045", "cap": 52, "occ": 12, "lat": 13.5498, "lon": 78.5010, "status": "available"},
    {"code": "AP 27 Z 0046", "cap": 45, "occ": 38, "lat": 13.5502, "lon": 78.5015, "status": "in_service"},
    {"code": "AP 27 Z 0051", "cap": 60, "occ": 14, "lat": 13.5497, "lon": 78.5008, "status": "available"},
    # Buses near Railway Station (stop 3)
    {"code": "AP 27 Z 0047", "cap": 52, "occ":  5, "lat": 13.5476, "lon": 78.4963, "status": "available"},
    # Buses near Punganur (stop 4)
    {"code": "AP 27 Z 0048", "cap": 40, "occ": 30, "lat": 13.3679, "lon": 78.5728, "status": "in_service"},
    {"code": "AP 27 Z 0054", "cap": 52, "occ":  8, "lat": 13.3683, "lon": 78.5724, "status": "available"},
    # Buses near Pileru (stop 5)
    {"code": "AP 27 Z 0050", "cap": 45, "occ": 15, "lat": 13.6532, "lon": 78.9467, "status": "available"},
    # Buses near Vayalpad (stop 6)
    {"code": "AP 27 Z 0049", "cap": 52, "occ": 20, "lat": 13.8202, "lon": 78.6302, "status": "available"},
    # Buses near Palamaner (stop 7)
    {"code": "AP 27 Z 0055", "cap": 40, "occ": 22, "lat": 13.2026, "lon": 78.7484, "status": "available"},
    # Buses near Kuppam (stop 8)
    {"code": "AP 27 Z 0053", "cap": 45, "occ": 10, "lat": 12.7451, "lon": 78.3432, "status": "available"},
    # Out-of-service buses (should be excluded from recommendations)
    {"code": "AP 27 Z 0056", "cap": 52, "occ":  0, "lat": 13.5500, "lon": 78.5012, "status": "out_of_service"},
    {"code": "AP 27 Z 0057", "cap": 45, "occ":  0, "lat": 13.5500, "lon": 78.5012, "status": "out_of_service"},
]

# ─── Historical demand baselines ────────────────────────────────────────────
# Generated baselines represent typical demand by time window.
# Format: (stop_id, day_of_week 0-6, time_window, avg_demand, median, samples)
def generate_baselines() -> list[dict]:
    """Generate plausible demand baselines for each stop and key time windows."""
    baselines = []
    # Stop-specific demand profiles (base demand per 30-min window)
    profiles = {
        1: {"morning": 35, "afternoon": 40, "evening": 50, "peak": 65},   # Bus Stand
        2: {"morning": 20, "afternoon": 80, "evening": 90, "peak": 110},  # MITS College (high afternoon/evening)
        3: {"morning": 45, "afternoon": 30, "evening": 55, "peak": 70},   # Railway Station
        4: {"morning": 25, "afternoon": 25, "evening": 30, "peak": 40},   # Punganur
        5: {"morning": 20, "afternoon": 20, "evening": 25, "peak": 35},   # Pileru
        6: {"morning": 15, "afternoon": 15, "evening": 20, "peak": 25},   # Vayalpad
        7: {"morning": 20, "afternoon": 18, "evening": 22, "peak": 30},   # Palamaner
        8: {"morning": 18, "afternoon": 15, "evening": 20, "peak": 28},   # Kuppam
    }

    time_windows = [
        ("06:00-06:30", "morning"), ("06:30-07:00", "morning"),
        ("07:00-07:30", "morning"), ("07:30-08:00", "morning"),
        ("08:00-08:30", "morning"), ("08:30-09:00", "morning"),
        ("09:00-09:30", "morning"), ("09:30-10:00", "morning"),
        ("10:00-10:30", "afternoon"), ("10:30-11:00", "afternoon"),
        ("11:00-11:30", "afternoon"), ("11:30-12:00", "afternoon"),
        ("12:00-12:30", "afternoon"), ("12:30-13:00", "afternoon"),
        ("13:00-13:30", "afternoon"), ("13:30-14:00", "afternoon"),
        ("14:00-14:30", "afternoon"), ("14:30-15:00", "afternoon"),
        ("15:00-15:30", "peak"),     ("15:30-16:00", "peak"),      # College dismissal
        ("16:00-16:30", "peak"),     ("16:30-17:00", "peak"),
        ("17:00-17:30", "evening"),  ("17:30-18:00", "evening"),
        ("18:00-18:30", "evening"),  ("18:30-19:00", "evening"),
        ("19:00-19:30", "evening"),  ("19:30-20:00", "evening"),
        ("20:00-20:30", "morning"),  ("20:30-21:00", "morning"),
    ]

    for stop_id, profile in profiles.items():
        for day in range(7):  # 0=Mon ... 6=Sun
            for window, period in time_windows:
                base = profile[period]
                # Weekend adjustment
                if day >= 5:
                    base = int(base * 0.7)
                # Add small variance
                avg = base + random.randint(-3, 3)
                med = avg + random.randint(-2, 2)
                baselines.append({
                    "stop_id": stop_id,
                    "day_of_week": day,
                    "time_window": window,
                    "average_demand": max(5, avg),
                    "median_demand": max(5, med),
                    "sample_count": random.randint(20, 60),
                })
    return baselines


def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _stale_ts() -> str:
    """Return a timestamp 2 hours ago — for simulating stale location data."""
    dt = datetime.now(timezone.utc) - timedelta(hours=2)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def seed(conn: sqlite3.Connection) -> None:
    now = _now_iso()

    # ── Clean up existing records in dependency order ──────────────────────────
    conn.execute("DELETE FROM dispatch_log")
    conn.execute("DELETE FROM dispatch_recommendations")
    conn.execute("DELETE FROM demand_observations")
    conn.execute("DELETE FROM demand_history")
    conn.execute("DELETE FROM vehicles")
    conn.execute("DELETE FROM routes")
    conn.execute("DELETE FROM stops")

    # Reset autoincrement sequence if sqlite_sequence exists
    try:
        conn.execute("DELETE FROM sqlite_sequence WHERE name IN ('stops', 'routes', 'vehicles', 'demand_observations', 'demand_history', 'dispatch_recommendations', 'dispatch_log')")
    except sqlite3.OperationalError:
        pass

    # ── Stops ────────────────────────────────────────────────────────────────
    print("Seeding stops...")
    for idx, stop in enumerate(STOPS, start=1):
        conn.execute(
            "INSERT INTO stops (id, name, latitude, longitude, location_type, is_active, created_at) "
            "VALUES (?, ?, ?, ?, ?, 1, ?)",
            (idx, stop["name"], stop["lat"], stop["lon"], stop["type"], now),
        )
    print(f"  {len(STOPS)} stops inserted.")

    # ── Routes ───────────────────────────────────────────────────────────────
    print("Seeding routes...")
    for route in ROUTES:
        conn.execute(
            "INSERT INTO routes (name, origin_stop_id, destination_stop_id, is_active) VALUES (?, ?, ?, 1)",
            (route["name"], route["origin"], route["dest"]),
        )
    print(f"  {len(ROUTES)} routes inserted.")

    # ── Vehicles ─────────────────────────────────────────────────────────────
    print("Seeding vehicles...")
    for v in VEHICLES:
        loc_ts = now if v["status"] != "out_of_service" else _stale_ts()
        conn.execute(
            "INSERT INTO vehicles "
            "(vehicle_code, capacity, occupied_seats, latitude, longitude, status, location_updated_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (v["code"], v["cap"], v["occ"], v["lat"], v["lon"], v["status"], loc_ts, now),
        )
    print(f"  {len(VEHICLES)} vehicles inserted.")

    # ── Historical demand baselines ───────────────────────────────────────────
    print("Seeding historical demand baselines...")
    conn.execute("DELETE FROM demand_history")
    baselines = generate_baselines()
    for b in baselines:
        conn.execute(
            "INSERT INTO demand_history "
            "(stop_id, day_of_week, time_window, average_demand, median_demand, sample_count, calculated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                b["stop_id"],
                b["day_of_week"],
                b["time_window"],
                b["average_demand"],
                b["median_demand"],
                b["sample_count"],
                now,
            ),
        )
    print(f"  {len(baselines)} baseline records inserted.")

    # ── Initial demand observations (normal baseline levels) ──────────────────
    print("Seeding initial demand observations...")
    conn.execute("DELETE FROM demand_observations")
    for stop_id in range(1, len(STOPS) + 1):
        conn.execute(
            "INSERT INTO demand_observations "
            "(stop_id, queue_count, booking_demand, observation_source, observed_at, data_quality) "
            "VALUES (?, ?, ?, 'simulation', ?, 'ok')",
            (stop_id, random.randint(5, 25), random.randint(2, 10), now),
        )
    print(f"  {len(STOPS)} initial observations inserted.")

    conn.commit()
    print("\n[OK] Seed complete.")
    print(f"   Database: {DB_PATH}")
    print("\nTo inject a demand surge, run:")
    print("  curl -X POST http://localhost:8000/api/demand/observations \\")
    print('    -H "Content-Type: application/json" \\')
    print('    -d \'{"stop_id": 2, "queue_count": 142, "booking_demand": 30, "observation_source": "manual"}\'')


if __name__ == "__main__":
    if not DB_PATH.exists():
        print(f"ERROR: Database not found at {DB_PATH}", file=sys.stderr)
        print("Run: python database/apply_migrations.py first", file=sys.stderr)
        sys.exit(1)

    random.seed(42)  # Reproducible seed data
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        seed(conn)
    finally:
        conn.close()

