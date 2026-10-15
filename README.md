# TRINETRA

**Real-Time Vehicle Reallocation on Demand Spikes**

> Team E2 · Madanapalle Institute of Technology and Science

TRINETRA detects passenger demand surges, identifies available buses, ranks feasible reallocation recommendations, and presents them through a dispatcher dashboard with approval controls.

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1 — Clone & configure

```bash
git clone https://github.com/ramcharan07-gh/Trinetra.git
cd Trinetra
cp .env.example backend/.env
```

### 2 — Set up the database

```bash
cd database
python apply_migrations.py        # creates trinetra.db in project root
python seed/seed_madanapalle.py   # loads 8 stops, 12 buses, historical baselines
cd ..
```

### 3 — Start the backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
# API running at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### 4 — Start the frontend

```bash
cd frontend
cp .env.example .env.local        # VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev
# Dashboard at http://localhost:5173
```

### 5 — Try the dispatch workflow

```bash
# Inject a demand surge at MITS College (stop id 2)
curl -X POST http://localhost:8000/api/demand/observations \
  -H "Content-Type: application/json" \
  -d '{"stop_id": 2, "queue_count": 142, "booking_demand": 30, "observation_source": "manual"}'

# Detect hotspots
curl http://localhost:8000/api/hotspots

# Generate recommendations
curl -X POST http://localhost:8000/api/dispatch/recommendations

# Approve recommendation id 1
curl -X POST http://localhost:8000/api/dispatch/recommendations/1/approve
```

---

## Project Structure

```
Trinetra/
├── database/
│   ├── migrations/          SQL schema files (SQLite, Supabase-compatible)
│   ├── seed/                Simulation data for Madanapalle/Chittoor district
│   └── apply_migrations.py  Migration runner
├── backend/
│   ├── app/
│   │   ├── api/             HTTP route handlers
│   │   ├── schemas/         Pydantic request/response models
│   │   ├── repositories/    Database access layer
│   │   └── services/        Demand detection, dispatch engine, routing, impact
│   └── tests/               Unit + integration tests
├── frontend/
│   └── src/
│       ├── features/        demand, fleet, dispatch, impact panels
│       ├── components/      Shared UI (map, badges, layout)
│       └── pages/           Dashboard page
└── docs/                    Architecture, algorithm, schema docs
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript + Tailwind CSS v3 |
| Mapping | react-leaflet + Leaflet |
| Backend | FastAPI + Python |
| Database | SQLite (local) → Supabase PostgreSQL (production) |
| Routing/ETA | OSRM demo server (Haversine fallback) |
| Deployment | Vercel (frontend) + Render (backend) |

## Cloud Deployment Guide (Recommended: Render + Vercel)

TRINETRA is pre-configured for automated cloud deployment across **Render** (FastAPI backend) and **Vercel** (React frontend).

### 1. Deploy Backend to Render (Free Tier)
1. Fork or push your code to your GitHub repository.
2. Sign in to [Render.com](https://render.com) and click **New + > Web Service** (or **Blueprint** using `render.yaml`).
3. Connect your repository and configure:
   - **Root Directory:** `backend`
   - **Environment:** `Python`
   - **Build Command:** `pip install -r requirements.txt && python ../database/apply_migrations.py && python ../database/seed/seed_madanapalle.py`
   - **Start Command:** `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. In **Environment Variables**, set:
   - `CORS_ORIGINS`: `*`
   - `DB_PATH`: `../trinetra.db`
5. Click **Create Web Service**. Once deployed, copy your Render URL (e.g. `https://trinetra-backend.onrender.com`).

### 2. Deploy Frontend to Vercel (Free Tier)
1. Sign in to [Vercel.com](https://vercel.com) and click **Add New... > Project**.
2. Select your repository.
3. Configure the project:
   - **Root Directory:** click Edit and select `frontend`.
   - **Framework Preset:** `Vite` (detected automatically).
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL`: Your Render backend URL (e.g. `https://trinetra-backend.onrender.com`)
5. Click **Deploy**. Your dashboard is immediately live with HTTPS and custom domain support!

## Data Source

All data is **simulated** — clearly labelled `[SIMULATED DATA ENVIRONMENT]` throughout the UI. No actual APSRTC operational data is used.

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — System architecture
- [`docs/dispatch-algorithm.md`](docs/dispatch-algorithm.md) — Dispatch engine logic
- [`docs/database-schema.md`](docs/database-schema.md) — Schema + ERD