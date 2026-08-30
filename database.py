"""
APIx Database Layer (SQLite for prototype with PostgreSQL-compatible schema)
SIH 2026 PS 26056

Tables:
1. fares: (id, source, origin, destination, travel_date, advance_purchase_days, base_fare, taxes_fees, fare_total, scraped_at, status)
2. event_tags: (id, date, tag_type, description)
"""

import sqlite3
import csv
import os
from typing import List, Dict, Any, Optional
from data_cleaning import clean_fare_dataset, clean_outliers, deduplicate_records, separate_components

DB_FILE = os.path.join(os.path.dirname(__file__), "fares.db")
CSV_FILE = os.path.join(os.path.dirname(__file__), "apix_pilot_fares.csv")

INITIAL_EVENT_TAGS = [
    {
        "date": "2026-08-01",
        "tag_type": "ATF_FUEL_REVISION",
        "description": "OMCs revised Aviation Turbine Fuel (ATF) prices by +2.8% for domestic carriers."
    },
    {
        "date": "2026-08-08",
        "tag_type": "WEEKEND_PEAK",
        "description": "Weekend demand surge across high-density metro trunk routes."
    },
    {
        "date": "2026-08-14",
        "tag_type": "HOLIDAY_EVE_RUSH",
        "description": "Independence Day extended long weekend leisure and homecoming traffic spike."
    },
    {
        "date": "2026-08-15",
        "tag_type": "HOLIDAY_SURGE",
        "description": "Peak holiday airfare across Delhi-Mumbai and Delhi-Kolkata trunk routes."
    },
    {
        "date": "2026-08-22",
        "tag_type": "FESTIVE_SURGE",
        "description": "Janmashtami and Raksha Bandhan homecoming booking surge on tier-1 city pairs."
    },
    {
        "date": "2026-08-28",
        "tag_type": "MARKET_NORMALIZATION",
        "description": "Post-holiday yield normalization and promotional capacity additions."
    }
]


def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(force_reseed: bool = False):
    conn = get_db_connection()
    cursor = conn.cursor()

    if force_reseed:
        cursor.execute("DROP TABLE IF EXISTS fares;")
        cursor.execute("DROP TABLE IF EXISTS event_tags;")

    # 1. Fares Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS fares (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source VARCHAR(50) NOT NULL,
        origin VARCHAR(10) NOT NULL,
        destination VARCHAR(10) NOT NULL,
        travel_date DATE NOT NULL,
        advance_purchase_days INTEGER NOT NULL,
        base_fare REAL,
        taxes_fees REAL,
        fare_total REAL NOT NULL,
        scraped_at TIMESTAMP NOT NULL,
        status VARCHAR(30) DEFAULT 'SIMULATED_BACKTEST'
    );
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fares_route ON fares(origin, destination);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fares_scraped_at ON fares(scraped_at);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_fares_adv_days ON fares(advance_purchase_days);")

    # 2. Event Tags Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS event_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        tag_type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL
    );
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_date ON event_tags(date);")

    cursor.execute("SELECT COUNT(*) FROM fares")
    fare_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM event_tags")
    event_count = cursor.fetchone()[0]

    if event_count == 0 or force_reseed:
        if force_reseed and event_count > 0:
            cursor.execute("DELETE FROM event_tags")
        for ev in INITIAL_EVENT_TAGS:
            cursor.execute("""
            INSERT INTO event_tags (date, tag_type, description)
            VALUES (?, ?, ?)
            """, (ev["date"], ev["tag_type"], ev["description"]))

    if fare_count == 0 or force_reseed:
        if force_reseed and fare_count > 0:
            cursor.execute("DELETE FROM fares")

        if os.path.exists(CSV_FILE):
            raw_records = []
            with open(CSV_FILE, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    raw_records.append(row)

            # Pass through real cleaning pipeline: deduplication, outlier filtering, component separation
            cleaned_records, outliers = clean_fare_dataset(raw_records)
            if outliers:
                print(f"[Data Cleaning] Flagged and separated {len(outliers)} outliers during database seeding.")

            rows = []
            for r in cleaned_records:
                rows.append((
                    r.get("source", "EaseMyTrip"),
                    str(r["origin"]).strip().upper(),
                    str(r["destination"]).strip().upper(),
                    r["travel_date"],
                    int(r["advance_purchase_days"]),
                    float(r["base_fare"]),
                    float(r["taxes_fees"]),
                    float(r["fare_total"]),
                    r["scraped_at"],
                    r.get("status", "SIMULATED_BACKTEST")
                ))

            cursor.executemany("""
            INSERT INTO fares (source, origin, destination, travel_date, advance_purchase_days, base_fare, taxes_fees, fare_total, scraped_at, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, rows)
            print(f"[DB] Seeded {len(rows)} cleaned fare records into {DB_FILE}")

    conn.commit()
    conn.close()


def append_fare_records(records: List[Dict[str, Any]]):
    if not records:
        return

    # Pass through data cleaning pipeline before appending
    cleaned_records, outliers = clean_fare_dataset(records)
    if outliers:
        print(f"[Data Cleaning] Separated {len(outliers)} anomalous/outlier fares before ingestion.")

    if not cleaned_records:
        return

    conn = get_db_connection()
    cursor = conn.cursor()
    rows = []
    for r in cleaned_records:
        rows.append((
            r.get("source", "EaseMyTrip"),
            str(r["origin"]).strip().upper(),
            str(r["destination"]).strip().upper(),
            r["travel_date"],
            int(r.get("advance_purchase_days", 15)),
            float(r["base_fare"]),
            float(r["taxes_fees"]),
            float(r["fare_total"]),
            r["scraped_at"],
            r.get("status", "LIVE_SUCCESS")
        ))
    cursor.executemany("""
    INSERT INTO fares (source, origin, destination, travel_date, advance_purchase_days, base_fare, taxes_fees, fare_total, scraped_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, rows)
    conn.commit()
    conn.close()


def get_all_fares() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM fares ORDER BY scraped_at ASC, id ASC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows


def get_event_tags() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM event_tags ORDER BY date ASC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows


if __name__ == "__main__":
    init_db(force_reseed=True)
    print("Database initialized successfully.")
