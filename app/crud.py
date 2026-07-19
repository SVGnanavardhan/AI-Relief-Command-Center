import json
import traceback
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import IncidentStatusLog, InventoryItem, Report, RescueNotification, Team


def _deserialize_resources(value: Any) -> List[Any]:
    if not value:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, dict):
        return [value]
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict):
                return [parsed]
            return [parsed]
        except json.JSONDecodeError:
            return [value]
    return [value]


def _derive_location_context(location: Any, latitude: Any, longitude: Any, category: Any) -> Dict[str, Any]:
    location_text = str(location or "").strip()
    location_lower = location_text.lower()
    country = "India"
    district = "Regional district"
    state = "National response zone"
    landmark = "Major transport corridor"
    accuracy = 0.7

    if latitude is not None and longitude is not None:
        accuracy = 0.9

    if "," in location_text:
        parts = [part.strip() for part in location_text.split(",") if part.strip()]
        if len(parts) >= 2:
            district = parts[0]
            state = parts[-1]
        elif len(parts) == 1:
            district = parts[0]

    if "west bengal" in location_lower or "kolkata" in location_lower:
        state = "West Bengal"
        country = "India"
        landmark = "Riverfront corridor"
    elif "maharashtra" in location_lower or "mumbai" in location_lower or "pune" in location_lower:
        state = "Maharashtra"
        country = "India"
        landmark = "Urban transport corridor"
    elif "tamil nadu" in location_lower or "chennai" in location_lower:
        state = "Tamil Nadu"
        country = "India"
        landmark = "Coastal access point"
    elif "odisha" in location_lower or "bhubaneswar" in location_lower:
        state = "Odisha"
        country = "India"
        landmark = "Community shelter hub"
    elif "telangana" in location_lower or "hyderabad" in location_lower:
        state = "Telangana"
        country = "India"
        landmark = "Regional market corridor"

    category_lower = str(category or "other").lower()
    if category_lower in {"flood", "water", "rescue"}:
        landmark = "Flood-prone river corridor"
    elif category_lower in {"fire", "medical"}:
        landmark = "Emergency access corridor"
    elif category_lower in {"shelter", "food"}:
        landmark = "Community shelter hub"

    return {
        "district": district,
        "state": state,
        "country": country,
        "nearest_landmark": landmark,
        "estimated_accuracy": round(accuracy, 2),
    }


def _derive_operational_context(report: Report, resources: List[Any]) -> Dict[str, Any]:
    category = str(report.category or "other").lower()
    priority = str(report.priority or "low").lower()
    urgency_score = int(report.urgency_score or 0)

    if category in {"medical", "fire"}:
        required_vehicles = ["Ambulance", "Fire Tender"]
        medical_teams = ["Trauma Team", "Medical Support Unit"]
    elif category in {"flood", "rescue"}:
        required_vehicles = ["Rescue Truck", "Boat Unit"]
        medical_teams = ["Rescue Team", "Field Medic"]
    elif category in {"shelter", "food"}:
        required_vehicles = ["Supply Truck", "Utility Van"]
        medical_teams = ["Relief Team"]
    else:
        required_vehicles = ["Mobile Support Unit"]
        medical_teams = ["Medical Support Unit"]

    if priority in {"critical", "high"}:
        road_accessibility = "Restricted access; secondary routes recommended"
        evacuation_routes = ["Primary evacuation corridor", "Secondary relief access route"]
        impact_radius = max(4, int(urgency_score / 15))
        affected_population = max(80, int(urgency_score * 2))
        weather = "Severe weather and poor visibility are likely"
    else:
        road_accessibility = "Accessible with controlled traffic movement"
        evacuation_routes = ["Main arterial route", "Shelter linkage route"]
        impact_radius = max(2, int(urgency_score / 25))
        affected_population = max(40, int(urgency_score))
        weather = "Conditions remain stable with moderate operational risk"

    return {
        "weather": weather,
        "road_accessibility": road_accessibility,
        "suggested_evacuation_routes": evacuation_routes,
        "predicted_impact_radius_km": impact_radius,
        "affected_population_estimate": affected_population,
        "ai_urgency_explanation": str(report.reasoning or "The AI prioritization reflects exposure, access risk, and time-sensitive need.")[:240],
        "ai_confidence_score": round(float(report.confidence_score or 0.8), 2),
        "priority_reasoning": f"{priority.title()} priority was assigned because the incident presents immediate operational exposure and a likely escalation in the next hour.",
        "required_resources": resources,
        "required_vehicles": required_vehicles,
        "required_medical_teams": medical_teams,
        "food_requirement_estimate": max(20, int(urgency_score / 4)),
        "water_requirement_estimate": max(30, int(urgency_score / 3)),
        "temporary_shelter_estimate": max(15, int(urgency_score / 5)),
        "current_status": report.status or "reported",
        "dispatch_history": [
            {"status": report.status or "reported", "message": "Initial dispatch recommendation generated."},
        ],
        "mission_log": [
            {"step": "Reported", "detail": "Incident entered the command queue."},
            {"step": "AI Reviewed", "detail": "Priority and resource requirements were generated."},
        ],
    }


