import os
import pytest

pytestmark = pytest.mark.skipif(not os.getenv("DATABASE_URL"), reason="DATABASE_URL must be set for PostgreSQL tests")

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_supabase_access_token_provides_profile(monkeypatch):
    def fake_verify_supabase_token(token):
        assert token == "supabase-token"
        return {
            "id": "supabase-user-123",
            "email": "supabase@example.com",
            "role": "citizen",
            "user_metadata": {"full_name": "Supabase User"},
        }

    monkeypatch.setattr("app.auth.verify_supabase_token", fake_verify_supabase_token)

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer supabase-token"},
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["email"] == "supabase@example.com"
    assert payload["role"] == "citizen"
    assert payload["name"] == "Supabase User"


def test_missing_token_returns_401():
    response = client.get("/api/auth/me")
    assert response.status_code == 401
