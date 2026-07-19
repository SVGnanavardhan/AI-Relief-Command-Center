import os
import sys
from datetime import datetime

from sqlalchemy import create_engine, inspect, text

from app.database import init_db

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is required for PostgreSQL")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
init_db()
inspector = inspect(engine)


def check(condition: bool, message: str) -> None:
    print(f"{'PASS' if condition else 'FAIL'}: {message}")


try:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        check(True, "Database connection")
except Exception as exc:
    check(False, f"Database connection ({exc})")
    sys.exit(1)

required_tables = [
    "users",
    "reports",
    "teams",
    "notifications",
    "incident_history",
    "mission_history",
    "inventory",
    "simulation_events",
    "activity_feed",
    "dispatch_history",
    "resources",
    "roles",
]

existing_tables = set(inspector.get_table_names())
for table in required_tables:
    check(table in existing_tables, f"Table exists: {table}")

if hasattr(engine, "pool"):
    check(True, "Connection pool available")

print("Database verification complete")
