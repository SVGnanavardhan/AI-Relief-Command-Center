import os
from datetime import datetime, timezone
from typing import Generator

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    Index,
    Integer,
    String,
    Text,
    create_engine,
    inspect,
    text,
)
from sqlalchemy.orm import Session, declarative_base, sessionmaker

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(50), nullable=False, default="citizen")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    last_login = Column(DateTime, nullable=True)
    is_active = Column(Integer, nullable=False, default=1)
    avatar = Column(String(500), nullable=True)


class Report(Base):
    __tablename__ = "reports"
    __table_args__ = (
        Index("ix_reports_created_at", "created_at"),
        Index("ix_reports_urgency_score", "urgency_score"),
    )

    id = Column(Integer, primary_key=True, index=True)
    description = Column(Text, nullable=False)
    location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    summary = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    urgency_score = Column(Integer, nullable=False, default=0)
    priority = Column(String(50), nullable=False)
    resources = Column(Text, nullable=True)
    reasoning = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    audio_url = Column(String(500), nullable=True)
    confidence_score = Column(Float, nullable=True)
    transcript = Column(Text, nullable=True)
    status = Column(String(100), nullable=True)
    assigned_team_id = Column(Integer, nullable=True)
    assigned_team_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    team_type = Column(String(100), nullable=True)
    vehicle = Column(String(255), nullable=True)
    current_location = Column(String(255), nullable=True)
    gps_coordinates = Column(String(255), nullable=True)
    members = Column(Integer, nullable=False, default=0)
    status = Column(String(100), nullable=True)
    availability = Column(String(100), nullable=True)
    eta_minutes = Column(Integer, nullable=True)
    capacity = Column(Integer, nullable=True)
    specialization = Column(String(255), nullable=True)
    equipment = Column(Text, nullable=True)
    current_mission = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    @property
    def gps_location(self):
        return self.gps_coordinates

    @gps_location.setter
    def gps_location(self, value):
        self.gps_coordinates = value


class IncidentStatusLog(Base):
    __tablename__ = "incident_status_logs"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, nullable=False, index=True)
    status = Column(String(100), nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)


class RescueNotification(Base):
    __tablename__ = "rescue_notifications"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, nullable=False, index=True)
    incident_location = Column(String(255), nullable=True)
    incident_type = Column(String(100), nullable=True)
    priority = Column(String(50), nullable=True)
    assigned_team = Column(String(255), nullable=True)
    team_leader = Column(String(255), nullable=True)
    notification_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    estimated_arrival = Column(String(100), nullable=True)
    mission_instructions = Column(Text, nullable=True)
    status = Column(String(100), nullable=True, default="sent")
    unread = Column(Integer, nullable=False, default=1)
    accepted = Column(Integer, nullable=False, default=0)
    rejected = Column(Integer, nullable=False, default=0)
    completed = Column(Integer, nullable=False, default=0)


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    category = Column(String(100), nullable=True)
    stock_level = Column(Integer, nullable=False, default=0)
    available = Column(Integer, nullable=False, default=0)
    reserved = Column(Integer, nullable=False, default=0)
    deployed = Column(Integer, nullable=False, default=0)
    status = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, nullable=True)
    message = Column(Text, nullable=True)
    priority = Column(String(50), nullable=True)
    status = Column(String(50), nullable=True, default="sent")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class IncidentHistory(Base):
    __tablename__ = "incident_history"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, nullable=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class MissionHistory(Base):
    __tablename__ = "mission_history"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, nullable=False)
    mission_name = Column(String(255), nullable=True)
    status = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class SimulationEvent(Base):
    __tablename__ = "simulation_events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ActivityFeed(Base):
    __tablename__ = "activity_feed"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class DispatchHistory(Base):
    __tablename__ = "dispatch_history"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, nullable=False)
    team_name = Column(String(255), nullable=True)
    status = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_URL")

if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./ai_relief.db"

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql+psycopg2://",
        1,
    )
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        inspector = inspect(conn)
        existing_columns = {col["name"] for col in inspector.get_columns("reports")}
        if "image_url" not in existing_columns:
            conn.execute(text("ALTER TABLE reports ADD COLUMN image_url VARCHAR(500)"))
        if "audio_url" not in existing_columns:
            conn.execute(text("ALTER TABLE reports ADD COLUMN audio_url VARCHAR(500)"))
        if "confidence_score" not in existing_columns:
            conn.execute(text("ALTER TABLE reports ADD COLUMN confidence_score FLOAT"))
        if "transcript" not in existing_columns:
            conn.execute(text("ALTER TABLE reports ADD COLUMN transcript TEXT"))
        if "status" not in existing_columns:
            conn.execute(text("ALTER TABLE reports ADD COLUMN status VARCHAR(100)"))
        if "assigned_team_id" not in existing_columns:
            conn.execute(text("ALTER TABLE reports ADD COLUMN assigned_team_id INTEGER"))
        if "assigned_team_name" not in existing_columns:
            conn.execute(text("ALTER TABLE reports ADD COLUMN assigned_team_name VARCHAR(255)"))

        if "teams" not in inspector.get_table_names():
            Base.metadata.create_all(bind=engine)

        team_columns = {col["name"] for col in inspector.get_columns("teams")} if "teams" in inspector.get_table_names() else set()
        for column_name in ["team_type", "current_location", "gps_coordinates", "availability", "eta_minutes", "capacity", "specialization"]:
            if column_name not in team_columns:
                conn.execute(text(f"ALTER TABLE teams ADD COLUMN {column_name} VARCHAR(255)"))
        if "members" not in team_columns:
            conn.execute(text("ALTER TABLE teams ADD COLUMN members INTEGER DEFAULT 0"))
        if "status" not in team_columns:
            conn.execute(text("ALTER TABLE teams ADD COLUMN status VARCHAR(100)"))
        if "current_mission" not in team_columns:
            conn.execute(text("ALTER TABLE teams ADD COLUMN current_mission VARCHAR(255)"))

        if "incident_status_logs" not in inspector.get_table_names():
            Base.metadata.create_all(bind=engine)
        if "inventory_items" not in inspector.get_table_names():
            Base.metadata.create_all(bind=engine)

        if "rescue_notifications" not in inspector.get_table_names():
            Base.metadata.create_all(bind=engine)

        if "users" not in inspector.get_table_names():
            Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
