-- Migration 001: Create stops table
-- SQLite-compatible. For Supabase/PostgreSQL: change INTEGER to SERIAL,
-- REAL to DOUBLE PRECISION, TEXT timestamps to TIMESTAMPTZ, INTEGER booleans to BOOLEAN.

CREATE TABLE IF NOT EXISTS stops (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    latitude        REAL NOT NULL,
    longitude       REAL NOT NULL,
    location_type   TEXT NOT NULL DEFAULT 'bus_stop',
    is_active       INTEGER NOT NULL DEFAULT 1,   -- 1=true, 0=false
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_stops_is_active ON stops(is_active);

