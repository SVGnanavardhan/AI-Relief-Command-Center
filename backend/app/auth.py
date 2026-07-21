import json
import os
from datetime import datetime
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.database import User


def _get_supabase_api_key() -> str:
    return (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
        or ""
    ).strip()


def verify_supabase_token(token: str) -> dict[str, Any]:
    supabase_url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    if not supabase_url:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="SUPABASE_URL is not configured")

    api_key = _get_supabase_api_key()
    if not api_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="SUPABASE API key is not configured")

    request = Request(
        f"{supabase_url}/auth/v1/user",
        headers={
            "Authorization": f"Bearer {token}",
            "apikey": api_key,
            "Content-Type": "application/json",
        },
        method="GET",
    )

    try:
        with urlopen(request, timeout=5) as response:
            return json.load(response)
    except HTTPError as exc:
        if exc.code in {401, 403}:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unable to validate Supabase token") from exc
    except URLError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Unable to reach Supabase authentication service") from exc


def get_user_by_email(db: Session, email: str) -> User | None:
    if not email:
        return None
    return db.query(User).filter(User.email == email).first()


def get_user_by_supabase_id(db: Session, supabase_user_id: str) -> User | None:
    if not supabase_user_id:
        return None
    return db.query(User).filter(User.supabase_user_id == supabase_user_id).first()


def _profile_name(profile: dict[str, Any]) -> str:
    metadata = profile.get("user_metadata") or {}
    if isinstance(metadata, dict):
        for key in ("full_name", "name"):
            value = metadata.get(key)
            if value:
                return str(value)

    email = str(profile.get("email") or "").strip()
    if email:
        return email.split("@", 1)[0].replace(".", " ").title() or "Supabase User"
    return "Supabase User"


def _profile_role(profile: dict[str, Any]) -> str:
    metadata = profile.get("user_metadata") or {}
    if isinstance(metadata, dict):
        role = metadata.get("role")
        if role:
            return str(role).strip().lower()
    role = profile.get("role")
    if role:
        return str(role).strip().lower()
    return "citizen"


def upsert_user_from_supabase_profile(db: Session, profile: dict[str, Any]) -> User:
    supabase_user_id = str(profile.get("id") or "").strip() or None
    email = str(profile.get("email") or "").strip().lower()
    phone = None
    metadata = profile.get("user_metadata") or {}
    if isinstance(metadata, dict):
        phone = metadata.get("phone") or metadata.get("mobile")

    user = get_user_by_supabase_id(db, supabase_user_id) if supabase_user_id else None
    if not user and email:
        user = get_user_by_email(db, email)

    if not user:
        user = User(
            name=_profile_name(profile),
            email=email or "supabase-user@example.com",
            phone=phone,
            role=_profile_role(profile),
            is_active=1,
            supabase_user_id=supabase_user_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    user.name = user.name or _profile_name(profile)
    user.email = email or user.email
    user.phone = phone or user.phone
    user.role = _profile_role(profile) or user.role
    user.supabase_user_id = supabase_user_id or user.supabase_user_id
    user.last_login = datetime.utcnow()
    user.is_active = 1
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    return None


def get_current_user(db: Session, token: str) -> User:
    profile = verify_supabase_token(token)
    user = upsert_user_from_supabase_profile(db, profile)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_roles(*allowed_roles: str):
    def dependency(db: Session, token: str) -> User:
        raise NotImplementedError

    return dependency
