import shutil
from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import UploadFile
from starlette.datastructures import UploadFile as StarletteUploadFile

UPLOAD_ROOT = Path(__file__).resolve().parents[1] / "uploads"
IMAGE_DIR = UPLOAD_ROOT / "images"
AUDIO_DIR = UPLOAD_ROOT / "audio"
IMAGE_DIR.mkdir(parents=True, exist_ok=True)
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg", ".aac"}


def build_public_url(relative_path: str) -> str:
    return f"/uploads/{relative_path.lstrip('/')}"


def save_upload(upload: Optional[UploadFile | StarletteUploadFile], kind: str) -> Optional[str]:
    if upload is None:
        return None
    if getattr(upload, "filename", None) in {None, ""}:
        return None

    filename = Path(upload.filename or "").name
    suffix = Path(filename).suffix.lower()
    if kind == "image" and suffix not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValueError("Unsupported image format")
    if kind == "audio" and suffix not in ALLOWED_AUDIO_EXTENSIONS:
        raise ValueError("Unsupported audio format")

    target_dir = IMAGE_DIR if kind == "image" else AUDIO_DIR
    stored_name = f"{uuid4().hex}{suffix}"
    target_path = target_dir / stored_name
    with target_path.open("wb") as destination:
        if hasattr(upload, "file"):
            shutil.copyfileobj(upload.file, destination)
        else:
            destination.write(upload.read())
    return build_public_url(f"{kind}/{stored_name}")
