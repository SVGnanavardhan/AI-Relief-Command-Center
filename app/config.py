import os
from functools import lru_cache
from typing import Any

from dotenv import load_dotenv

load_dotenv()


@lru_cache
def get_settings() -> dict[str, Any]:
    return {
        "gemini_api_key": os.getenv("GEMINI_API_KEY", ""),
        "database_url": os.getenv("DATABASE_URL", "sqlite:///./reports.db"),
        "gemini_model": os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
        "cors_origins": [origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",") if origin.strip()],
    }
