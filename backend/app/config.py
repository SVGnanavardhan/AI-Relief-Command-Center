import os
from functools import lru_cache
from typing import Any

from dotenv import load_dotenv

load_dotenv()


@lru_cache
def get_settings() -> dict[str, Any]:
    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        raise RuntimeError("DATABASE_URL must be set to a PostgreSQL connection string")

    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+psycopg2://", 1)

    return {
        "gemini_api_key": os.getenv("GEMINI_API_KEY", ""),
        "database_url": database_url,
        "gemini_model": os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
        "cors_origins": [origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",") if origin.strip()],
        "supabase_url": os.getenv("SUPABASE_URL", ""),
        "supabase_key": os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY", ""),
        "supabase_anon_key": os.getenv("SUPABASE_ANON_KEY", ""),
        "supabase_service_role_key": os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
        "jwt_secret": os.getenv("SUPABASE_JWT_SECRET", os.getenv("JWT_SECRET", "change-me-in-production")),
        "secret_key": os.getenv("SECRET_KEY", "change-me-in-production"),
        "supabase_jwt_secret": os.getenv("SUPABASE_JWT_SECRET", ""),
    }
