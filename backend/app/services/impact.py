"""backend/app/services/impact.py — Passenger waiting-time and service impact calculations."""
from app.schemas.dispatch import ImpactEstimate

def calculate_waiting_time_impact(
    queue_size: int,
    bus_capacity: int,
    eta_minutes: float,
    arrival_rate_per_min: float = 2.0,
) -> ImpactEstimate:
    """
    Estimate passenger waiting times before and after vehicle reallocation.

    - baseline_wait_minutes: Average wait if passengers have to wait for normal scheduled bus
      (approximated based on queue size and processing/arrival rate, minimum 15 mins baseline).
    - passengers_cleared: min(queue_size, bus_capacity).
    - remaining_queue: max(0, queue_size - passengers_cleared).
    - projected_wait_minutes: Wait until bus arrives (ETA) + wait for any remaining passengers.
    - reduction_percent: ((baseline - projected) / baseline) * 100.
    """
    # Baseline expected wait without emergency reallocation (assuming ~25-30 mins headway for next bus)
    baseline_headway = 25.0
    baseline_wait = max(baseline_headway, (queue_size / max(arrival_rate_per_min, 0.5)))

    passengers_cleared = min(queue_size, bus_capacity)
    remaining_queue = max(0, queue_size - passengers_cleared)

    # Projected wait: passengers on this bus wait their ETA (avg ~ ETA/2 + boarding time),
    # remaining queue waits for next regular service
    served_fraction = passengers_cleared / max(queue_size, 1)
    avg_wait_for_served = eta_minutes + 2.0 # ETA + 2 min boarding
    avg_wait_for_remaining = eta_minutes + baseline_headway

    projected_wait = (served_fraction * avg_wait_for_served) + ((1.0 - served_fraction) * avg_wait_for_remaining)

    reduction_pct = None
    if baseline_wait > 0:
        reduction_pct = round(((baseline_wait - projected_wait) / baseline_wait) * 100.0, 1)

    return ImpactEstimate(
        baseline_wait_minutes=round(baseline_wait, 1),
        projected_wait_minutes=round(projected_wait, 1),
        reduction_percent=reduction_pct,
        passengers_cleared=passengers_cleared,
        remaining_queue=remaining_queue,
    )

