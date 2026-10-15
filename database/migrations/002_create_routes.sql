-- Migration 002: Create routes table

CREATE TABLE IF NOT EXISTS routes (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    name                TEXT NOT NULL,
    origin_stop_id      INTEGER NOT NULL REFERENCES stops(id),
    destination_stop_id INTEGER NOT NULL REFERENCES stops(id),
    is_active           INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_routes_origin ON routes(origin_stop_id);
CREATE INDEX IF NOT EXISTS idx_routes_destination ON routes(destination_stop_id);

