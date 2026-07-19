import os
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = pytest.mark.skipif(not os.getenv("DATABASE_URL"), reason="DATABASE_URL must be set for PostgreSQL tests")

client = TestClient(app)


def test_register_login_and_profile_flow():
    email = f"auth-user-{uuid4().hex[:8]}@example.com"
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Auth User",
            "email": email,
            "password": "StrongPass123!",
            "phone": "+911234567890",
            "role": "citizen",
        },
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["user"]["email"] == email
    assert payload["access_token"]
    assert payload["refresh_token"]

    login_response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "StrongPass123!", "remember_me": True},
    )
    assert login_response.status_code == 200, login_response.text
    login_payload = login_response.json()
    assert login_payload["access_token"]

    profile_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {login_payload['access_token']}"},
    )
    assert profile_response.status_code == 200, profile_response.text
    assert profile_response.json()["email"] == email
