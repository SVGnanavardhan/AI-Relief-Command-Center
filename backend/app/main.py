import asyncio
import traceback
from collections.abc import Generator
from contextlib import asynccontextmanager
from typing import Any, Dict, List, cast

from fastapi import Depends, FastAPI, HTTPException, Request, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from starlette.datastructures import UploadFile as StarletteUploadFile

from app.auth import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_user_by_email,
    hash_password,
)
from app.config import get_settings
from app.crud import (
    assign_team_to_report,
    create_inventory_item,
    create_notification,
    create_report as save_report,
    create_team,
    get_dashboard,
    get_notifications,
    get_operations_payload,
    get_report,
    get_reports,
    get_status_history,
    get_teams,
    update_report_status,
)
from app.database import SessionLocal, User, init_db
from app.schemas import ReportOut
from app.schemas_dashboard import DashboardResponse
from app.services.geocoder import GeocodeError, geocode_location
from app.services.gemini import analyze_report
from app.services.simulation import simulation_manager
from app.services.storage import UPLOAD_ROOT, save_upload


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    seed_demo_reports()
    yield


init_db()
app = FastAPI(title="AI Relief Command Center", version="1.0.0", lifespan=lifespan)
security = HTTPBearer(auto_error=False)
settings: dict[str, Any] = get_settings()
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_ROOT)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings["cors_origins"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def seed_demo_reports() -> None:
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        report_count = db.query(type("Report", (), {"id": 0})).count()
    except Exception:
        report_count = 0

    if report_count > 0:
        return

    demo_records: list[dict[str, Any]] = [
        {
            "description": "Severe flash flooding has trapped residents near the river embankment and blocked access roads.",
            "location": "Kolkata, West Bengal",
            "latitude": 22.5726,
            "longitude": 88.3639,
            "summary": "Flood response teams are needed to evacuate residents and secure critical routes.",
            "category": "flood",
            "urgency_score": 0.95,
            "priority": "critical",
            "resources": ["Rescue Boats", "Medical Team", "Shelter Kits"],
            "reasoning": "The incident describes trapped residents and blocked transport corridors, which requires immediate evacuation support.",
            "confidence_score": 0.93,
            "image_url": None,
            "audio_url": None,
            "transcript": None,
            "status": "reported",
        },
        {
            "description": "A warehouse fire is spreading toward nearby homes and several families need evacuation support.",
            "location": "Mumbai, Maharashtra",
            "latitude": 19.0760,
            "longitude": 72.8777,
            "summary": "Fire suppression and evacuation coordination are needed immediately.",
            "category": "fire",
            "urgency_score": 0.91,
            "priority": "critical",
            "resources": ["Fire Truck", "Police Unit", "Medical Team"],
            "reasoning": "The report indicates active fire spread and a risk to nearby residential areas.",
            "confidence_score": 0.9,
            "image_url": None,
            "audio_url": None,
            "transcript": None,
            "status": "reported",
        },
        {
            "description": "Multiple patients are waiting for triage after a building collapse and several are in respiratory distress.",
            "location": "Chennai, Tamil Nadu",
            "latitude": 13.0827,
            "longitude": 80.2707,
            "summary": "Medical triage and transportation support are urgently required.",
            "category": "medical",
            "urgency_score": 0.88,
            "priority": "high",
            "resources": ["Ambulances", "Trauma Team", "Blood Supplies"],
            "reasoning": "The report highlights severe injuries and time-sensitive medical needs.",
            "confidence_score": 0.89,
            "image_url": None,
            "audio_url": None,
            "transcript": None,
            "status": "reported",
        },
        {
            "description": "Road collapse has isolated a neighborhood and disrupted access for food and medicine deliveries.",
            "location": "Bengaluru, Karnataka",
            "latitude": 12.9716,
            "longitude": 77.5946,
            "summary": "Infrastructure support is required to restore access and ensure supply deliveries.",
            "category": "road",
            "urgency_score": 0.72,
            "priority": "high",
            "resources": ["Engineers", "Police Unit", "Supply Trucks"],
            "reasoning": "The incident disrupts critical transport and will impact relief delivery to affected residents.",
            "confidence_score": 0.82,
            "image_url": None,
            "audio_url": None,
            "transcript": None,
            "status": "reported",
        },
    ]

    for record in demo_records:
        save_report(db, record)

    db.commit()
    db.close()


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    raise HTTPException(status_code=422, detail=exc.errors()) from exc


@app.exception_handler(GeocodeError)
async def geocode_exception_handler(request: Request, exc: GeocodeError):
    raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    raise HTTPException(status_code=500, detail="Internal server error") from exc


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/api/report", response_model=ReportOut)
async def create_report(request: Request, db: Session = Depends(get_db)) -> Dict[str, Any]:
    content_type = request.headers.get("content-type", "")

    if content_type.startswith("multipart/form-data"):
        form = await request.form()
        description = str(form.get("description") or "").strip()
        location = str(form.get("location") or "").strip()
        image = form.get("image")
        audio = form.get("audio")
    else:
        try:
            payload_data = await request.json()
        except Exception:
            payload_data = {}

        if not isinstance(payload_data, dict):
            raise HTTPException(status_code=400, detail="Invalid request body")

        payload_data = cast(dict[str, Any], payload_data)
        description = str(payload_data.get("description", "") or "").strip()
        location = str(payload_data.get("location", "") or "").strip()
        image = payload_data.get("image")
        audio = payload_data.get("audio")

    if not description:
        raise HTTPException(status_code=400, detail="Missing description")

    print("Received report")

    try:
        print("Geocoding...")
        latitude, longitude = await asyncio.to_thread(geocode_location, location)
    except GeocodeError as exc:
        traceback.print_exc()
        latitude, longitude = None, None

    print("Gemini analysis...")
    analysis = await asyncio.to_thread(analyze_report, description)

    record: dict[str, Any] = {
        "description": description,
        "location": location,
        "latitude": latitude,
        "longitude": longitude,
        "summary": analysis["summary"],
        "category": analysis["category"],
        "urgency_score": analysis["urgency_score"],
        "priority": analysis["priority"],
        "resources": analysis["resources"],
        "reasoning": analysis["reasoning"],
        "confidence_score": analysis.get("confidence_score", 0.8),
        "image_url": None,
        "audio_url": None,
        "transcript": None,
        "status": "reported",
    }

    if isinstance(image, (UploadFile, StarletteUploadFile)):
        try:
            record["image_url"] = save_upload(image, "image")
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
    elif isinstance(image, str) and image:
        record["image_url"] = image

    if isinstance(audio, (UploadFile, StarletteUploadFile)):
        try:
            record["audio_url"] = save_upload(audio, "audio")
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
    elif isinstance(audio, str) and audio:
        record["audio_url"] = audio

    try:
        print("Saving to database...")
        response = await asyncio.to_thread(save_report, db, record)
    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database failure: {exc}") from exc

    print("Returning response...")
    return response


@app.post("/api/teams")
async def create_team_route(payload: Dict[str, Any], db: Session = Depends(get_db)) -> Dict[str, Any]:
    team_name = str(payload.get("name") or "").strip()
    if not team_name:
        raise HTTPException(status_code=400, detail="Missing team name")
    try:
        return await asyncio.to_thread(create_team, db, payload)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/teams")
async def list_teams(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    return await asyncio.to_thread(get_teams, db)


@app.post("/api/reports/{report_id}/assign-team/{team_id}")
async def assign_team_route(report_id: int, team_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    try:
        result = await asyncio.to_thread(assign_team_to_report, db, report_id, team_id)
        team = db.query(type("Team", (), {"name": ""})).first() if False else None
        return result
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/api/notifications")
async def notifications(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    return await asyncio.to_thread(get_notifications, db)


@app.post("/api/notifications")
async def create_notification_route(payload: Dict[str, Any], db: Session = Depends(get_db)) -> Dict[str, Any]:
    return await asyncio.to_thread(create_notification, db, payload)


@app.post("/api/reports/{report_id}/status")
async def update_status(report_id: int, payload: Dict[str, Any], db: Session = Depends(get_db)) -> Dict[str, Any]:
    status_name = str(payload.get("status") or "").strip()
    if not status_name:
        raise HTTPException(status_code=400, detail="Missing status")
    try:
        return await asyncio.to_thread(update_report_status, db, report_id, status_name, payload.get("note"))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/api/reports/{report_id}/history")
async def report_history(report_id: int, db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    return await asyncio.to_thread(get_status_history, db, report_id)


@app.post("/api/inventory")
async def inventory_item(payload: Dict[str, Any], db: Session = Depends(get_db)) -> Dict[str, Any]:
    return await asyncio.to_thread(create_inventory_item, db, payload)


@app.get("/api/operations")
async def operations(db: Session = Depends(get_db)) -> Dict[str, Any]:
    return await asyncio.to_thread(get_operations_payload, db)


@app.post("/api/auth/register")
async def register_user(payload: Dict[str, Any], db: Session = Depends(get_db)) -> Dict[str, Any]:
    email = str(payload.get("email") or "").strip().lower()
    if not email or not payload.get("password"):
        raise HTTPException(status_code=400, detail="Email and password are required")
    if get_user_by_email(db, email):
        raise HTTPException(status_code=409, detail="User already exists")

    user = User(
        name=str(payload.get("name") or "User").strip(),
        email=email,
        password_hash=hash_password(str(payload.get("password"))),
        phone=payload.get("phone"),
        role=str(payload.get("role") or "citizen").strip().lower(),
        is_active=1,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "access_token": create_access_token(user.email, user.role),
        "refresh_token": create_refresh_token(user.email, user.role),
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "avatar": user.avatar,
        },
    }


@app.post("/api/auth/login")
async def login_user(payload: Dict[str, Any], db: Session = Depends(get_db)) -> Dict[str, Any]:
    email = str(payload.get("email") or "").strip().lower()
    password = str(payload.get("password") or "")
    user = authenticate_user(db, email, password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "access_token": create_access_token(user.email, user.role),
        "refresh_token": create_refresh_token(user.email, user.role),
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "avatar": user.avatar,
        },
        "remember_me": bool(payload.get("remember_me", False)),
    }


@app.get("/api/auth/me")
async def get_profile(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing token")
    user = get_current_user(db, credentials.credentials)
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "avatar": user.avatar,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@app.post("/api/auth/logout")
async def logout_user() -> Dict[str, str]:
    return {"message": "Logged out successfully"}


@app.post("/api/auth/refresh")
async def refresh_token(payload: Dict[str, Any], db: Session = Depends(get_db)) -> Dict[str, Any]:
    refresh_token_value = str(payload.get("refresh_token") or "").strip()
    if not refresh_token_value:
        raise HTTPException(status_code=401, detail="Missing refresh token")
    try:
        decoded = jwt.decode(refresh_token_value, JWT_SECRET, algorithms=["HS256"])
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid refresh token") from exc
    email = decoded.get("sub")
    user = get_user_by_email(db, email)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    return {
        "access_token": create_access_token(user.email, user.role),
        "refresh_token": create_refresh_token(user.email, user.role),
    }


@app.get("/api/reports", response_model=List[ReportOut])
async def list_reports(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    return await asyncio.to_thread(get_reports, db)


@app.get("/api/reports/{report_id}", response_model=ReportOut)
async def read_report(report_id: int, db: Session = Depends(get_db)) -> Dict[str, Any]:
    report = await asyncio.to_thread(get_report, db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/api/simulation/run")
async def run_simulation(payload: Dict[str, Any] | None = None) -> Dict[str, Any]:
    count = (payload or {}).get("count", 25)
    return simulation_manager.start(count=count)


@app.get("/api/simulation/status")
async def simulation_status() -> Dict[str, Any]:
    return simulation_manager.status()


@app.get("/api/dashboard", response_model=DashboardResponse)
async def dashboard(db: Session = Depends(get_db)) -> Dict[str, Any]:
    return await asyncio.to_thread(get_dashboard, db)
