# TRINETRA Architecture

## System Architecture

```mermaid
flowchart TD
    SIM["🎲 Simulation Engine\n(Python seed script)"]
    DB[("🗄️ SQLite / PostgreSQL Database\n(trinetra.db)")]
    API["⚡ FastAPI Backend\n:8000"]
    OSRM["🗺️ OSRM Demo Server\n(routing + ETA)"]
    ENGINE["🧠 Dispatch Engine\n(demand detect → rank → recommend)"]
    DASH["🖥️ React Dashboard\n:5173"]
    DISPATCHER{{"👤 Dispatcher\n(Approve / Adjust / Reject)"}}

    SIM -->|seed data| DB
    DB <-->|read/write| API
    API --> ENGINE
    ENGINE -->|ETA requests| OSRM
    OSRM -->|route + duration| ENGINE
    ENGINE -->|recommendations| API
    API -->|REST JSON| DASH
    DASH --> DISPATCHER
    DISPATCHER -->|POST approve/reject/adjust| API
    API -->|update assignment + log| DB
```

### Layers:
1. **Demand Signal Layer**: Queues, ticket/booking requests, historical baseline records.
2. **Data Platform Layer**: SQLite (local) / Supabase PostgreSQL (production), schema version migrations.
3. **Decision Engine Layer**: Demand surge detection, candidate filtering, route estimation, composite scoring, and waiting-time reduction estimation.
4. **Dispatch Control Layer**: React Leaflet dashboard with live status markers, approval controls, and audit log.

