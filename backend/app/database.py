"""backend/app/database.py — SQLite database connection management."""
import sqlite3
import os
from pathlib import Path
from contextlib import contextmanager
from typing import Generator
from app.config import settings

def get_db_path() -> Path:
    # Resolve relative to backend or root
    p = Path(settings.DB_PATH)
    if not p.is_absolute():
        # Check current dir, or parent dir
        if p.exists():
            return p.resolve()
        cwd_p = Path.cwd() / p
        if cwd_p.exists():
            return cwd_p.resolve()
        # Fallback to project root trinetra.db
        root_db = Path(__file__).parent.parent.parent / "trinetra.db"
        return root_db.resolve()
    return p

@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    db_path = get_db_path()
    conn = sqlite3.connect(str(db_path), timeout=15.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    try:
        yield conn
    finally:
        conn.close()

