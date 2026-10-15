"""backend/app/api/health.py — Health check endpoint."""
from fastapi import APIRouter
from app.database import get_db

router = APIRouter()

@router.get("/health")
def health_check():
    # Verify DB connectivity
    try:
        with get_db() as conn:
            conn.execute("SELECT 1").fetchone()
            db_status = "connected"
    except Exception as e:
        db_status = f"unreachable: {str(e)}"

    return {
        "status": "ok",
        "service": "TRINETRA Dispatch Backend",
        "database": db_status,
        "mode": "simulation",
    }

