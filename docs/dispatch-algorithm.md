# TRINETRA Dispatch Algorithm Specification

## 1. Demand Surge Detection
- Computes `current_demand = queue_count + booking_demand`.
- Retrieves historical baseline for `(stop_id, day_of_week, 30_min_window)`.
- Calculates `surge_ratio = current_demand / max(historical_baseline, 1)`.
- Evaluates available bus capacity near the stop.
- Computes `capacity_shortage = max(0, current_demand - available_capacity)`.
- A location is classified as a Hotspot if:
  `(surge_ratio >= SURGE_THRESHOLD and capacity_shortage >= MIN_SHORTAGE) or (capacity_shortage >= 30)`.

## 2. Candidate Vehicle Filtering
Before ranking, hard operational constraints are enforced:
- `vehicle.status == 'available'`
- `vehicle.available_seats >= MIN_USEFUL_SEATS` (10 seats minimum)
- `vehicle.location_updated_at` must not be stale (> 30 mins)
- Vehicle must not have an existing active `approved` recommendation.
- Source stop must not be the destination stop itself.

## 3. Route & ETA Calculation
- Queries OSRM public demo server: `GET /route/v1/driving/{lon1},{lat1};{lon2},{lat2}`.
- If OSRM is unreachable or times out, uses Haversine straight-line distance with a 1.3x road winding factor at 40 km/h average speed.

## 4. Multi-Factor Scoring Formula
Normalized terms (0 to 1):
- `urgency_norm = min(1.0, shortage / 80)`
- `capacity_norm = min(1.0, available_seats / 55)`
- `eta_norm = max(0.0, 1.0 - (eta_minutes / 60.0))`
- `impact_norm = 0.9`

Composite Priority Score (0 to 100):
```
Score = (W_URGENCY * urgency_norm + W_CAPACITY * capacity_norm + W_ETA * eta_norm + W_IMPACT * impact_norm) * 100
```
Default weights:
- `W_URGENCY`: 0.35
- `W_CAPACITY`: 0.30
- `W_ETA`: 0.25
- `W_IMPACT`: 0.10

## 5. Waiting-Time Impact Estimation
- Baseline average wait assumes scheduled headway of ~25 mins and queue servicing rate.
- Projected average wait accounts for bus arrival time (ETA), boarding time, and remaining unserved queue.
- Percentage reduction is calculated as `((baseline - projected) / baseline) * 100`.

