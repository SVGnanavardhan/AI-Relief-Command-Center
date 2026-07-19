import io

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.main import geocode_location
from app.schemas import ReportCreate
from app.services.geocoder import GeocodeError


@pytest.fixture
def client():
    return TestClient(app)


def test_report_submission_continues_when_geocoding_fails(monkeypatch, client):
    def fake_geocode(_location: str):
        raise GeocodeError("Geocoding unavailable")

    def fake_analyze(_description: str):
        return {
            "summary": "Fallback summary",
            "category": "medical",
            "urgency_score": 4,
            "priority": "high",
            "resources": ["medical team"],
            "reasoning": "Fallback reasoning",
            "confidence_score": 0.82,
        }

    def fake_save_report(_db, payload):
        return {
            "id": 42,
            "description": payload["description"],
            "location": payload["location"],
            "summary": payload["summary"],
            "category": payload["category"],
            "urgency_score": payload["urgency_score"],
            "priority": payload["priority"],
            "resources": payload["resources"],
            "reasoning": payload["reasoning"],
            "image_url": payload.get("image_url"),
            "audio_url": payload.get("audio_url"),
            "timestamp": "2026-01-01T00:00:00",
            "status": payload.get("status", "reported"),
        }

    monkeypatch.setattr("app.main.geocode_location", fake_geocode)
    monkeypatch.setattr("app.main.analyze_report", fake_analyze)
    monkeypatch.setattr("app.main.save_report", fake_save_report)

    response = client.post(
        "/api/report",
        json={"description": "A medical incident needs attention", "location": "Chennai"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["description"] == "A medical incident needs attention"
    assert data["status"] == "reported"
    assert data["summary"] == "Fallback summary"


def test_dashboard_handles_null_confidence_values(monkeypatch, client):
    def fake_get_reports(_db):
        return [
            {
                "id": 1,
                "description": "Medical case",
                "location": "Chennai",
                "latitude": 13.0827,
                "longitude": 80.2707,
                "summary": "Fallback summary",
                "ai_summary": "Fallback summary",
                "category": "medical",
                "urgency_score": 4,
                "priority": "high",
                "resources": [],
                "suggested_resources": [],
                "reasoning": "Fallback reasoning",
                "image_url": None,
                "voice_url": None,
                "audio_url": None,
                "transcript": None,
                "confidence_score": None,
                "timestamp": "2026-01-01T00:00:00",
                "status": "reported",
                "created_at": "2026-01-01T00:00:00",
            }
        ]

    monkeypatch.setattr("app.crud.get_reports", fake_get_reports)

    response = client.get("/api/dashboard")

    assert response.status_code == 200
    data = response.json()
    assert data["total_reports"] == 1
    assert data["medical_cases"] == 1


def test_health_endpoint_returns_ok(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_report_submission_with_uploads_returns_public_urls(monkeypatch, client):
    monkeypatch.setattr("app.main.geocode_location", lambda _location: (13.0827, 80.2707))
    monkeypatch.setattr(
        "app.main.analyze_report",
        lambda _description: {
            "summary": "Upload summary",
            "category": "medical",
            "urgency_score": 4,
            "priority": "high",
            "resources": ["medical team"],
            "reasoning": "Upload reasoning",
            "confidence_score": 0.99,
        },
    )

    response = client.post(
        "/api/report",
        data={"description": "Upload test report", "location": "Chennai"},
        files={
            "image": ("incident.png", io.BytesIO(b"fake-image"), "image/png"),
            "audio": ("incident.wav", io.BytesIO(b"fake-audio"), "audio/wav"),
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["image_url"].startswith("/uploads/image/")
    assert data["audio_url"].startswith("/uploads/audio/")


def test_team_creation_and_assignment(monkeypatch, client):
    monkeypatch.setattr("app.main.geocode_location", lambda _location: (13.0827, 80.2707))
    monkeypatch.setattr(
        "app.main.analyze_report",
        lambda _description: {
            "summary": "Team assignment summary",
            "category": "medical",
            "urgency_score": 4,
            "priority": "high",
            "resources": ["medical team"],
            "reasoning": "Dispatch reasoning",
            "confidence_score": 0.95,
        },
    )

    team_response = client.post(
        "/api/teams",
        json={
            "name": "Rapid Response 12",
            "members": 6,
            "vehicle": "Ambulance",
            "equipment": ["Triage Kit", "Oxygen"],
            "gps_location": "Chennai",
            "availability": "available",
            "status": "ready",
            "current_mission": "",
            "eta_minutes": 12,
            "capacity": 8,
        },
    )
    assert team_response.status_code == 200
    team_data = team_response.json()

    report_response = client.post(
        "/api/report",
        json={"description": "Medical incident needs urgent support", "location": "Chennai"},
    )
    assert report_response.status_code == 200
    report_data = report_response.json()

    assignment_response = client.post(f"/api/reports/{report_data['id']}/assign-team/{team_data['id']}")
    assert assignment_response.status_code == 200
    assert assignment_response.json()["assigned_team"] == team_data["name"]


def test_team_assignment_creates_notification_and_dashboard_metrics(monkeypatch, client):
    monkeypatch.setattr("app.main.geocode_location", lambda _location: (13.0827, 80.2707))
    monkeypatch.setattr(
        "app.main.analyze_report",
        lambda _description: {
            "summary": "Notification workflow summary",
            "category": "flood",
            "urgency_score": 4,
            "priority": "critical",
            "resources": ["rescue boat"],
            "reasoning": "Notification reasoning",
            "confidence_score": 0.96,
        },
    )

    team_response = client.post(
        "/api/teams",
        json={
            "name": "NDRF Team Alpha",
            "members": 8,
            "vehicle": "Rescue Truck",
            "equipment": ["Boat", "Medical Kit"],
            "gps_location": "Guntur",
            "availability": "available",
            "status": "ready",
            "current_mission": "",
            "eta_minutes": 10,
            "capacity": 12,
        },
    )
    assert team_response.status_code == 200
    team_id = team_response.json()["id"]

    report_response = client.post(
        "/api/report",
        json={"description": "Flooding is trapping residents near the embankment", "location": "Guntur"},
    )
    assert report_response.status_code == 200
    report_id = report_response.json()["id"]

    assignment_response = client.post(f"/api/reports/{report_id}/assign-team/{team_id}")
    assert assignment_response.status_code == 200

    notifications_response = client.get("/api/notifications")
    assert notifications_response.status_code == 200
    notifications = notifications_response.json()
    assert notifications
    assert any(item["incident_id"] == report_id for item in notifications)

    dashboard_response = client.get("/api/dashboard")
    assert dashboard_response.status_code == 200
    dashboard_data = dashboard_response.json()
    assert dashboard_data["teams_assigned"] >= 1
    assert dashboard_data["available_teams"] >= 1


def test_status_updates_create_history_and_operations_payload(monkeypatch, client):
    monkeypatch.setattr("app.main.geocode_location", lambda _location: (13.0827, 80.2707))
    monkeypatch.setattr(
        "app.main.analyze_report",
        lambda _description: {
            "summary": "Lifecycle summary",
            "category": "medical",
            "urgency_score": 4,
            "priority": "high",
            "resources": ["medical team"],
            "reasoning": "Lifecycle reasoning",
            "confidence_score": 0.95,
        },
    )

    report_response = client.post(
        "/api/report",
        json={"description": "Status lifecycle incident", "location": "Delhi"},
    )
    assert report_response.status_code == 200
    report_id = report_response.json()["id"]

    status_response = client.post(
        f"/api/reports/{report_id}/status",
        json={"status": "verified", "note": "Field validation complete"},
    )
    assert status_response.status_code == 200
    assert status_response.json()["status"] == "verified"

    operations_response = client.get("/api/operations")
    assert operations_response.status_code == 200
    data = operations_response.json()
    assert data["incidents"]
    assert data["notifications"]
