-- Migration 007: Create bookings table

CREATE TABLE IF NOT EXISTS bookings (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    origin_stop_id          INTEGER NOT NULL REFERENCES stops(id),
    destination_stop_id     INTEGER NOT NULL REFERENCES stops(id),
    passenger_count         INTEGER NOT NULL CHECK(passenger_count > 0),
    booking_time            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    scheduled_travel_time   TEXT NOT NULL,
    data_source             TEXT NOT NULL DEFAULT 'simulation',
    created_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_origin ON bookings(origin_stop_id);
CREATE INDEX IF NOT EXISTS idx_bookings_time   ON bookings(scheduled_travel_time);

