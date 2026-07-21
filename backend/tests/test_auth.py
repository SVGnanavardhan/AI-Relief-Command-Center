import os
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = pytest.mark.skipif(not os.getenv("DATABASE_URL"), reason="DATABASE_URL must be set for PostgreSQL tests")

client = TestClient(app)


def test_register_login_and_profile_flow(monkeypatch):
    email = f"auth-user-{uuid4().hex[:8]}@example.com"

    def fake_verify_supabase_token(token):
        assert token == "mock-supabase-token"
        return {
            "id": f"supabase-{uuid4().hex[:8]}",
            "email": email,
            "role": "citizen",
            "user_metadata": {
                "full_name": "Auth User",
                "phone": "+911234567890",
                "role": "citizen"
            }
        }

    monkeypatch.setattr("app.auth.verify_supabase_token", fake_verify_supabase_token)

    response = client.post(
        "/api/auth/register",
        json={
            "access_token": "mock-supabase-token",
            "name": "Auth User",
            "email": email,
            "phone": "+911234567890",
            "role": "citizen",
        },
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["user"]["email"] == email
    assert payload["access_token"] == "mock-supabase-token"

    login_response = client.post(
        "/api/auth/login",
        json={"access_token": "mock-supabase-token"},
    )
    assert login_response.status_code == 200, login_response.text
    login_payload = login_response.json()
    assert login_payload["access_token"] == "mock-supabase-token"

    profile_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {login_payload['access_token']}"},
    )
    assert profile_response.status_code == 200, profile_response.text
    assert profile_response.json()["email"] == email
