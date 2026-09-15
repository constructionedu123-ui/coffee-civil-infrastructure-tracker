"""
pipeline/storage/database.py
------------------------------
SQLite persistence layer: schema creation, upsert, and query helpers.
"""
from __future__ import annotations

import logging
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Generator, Optional

from pipeline.config import DB_PATH

log = logging.getLogger(__name__)

DDL = """
CREATE TABLE IF NOT EXISTS projects (
    project_id      TEXT PRIMARY KEY,
    project_name    TEXT NOT NULL,
    category        TEXT NOT NULL,
    status          TEXT NOT NULL,
    budget_idr      REAL,
    budget_raw      TEXT,
    contractor      TEXT,
    funding_scheme  TEXT,
    pjpk            TEXT,
    province        TEXT,
    regency         TEXT,
    latitude        REAL,
    longitude       REAL,
    geocode_method  TEXT DEFAULT 'unresolved',
    source_url      TEXT NOT NULL,
    source_name     TEXT NOT NULL,
    scraped_at      TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_category  ON projects(category);
CREATE INDEX IF NOT EXISTS idx_status    ON projects(status);
CREATE INDEX IF NOT EXISTS idx_province  ON projects(province);
CREATE INDEX IF NOT EXISTS idx_source    ON projects(source_name);
"""


@contextmanager
def _connect(db_path: Path = DB_PATH) -> Generator[sqlite3.Connection, None, None]:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db(db_path: Path = DB_PATH) -> None:
    """Create tables and indexes if they don't exist, and migrate columns if needed."""
    with _connect(db_path) as conn:
        conn.executescript(DDL)
        # Check for existing table schema migrations
        cursor = conn.execute("PRAGMA table_info(projects)")
        existing_cols = {row["name"] for row in cursor.fetchall()}
        if "funding_scheme" not in existing_cols:
            conn.execute("ALTER TABLE projects ADD COLUMN funding_scheme TEXT;")
        if "pjpk" not in existing_cols:
            conn.execute("ALTER TABLE projects ADD COLUMN pjpk TEXT;")
    log.info("Database initialised at %s", db_path)


def upsert_project(record: dict, db_path: Path = DB_PATH) -> None:
    """
    Insert or update a project record. On conflict (project_id), update
    all mutable fields and bump updated_at.
    """
    sql = """
    INSERT INTO projects (
        project_id, project_name, category, status, budget_idr, budget_raw,
        contractor, funding_scheme, pjpk, province, regency, latitude, longitude, geocode_method,
        source_url, source_name, scraped_at
    ) VALUES (
        :project_id, :project_name, :category, :status, :budget_idr, :budget_raw,
        :contractor, :funding_scheme, :pjpk, :province, :regency, :latitude, :longitude, :geocode_method,
        :source_url, :source_name, :scraped_at
    )
    ON CONFLICT(project_id) DO UPDATE SET
        project_name   = excluded.project_name,
        category       = excluded.category,
        status         = excluded.status,
        budget_idr     = excluded.budget_idr,
        budget_raw     = excluded.budget_raw,
        contractor     = excluded.contractor,
        funding_scheme = excluded.funding_scheme,
        pjpk           = excluded.pjpk,
        province       = excluded.province,
        regency        = excluded.regency,
        latitude       = excluded.latitude,
        longitude      = excluded.longitude,
        geocode_method = excluded.geocode_method,
        source_url     = excluded.source_url,
        scraped_at     = excluded.scraped_at,
        updated_at     = datetime('now')
    """
    record.setdefault("scraped_at", datetime.utcnow().isoformat())
    record.setdefault("funding_scheme", None)
    record.setdefault("pjpk", None)
    with _connect(db_path) as conn:
        conn.execute(sql, record)


def upsert_many(records: list[dict], db_path: Path = DB_PATH) -> int:
    """Batch upsert; returns number of records processed."""
    count = 0
    with _connect(db_path) as conn:
        for rec in records:
            rec.setdefault("scraped_at", datetime.utcnow().isoformat())
            rec.setdefault("funding_scheme", None)
            rec.setdefault("pjpk", None)
            conn.execute("""
                INSERT INTO projects (
                    project_id, project_name, category, status, budget_idr, budget_raw,
                    contractor, funding_scheme, pjpk, province, regency, latitude, longitude, geocode_method,
                    source_url, source_name, scraped_at
                ) VALUES (
                    :project_id, :project_name, :category, :status,
                    :budget_idr, :budget_raw, :contractor, :funding_scheme, :pjpk, :province, :regency,
                    :latitude, :longitude, :geocode_method,
                    :source_url, :source_name, :scraped_at
                )
                ON CONFLICT(project_id) DO UPDATE SET
                    project_name   = excluded.project_name,
                    category       = excluded.category,
                    status         = excluded.status,
                    budget_idr     = excluded.budget_idr,
                    budget_raw     = excluded.budget_raw,
                    contractor     = excluded.contractor,
                    funding_scheme = excluded.funding_scheme,
                    pjpk           = excluded.pjpk,
                    province       = excluded.province,
                    regency        = excluded.regency,
                    latitude       = excluded.latitude,
                    longitude      = excluded.longitude,
                    geocode_method = excluded.geocode_method,
                    source_url     = excluded.source_url,
                    scraped_at     = excluded.scraped_at,
                    updated_at     = datetime('now')
            """, rec)
            count += 1
    return count


def get_all_projects(db_path: Path = DB_PATH) -> list[dict]:
    """Return all project rows as list of dicts."""
    with _connect(db_path) as conn:
        rows = conn.execute("SELECT * FROM projects ORDER BY project_name").fetchall()
    return [dict(row) for row in rows]


def get_summary(db_path: Path = DB_PATH) -> dict:
    """Return quick stats about the database contents."""
    with _connect(db_path) as conn:
        total = conn.execute("SELECT COUNT(*) FROM projects").fetchone()[0]
        by_cat = conn.execute(
            "SELECT category, COUNT(*) as n FROM projects GROUP BY category"
        ).fetchall()
        by_status = conn.execute(
            "SELECT status, COUNT(*) as n FROM projects GROUP BY status"
        ).fetchall()
        geocoded = conn.execute(
            "SELECT COUNT(*) FROM projects WHERE latitude IS NOT NULL"
        ).fetchone()[0]

    return {
        "total": total,
        "geocoded": geocoded,
        "by_category": {row["category"]: row["n"] for row in by_cat},
        "by_status": {row["status"]: row["n"] for row in by_status},
    }
