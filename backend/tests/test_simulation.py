import os
import time

import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = pytest.mark.skipif(not os.getenv("DATABASE_URL"), reason="DATABASE_URL must be set for PostgreSQL tests")


def test_simulation_run_and_status(monkeypatch):
    client = TestClient(app)

    monkeypatch.setattr(
        "app.main.analyze_report",
        lambda _description: {
            "summary": "Simulated summary",
            "category": "medical",
            "urgency_score": 4,
            "priority": "high",
            "resources": ["medical team"],
            "reasoning": "Simulated reasoning",
            "confidence_score": 0.95,
        },
    )

    response = client.post("/api/simulation/run", json={"count": 3})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in {"started", "completed"}

    for _ in range(50):
        status_response = client.get("/api/simulation/status")
        if status_response.json()["status"] == "completed":
            break
        time.sleep(0.1)

    final_status = client.get("/api/simulation/status").json()
    assert final_status["completed"] >= 3
    assert final_status["total"] >= 3
