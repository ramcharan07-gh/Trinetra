"""backend/tests/conftest.py — Pytest fixtures for in-memory or test SQLite database."""
import pytest
import sqlite3
from pathlib import Path

MIGRATIONS_DIR = Path(__file__).parent.parent.parent / "database" / "migrations"

@pytest.fixture
def test_db():
    """In-memory SQLite connection with migrations applied."""
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")

    for f in sorted(MIGRATIONS_DIR.glob("*.sql")):
        conn.executescript(f.read_text(encoding="utf-8"))

    yield conn
    conn.close()

