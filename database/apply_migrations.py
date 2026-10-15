"""
database/apply_migrations.py
Applies all SQL migration files in order to the SQLite database.
Run from the project root: python database/apply_migrations.py
"""
import sqlite3
import os
import sys
from pathlib import Path

# Database lives at the project root
PROJECT_ROOT = Path(__file__).parent.parent
DB_PATH = PROJECT_ROOT / "trinetra.db"
MIGRATIONS_DIR = Path(__file__).parent / "migrations"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def ensure_migrations_table(conn: sqlite3.Connection) -> None:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS _schema_migrations (
            filename    TEXT PRIMARY KEY,
            applied_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
        )
    """)
    conn.commit()


def get_applied_migrations(conn: sqlite3.Connection) -> set[str]:
    rows = conn.execute("SELECT filename FROM _schema_migrations").fetchall()
    return {row["filename"] for row in rows}


def apply_migrations(conn: sqlite3.Connection) -> None:
    ensure_migrations_table(conn)
    applied = get_applied_migrations(conn)

    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not migration_files:
        print("No migration files found in", MIGRATIONS_DIR)
        return

    new_count = 0
    for migration_file in migration_files:
        filename = migration_file.name
        if filename in applied:
            print(f"  [skip]    {filename}")
            continue

        sql = migration_file.read_text(encoding="utf-8")
        try:
            conn.executescript(sql)
            conn.execute(
                "INSERT INTO _schema_migrations (filename) VALUES (?)", (filename,)
            )
            conn.commit()
            print(f"  [applied] {filename}")
            new_count += 1
        except sqlite3.Error as exc:
            print(f"  [ERROR]   {filename}: {exc}", file=sys.stderr)
            conn.rollback()
            sys.exit(1)

    if new_count == 0:
        print("Database is already up to date.")
    else:
        print(f"\nApplied {new_count} migration(s). Database: {DB_PATH}")


if __name__ == "__main__":
    print(f"Applying migrations to: {DB_PATH}\n")
    with get_connection() as conn:
        apply_migrations(conn)

