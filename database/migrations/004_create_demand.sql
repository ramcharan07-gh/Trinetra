-- Migration 004: Create demand tables

CREATE TABLE IF NOT EXISTS demand_observations (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    stop_id             INTEGER NOT NULL REFERENCES stops(id),
    queue_count         INTEGER NOT NULL DEFAULT 0 CHECK(queue_count >= 0),
    boarding_count      INTEGER,
    booking_demand      INTEGER DEFAULT 0,
    -- observation_source: simulation | manual | live
    observation_source  TEXT NOT NULL DEFAULT 'simulation',
    observed_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    -- data_quality: ok | stale | low_confidence | missing
    data_quality        TEXT DEFAULT 'ok'
);

CREATE INDEX IF NOT EXISTS idx_demand_obs_stop     ON demand_observations(stop_id);
CREATE INDEX IF NOT EXISTS idx_demand_obs_time     ON demand_observations(observed_at);

-- Historical demand baselines (aggregated by stop, day, time window)
CREATE TABLE IF NOT EXISTS demand_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    stop_id         INTEGER NOT NULL REFERENCES stops(id),
    -- 0=Monday ... 6=Sunday (Python weekday() convention)
    day_of_week     INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
    -- e.g. '08:00-08:30', '14:30-15:00'
    time_window     TEXT NOT NULL,
    average_demand  REAL NOT NULL,
    median_demand   REAL,
    sample_count    INTEGER NOT NULL DEFAULT 0,
    calculated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE(stop_id, day_of_week, time_window)
);

CREATE INDEX IF NOT EXISTS idx_demand_hist_stop ON demand_history(stop_id);

