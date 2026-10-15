-- Migration 006: Create simulation scenario and run audit tables

CREATE TABLE IF NOT EXISTS simulation_scenarios (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    description TEXT,
    config      TEXT NOT NULL, -- JSON string encoding stops, queues, vehicle positions and statuses
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS simulation_runs (
    id                          INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario_id                 INTEGER NOT NULL REFERENCES simulation_scenarios(id),
    scenario_name               TEXT NOT NULL,
    run_type                    TEXT NOT NULL CHECK(run_type IN ('baseline', 'reallocation')),
    avg_wait_minutes            REAL,
    total_passengers_served     INTEGER,
    residual_queue              INTEGER,
    vehicles_reassigned         INTEGER,
    capacity_utilisation_pct    REAL,
    recommendation_latency_ms   INTEGER,
    summary_notes               TEXT,
    created_at                  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_sim_runs_scenario ON simulation_runs(scenario_id);
CREATE INDEX IF NOT EXISTS idx_sim_runs_type ON simulation_runs(run_type);

