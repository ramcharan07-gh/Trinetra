-- Migration 005: Create dispatch tables

CREATE TABLE IF NOT EXISTS dispatch_recommendations (
    id                          INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id                  INTEGER NOT NULL REFERENCES vehicles(id),
    source_stop_id              INTEGER NOT NULL REFERENCES stops(id),
    destination_stop_id         INTEGER NOT NULL REFERENCES stops(id),
    estimated_arrival_minutes   REAL,
    estimated_distance_km       REAL,
    useful_capacity             INTEGER NOT NULL,
    priority_score              REAL,
    reason                      TEXT NOT NULL,
    route_source                TEXT DEFAULT 'unknown',   -- 'osrm' | 'haversine_estimate'
    -- status: proposed | approved | adjusted | rejected | cancelled | completed
    status                      TEXT NOT NULL DEFAULT 'proposed'
                                    CHECK(status IN ('proposed','approved','adjusted','rejected','cancelled','completed')),
    created_at                  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    reviewed_at                 TEXT,
    reviewed_by                 TEXT
);

-- Enforce: only ONE 'approved' recommendation per vehicle at a time
-- SQLite supports partial indexes since 3.8.9
CREATE UNIQUE INDEX IF NOT EXISTS uniq_vehicle_active_approval
    ON dispatch_recommendations(vehicle_id)
    WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_dispatch_status    ON dispatch_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_dispatch_vehicle   ON dispatch_recommendations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_dest      ON dispatch_recommendations(destination_stop_id);

-- Audit log for every state transition
CREATE TABLE IF NOT EXISTS dispatch_log (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    recommendation_id   INTEGER NOT NULL REFERENCES dispatch_recommendations(id),
    vehicle_id          INTEGER NOT NULL REFERENCES vehicles(id),
    -- action: proposed | approved | adjusted | rejected | cancelled | completed
    action              TEXT NOT NULL,
    previous_state      TEXT,
    new_state           TEXT,
    notes               TEXT,
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_log_recommendation ON dispatch_log(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_log_vehicle        ON dispatch_log(vehicle_id);

