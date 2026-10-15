-- Migration 003: Create vehicles table

CREATE TABLE IF NOT EXISTS vehicles (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_code        TEXT NOT NULL UNIQUE,
    capacity            INTEGER NOT NULL CHECK(capacity > 0),
    occupied_seats      INTEGER NOT NULL DEFAULT 0 CHECK(occupied_seats >= 0),
    latitude            REAL,
    longitude           REAL,
    current_route_id    INTEGER REFERENCES routes(id),
    -- status: available | assigned | in_service | out_of_service
    status              TEXT NOT NULL DEFAULT 'available'
                            CHECK(status IN ('available','assigned','in_service','out_of_service')),
    location_updated_at TEXT,
    updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    CHECK(occupied_seats <= capacity)
);

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_updated ON vehicles(updated_at);