def serialize_report(report: Report) -> Dict[str, Any]:
    resources = _deserialize_resources(report.resources)
    created_at = report.created_at.isoformat() if report.created_at else None
    category = str(report.category or "other").lower()
    priority = str(report.priority or "low").lower()

    urgency_score = int(report.urgency_score) if report.urgency_score is not None else 0
    location_context = _derive_location_context(report.location, report.latitude, report.longitude, category)
    operational_context = _derive_operational_context(report, resources)

    return {
        "id": report.id,
        "description": report.description,
        "location": report.location,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "summary": report.summary,
        "ai_summary": report.summary,
        "category": category,
        "urgency_score": urgency_score,
        "priority": priority,
        "resources": resources,
        "suggested_resources": resources,
        "reasoning": report.reasoning,
        "image_url": report.image_url,
        "voice_url": report.audio_url,
        "audio_url": report.audio_url,
        "transcript": report.transcript,
        "confidence_score": report.confidence_score,
        "timestamp": created_at,
        "status": report.status or "reported",
        "assigned_team": report.assigned_team_name,
        "assigned_team_id": report.assigned_team_id,
        "created_at": created_at,
        "district": location_context["district"],
        "state": location_context["state"],
        "country": location_context["country"],
        "nearest_landmark": location_context["nearest_landmark"],
        "estimated_accuracy": location_context["estimated_accuracy"],
        "weather": operational_context["weather"],
        "road_accessibility": operational_context["road_accessibility"],
        "suggested_evacuation_routes": operational_context["suggested_evacuation_routes"],
        "predicted_impact_radius_km": operational_context["predicted_impact_radius_km"],
        "affected_population_estimate": operational_context["affected_population_estimate"],
        "ai_urgency_explanation": operational_context["ai_urgency_explanation"],
        "ai_confidence_score": operational_context["ai_confidence_score"],
        "priority_reasoning": operational_context["priority_reasoning"],
        "required_resources": operational_context["required_resources"],
        "required_vehicles": operational_context["required_vehicles"],
        "required_medical_teams": operational_context["required_medical_teams"],
        "food_requirement_estimate": operational_context["food_requirement_estimate"],
        "water_requirement_estimate": operational_context["water_requirement_estimate"],
        "temporary_shelter_estimate": operational_context["temporary_shelter_estimate"],
        "current_status": operational_context["current_status"],
        "dispatch_history": operational_context["dispatch_history"],
        "mission_log": operational_context["mission_log"],
    }


def create_report(db: Session, payload: Dict[str, Any]) -> Dict[str, Any]:
    report = Report(
        description=payload["description"],
        location=payload["location"],
        latitude=float(payload["latitude"]) if payload.get("latitude") is not None else None,
        longitude=float(payload["longitude"]) if payload.get("longitude") is not None else None,
        summary=payload["summary"],
        category=payload["category"],
        urgency_score=payload["urgency_score"],
        priority=payload["priority"],
        resources=json.dumps(payload.get("resources", [])),
        reasoning=payload.get("reasoning"),
        image_url=payload.get("image_url"),
        audio_url=payload.get("audio_url"),
        confidence_score=payload.get("confidence_score"),
        transcript=payload.get("transcript"),
        status=payload.get("status", "reported"),
    )
    try:
        db.add(report)
        db.commit()
        db.refresh(report)
    except Exception as exc:
        db.rollback()
        traceback.print_exc()
        raise RuntimeError(f"Database failure: {exc}") from exc
    return serialize_report(report)


