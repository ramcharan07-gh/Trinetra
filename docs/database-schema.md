# TRINETRA Database Schema

## Tables Overview

### 1. `stops`
- `id` (INTEGER PRIMARY KEY)
- `name` (TEXT NOT NULL)
- `latitude` (REAL NOT NULL)
- `longitude` (REAL NOT NULL)
- `location_type` (TEXT DEFAULT 'bus_stop')
- `is_active` (INTEGER DEFAULT 1)
- `created_at` (TEXT)

### 2. `routes`
- `id` (INTEGER PRIMARY KEY)
- `name` (TEXT NOT NULL)
- `origin_stop_id` (INTEGER REFERENCES stops)
- `destination_stop_id` (INTEGER REFERENCES stops)
- `is_active` (INTEGER DEFAULT 1)

### 3. `vehicles`
- `id` (INTEGER PRIMARY KEY)
- `vehicle_code` (TEXT UNIQUE)
- `capacity` (INTEGER > 0)
- `occupied_seats` (INTEGER >= 0)
- `latitude` (REAL)
- `longitude` (REAL)
- `current_route_id` (INTEGER REFERENCES routes)
- `status` (TEXT: 'available', 'assigned', 'in_service', 'out_of_service')
- `location_updated_at` (TEXT)
- `updated_at` (TEXT)

### 4. `demand_observations`
- `id` (INTEGER PRIMARY KEY)
- `stop_id` (INTEGER REFERENCES stops)
- `queue_count` (INTEGER >= 0)
- `boarding_count` (INTEGER)
- `booking_demand` (INTEGER DEFAULT 0)
- `observation_source` (TEXT: 'simulation', 'manual', 'live')
- `observed_at` (TEXT)
- `data_quality` (TEXT DEFAULT 'ok')

### 5. `demand_history`
- `id` (INTEGER PRIMARY KEY)
- `stop_id` (INTEGER REFERENCES stops)
- `day_of_week` (INTEGER 0..6)
- `time_window` (TEXT, e.g. '14:30-15:00')
- `average_demand` (REAL)
- `median_demand` (REAL)
- `sample_count` (INTEGER)
- `calculated_at` (TEXT)

### 6. `dispatch_recommendations`
- `id` (INTEGER PRIMARY KEY)
- `vehicle_id` (INTEGER REFERENCES vehicles)
- `source_stop_id` (INTEGER REFERENCES stops)
- `destination_stop_id` (INTEGER REFERENCES stops)
- `estimated_arrival_minutes` (REAL)
- `estimated_distance_km` (REAL)
- `useful_capacity` (INTEGER)
- `priority_score` (REAL)
- `reason` (TEXT)
- `route_source` (TEXT)
- `status` (TEXT: 'proposed', 'approved', 'adjusted', 'rejected', 'cancelled', 'completed')
- `created_at` (TEXT)
- `reviewed_at` (TEXT)
- `reviewed_by` (TEXT)
- *Constraint: Unique partial index on `vehicle_id` WHERE `status = 'approved'` prevents double assignments.*

### 7. `dispatch_log`
- `id` (INTEGER PRIMARY KEY)
- `recommendation_id` (INTEGER REFERENCES dispatch_recommendations)
- `vehicle_id` (INTEGER REFERENCES vehicles)
- `action` (TEXT)
- `previous_state` (TEXT)
- `new_state` (TEXT)
- `notes` (TEXT)
- `created_at` (TEXT)