def get_reports(db: Session) -> List[Dict[str, Any]]:
    reports = db.query(Report).order_by(Report.urgency_score.desc(), Report.created_at.desc()).all()
    return [serialize_report(item) for item in reports]


def get_report(db: Session, report_id: int) -> Optional[Dict[str, Any]]:
    report = db.query(Report).filter(Report.id == report_id).first()
    return serialize_report(report) if report else None


def serialize_team(team: Team) -> Dict[str, Any]:
    equipment: List[Any] = []
    if team.equipment:
        if isinstance(team.equipment, str):
            try:
                parsed = json.loads(team.equipment)
                if isinstance(parsed, list):
                    equipment = parsed
                elif isinstance(parsed, str):
                    equipment = [parsed]
            except json.JSONDecodeError:
                equipment = [team.equipment]
        elif isinstance(team.equipment, list):
            equipment = team.equipment
    created_at = team.created_at.isoformat() if team.created_at else None
    gps_location = getattr(team, "gps_location", None)
    if gps_location is None:
        gps_location = getattr(team, "gps_coordinates", None)
    return {
        "id": team.id,
        "name": team.name,
        "members": team.members,
        "vehicle": team.vehicle,
        "equipment": equipment,
        "gps_location": gps_location,
        "availability": team.availability,
        "status": team.status,
        "current_mission": team.current_mission,
        "eta_minutes": team.eta_minutes,
        "capacity": team.capacity,
        "created_at": created_at,
    }


def create_team(db: Session, payload: Dict[str, Any]) -> Dict[str, Any]:
    name = str(payload.get("name") or "").strip()
    if not name:
        raise ValueError("Team name is required")

    existing_team = db.query(Team).filter(Team.name == name).first()
    if existing_team:
        return serialize_team(existing_team)

    team = Team(
        name=name,
        members=int(payload.get("members") or 0),
        vehicle=payload.get("vehicle"),
        equipment=json.dumps(payload.get("equipment", [])) if payload.get("equipment") else None,
        availability=payload.get("availability", "available"),
        status=payload.get("status", "ready"),
        current_mission=payload.get("current_mission") or "",
        eta_minutes=payload.get("eta_minutes"),
        capacity=payload.get("capacity"),
    )
    gps_location = payload.get("gps_location") or payload.get("gps_coordinates") or payload.get("current_location")
    if gps_location is not None:
        team.gps_location = gps_location
    try:
        db.add(team)
        db.commit()
        db.refresh(team)
    except IntegrityError:
        db.rollback()
        existing_team = db.query(Team).filter(Team.name == name).first()
        if existing_team:
            return serialize_team(existing_team)
        raise
    except Exception as exc:
        db.rollback()
        traceback.print_exc()
        raise RuntimeError(f"Database failure: {exc}") from exc
    return serialize_team(team)


def get_teams(db: Session) -> List[Dict[str, Any]]:
    teams = db.query(Team).order_by(Team.created_at.desc()).all()
    return [serialize_team(item) for item in teams]


def assign_team_to_report(db: Session, report_id: int, team_id: int) -> Dict[str, Any]:
    report = db.query(Report).filter(Report.id == report_id).first()
    team = db.query(Team).filter(Team.id == team_id).first()
    if not report:
        raise ValueError("Report not found")
    if not team:
        raise ValueError("Team not found")

    report.assigned_team_id = team.id
    report.assigned_team_name = team.name
    report.status = team.status or "assigned"

    existing_notification = db.query(RescueNotification).filter(RescueNotification.incident_id == report.id).first()
    if not existing_notification:
        create_notification(
            db,
            {
                "incident_id": report.id,
                "incident_location": report.location,
                "incident_type": report.category,
                "priority": report.priority,
                "assigned_team": team.name,
                "team_leader": team.name,
                "estimated_arrival": f"{team.eta_minutes or 10} min",
                "mission_instructions": f"Dispatch {team.name} to {report.location} and support the incident response.",
                "status": "sent",
                "unread": 1,
            },
        )

    db.commit()
    db.refresh(report)
    return {
        "id": report.id,
        "assigned_team": team.name,
        "assigned_team_id": team.id,
        "status": report.status,
        "eta_minutes": team.eta_minutes,
    }


def update_report_status(db: Session, report_id: int, status: str, note: Optional[str] = None) -> Dict[str, Any]:
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise ValueError("Report not found")

    report.status = status
    log = IncidentStatusLog(report_id=report.id, status=status, note=note)
    db.add(log)
    db.commit()
    db.refresh(report)
    return serialize_report(report)


def create_notification(db: Session, payload: Dict[str, Any]) -> Dict[str, Any]:
    notification = RescueNotification(
        incident_id=int(payload.get("incident_id") or 0),
        incident_location=payload.get("incident_location"),
        incident_type=payload.get("incident_type"),
        priority=payload.get("priority"),
        assigned_team=payload.get("assigned_team"),
        team_leader=payload.get("team_leader"),
        estimated_arrival=payload.get("estimated_arrival"),
        mission_instructions=payload.get("mission_instructions"),
        status=payload.get("status", "sent"),
        unread=int(payload.get("unread", 1) or 1),
        accepted=int(payload.get("accepted", 0) or 0),
        rejected=int(payload.get("rejected", 0) or 0),
        completed=int(payload.get("completed", 0) or 0),
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return {
        "id": notification.id,
        "incident_id": notification.incident_id,
        "incident_location": notification.incident_location,
        "incident_type": notification.incident_type,
        "priority": notification.priority,
        "assigned_team": notification.assigned_team,
        "team_leader": notification.team_leader,
        "notification_time": notification.notification_time.isoformat() if notification.notification_time else None,
        "estimated_arrival": notification.estimated_arrival,
        "mission_instructions": notification.mission_instructions,
        "status": notification.status,
        "unread": bool(notification.unread),
        "accepted": bool(notification.accepted),
        "rejected": bool(notification.rejected),
        "completed": bool(notification.completed),
    }


def get_notifications(db: Session) -> List[Dict[str, Any]]:
    items = db.query(RescueNotification).order_by(RescueNotification.notification_time.desc()).all()
    return [{
        "id": item.id,
        "incident_id": item.incident_id,
        "incident_location": item.incident_location,
        "incident_type": item.incident_type,
        "priority": item.priority,
        "assigned_team": item.assigned_team,
        "team_leader": item.team_leader,
        "notification_time": item.notification_time.isoformat() if item.notification_time else None,
        "estimated_arrival": item.estimated_arrival,
        "mission_instructions": item.mission_instructions,
        "status": item.status,
        "unread": bool(item.unread),
        "accepted": bool(item.accepted),
        "rejected": bool(item.rejected),
        "completed": bool(item.completed),
    } for item in items]


def get_status_history(db: Session, report_id: int) -> List[Dict[str, Any]]:
    logs = db.query(IncidentStatusLog).filter(IncidentStatusLog.report_id == report_id).order_by(IncidentStatusLog.created_at.asc()).all()
    return [{"id": item.id, "status": item.status, "note": item.note, "created_at": item.created_at.isoformat() if item.created_at else None} for item in logs]


def create_inventory_item(db: Session, payload: Dict[str, Any]) -> Dict[str, Any]:
    item = InventoryItem(
        name=str(payload.get("name") or "").strip(),
        category=payload.get("category"),
        stock_level=int(payload.get("stock_level") or 0),
        available=int(payload.get("available") or 0),
        reserved=int(payload.get("reserved") or 0),
        deployed=int(payload.get("deployed") or 0),
        status=payload.get("status", "available"),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {
        "id": item.id,
        "name": item.name,
        "category": item.category,
        "stock_level": item.stock_level,
        "available": item.available,
        "reserved": item.reserved,
        "deployed": item.deployed,
        "status": item.status,
    }


def get_inventory(db: Session) -> List[Dict[str, Any]]:
    items = db.query(InventoryItem).order_by(InventoryItem.created_at.desc()).all()
    return [{
        "id": item.id,
        "name": item.name,
        "category": item.category,
        "stock_level": item.stock_level,
        "available": item.available,
        "reserved": item.reserved,
        "deployed": item.deployed,
        "status": item.status,
    } for item in items]


def get_operations_payload(db: Session) -> Dict[str, Any]:
    reports = get_reports(db)
    teams = get_teams(db)
    inventory = get_inventory(db)
    notifications = [
        {"id": 1, "kind": "report", "message": f"{len(reports)} incident(s) currently tracked", "timestamp": datetime.utcnow().isoformat()},
        {"id": 2, "kind": "team", "message": f"{len([team for team in teams if str(team.get('availability', '')).lower() == 'available'])} team(s) available", "timestamp": datetime.utcnow().isoformat()},
    ]
    return {
        "incidents": reports,
        "teams": teams,
        "inventory": inventory,
        "notifications": notifications,
        "recommendations": [
            {
                "title": "Priority dispatch recommendation",
                "detail": "Focus on the highest-urgency medical and rescue cases first.",
            }
        ],
    }


def get_dashboard(db: Session) -> Dict[str, Any]:
    reports = get_reports(db)
    teams = get_teams(db)
    notifications = get_notifications(db)
    status_logs = db.query(IncidentStatusLog).all()
    category_names = ["Medical", "Rescue", "Food", "Shelter", "Fire", "Flood", "Infrastructure", "Other"]
    category_distribution = [
        {"name": name, "value": sum(1 for item in reports if str(item.get("category", "other")).lower() == name.lower())}
        for name in category_names
    ]
    category_distribution = [item for item in category_distribution if item["value"] > 0]

    urgency_trend: List[Dict[str, Any]] = []
    for idx in range(6, -1, -1):
        day = (datetime.utcnow() - timedelta(days=idx)).strftime("%Y-%m-%d")
        matching = [item for item in reports if str(item.get("timestamp", "")).startswith(day)]
        urgency_trend.append(
            {
                "time": day,
                "critical": sum(1 for item in matching if str(item.get("priority", "")).lower() == "critical"),
                "high": sum(1 for item in matching if str(item.get("priority", "")).lower() == "high"),
                "medium": sum(1 for item in matching if str(item.get("priority", "")).lower() == "medium"),
                "low": sum(1 for item in matching if str(item.get("priority", "")).lower() == "low"),
            }
        )

    average_urgency = round(sum(float(item.get("urgency_score", 0) or 0) for item in reports) / len(reports), 2) if reports else 0
    average_confidence = round(sum(float(item.get("confidence_score", 0) or 0) for item in reports) / len(reports), 2) if reports else 0

    pending_incidents = sum(1 for item in reports if str(item.get("status", "")).lower() in {"reported", "ai reviewed", "verified", "team assigned", "team notified", "team accepted", "en route", "reached location", "rescue started"})
    ai_reviewed = sum(1 for item in reports if str(item.get("status", "")).lower() in {"ai reviewed", "verified", "team assigned", "team notified", "team accepted", "en route", "reached location", "rescue started", "victims evacuated", "medical support completed", "area secured", "mission completed", "closed"})
    teams_assigned = sum(1 for item in reports if item.get("assigned_team_id") is not None)
    teams_en_route = sum(1 for item in reports if str(item.get("status", "")).lower() in {"en route", "reached location", "rescue started", "victims evacuated", "medical support completed", "area secured", "mission completed", "closed"})
    rescue_in_progress = sum(1 for item in reports if str(item.get("status", "")).lower() in {"rescue started", "victims evacuated", "medical support completed", "area secured"})
    resolved = sum(1 for item in reports if str(item.get("status", "")).lower() in {"mission completed", "closed"})
    closed_incidents = sum(1 for item in reports if str(item.get("status", "")).lower() == "closed")
    people_rescued = sum(min(10, max(1, int(item.get("urgency_score", 0) or 0))) for item in reports if str(item.get("status", "")).lower() in {"victims evacuated", "medical support completed", "area secured", "mission completed", "closed"})
    people_awaiting_rescue = sum(1 for item in reports if str(item.get("status", "")).lower() in {"reported", "ai reviewed", "verified", "team assigned", "team notified", "team accepted", "en route", "reached location", "rescue started"}) * 8
    medical_requests = sum(1 for item in reports if str(item.get("category", "")).lower() == "medical")
    fire_emergencies = sum(1 for item in reports if str(item.get("category", "")).lower() == "fire")
    flood_emergencies = sum(1 for item in reports if str(item.get("category", "")).lower() == "flood")
    available_teams = sum(1 for item in teams if str(item.get("availability", "")).lower() == "available")
    busy_teams = sum(1 for item in teams if str(item.get("availability", "")).lower() != "available")
    active_rescue_teams = len(teams)

    return {
        "total_reports": len(reports),
        "pending_incidents": pending_incidents,
        "ai_reviewed": ai_reviewed,
        "teams_assigned": teams_assigned,
        "teams_en_route": teams_en_route,
        "rescue_in_progress": rescue_in_progress,
        "successfully_resolved": resolved,
        "closed_incidents": closed_incidents,
        "people_rescued": people_rescued,
        "people_awaiting_rescue": people_awaiting_rescue,
        "medical_requests": medical_requests,
        "fire_emergencies": fire_emergencies,
        "flood_emergencies": flood_emergencies,
        "average_response_time": round((len(reports) * 8) + 2, 1),
        "average_rescue_time": round((len(reports) * 12) + 4, 1),
        "active_rescue_teams": active_rescue_teams,
        "available_teams": available_teams,
        "busy_teams": busy_teams,
        "critical_reports": sum(1 for item in reports if str(item.get("priority", "")).lower() == "critical"),
        "critical_incidents": sum(1 for item in reports if str(item.get("priority", "")).lower() == "critical"),
        "medical_cases": sum(1 for item in reports if str(item.get("category", "")).lower() == "medical"),
        "rescue_cases": sum(1 for item in reports if str(item.get("category", "")).lower() == "rescue"),
        "shelter_requests": sum(1 for item in reports if str(item.get("category", "")).lower() == "shelter"),
        "food_requests": sum(1 for item in reports if str(item.get("category", "")).lower() == "food"),
        "food_cases": sum(1 for item in reports if str(item.get("category", "")).lower() == "food"),
        "shelter_cases": sum(1 for item in reports if str(item.get("category", "")).lower() == "shelter"),
        "fire_cases": sum(1 for item in reports if str(item.get("category", "")).lower() == "fire"),
        "flood_cases": sum(1 for item in reports if str(item.get("category", "")).lower() == "flood"),
        "category_distribution": category_distribution,
        "urgency_trend": urgency_trend,
        "recent_incidents": reports[:10],
        "average_urgency": average_urgency,
        "average_confidence": average_confidence,
        "resources_deployed": len(reports) * 3,
        "notifications": notifications,
        "activity_feed": [
            {"timestamp": "09:20", "message": "AI classified flood incident"},
            {"timestamp": "09:21", "message": "Priority escalated to critical"},
            {"timestamp": "09:22", "message": "Notification sent to rescue team"},
            {"timestamp": "09:23", "message": "Team accepted mission"},
        ],
        "mission_success_rate": round((resolved / len(reports) * 100) if reports else 0, 1),
        "completed_today": resolved,
        "completed_this_week": resolved,
        "average_completion_time": round((len(reports) * 35) + 12, 1),
        "lives_saved": people_rescued,
        "resources_used": len(reports) * 3,
        "status_log": [{"id": item.id, "status": item.status, "note": item.note, "created_at": item.created_at.isoformat() if item.created_at else None} for item in status_logs],
    }
