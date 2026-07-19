import json
import os
import re
from typing import Any, Dict, List

import google.generativeai as genai
from supabase import Client, create_client

from app.config import get_settings


def _extract_json(text: str) -> Dict[str, Any]:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        text = match.group(0)
    return json.loads(text)


def get_gemini_model() -> Any:
    settings = get_settings()
    if not settings["gemini_api_key"]:
        raise RuntimeError("GEMINI_API_KEY is not configured")
    genai.configure(api_key=settings["gemini_api_key"])
    return genai.GenerativeModel("gemini-1.5-flash")


def get_supabase_client() -> Client:
    settings = get_settings()
    if not settings["supabase_url"] or not settings["supabase_key"]:
        raise RuntimeError("Supabase configuration is incomplete")
    return create_client(settings["supabase_url"], settings["supabase_key"])


def analyze_report(description: str) -> Dict[str, Any]:
    prompt = f"""You are an emergency disaster response AI.

Analyze the emergency report.

Return ONLY valid JSON.

Fields:
summary
category
urgency_score
priority
resources

Categories:
Medical
Rescue
Food
Shelter
Infrastructure
Fire
Flood
Other

Priority:
Critical
High
Medium
Low

Urgency Score:
0-100

Emergency Report:
{description}

Do not return markdown.
Do not explain.
Return only JSON."""
    model = get_gemini_model()
    response = model.generate_content(prompt)
    text = getattr(response, "text", "") or ""
    if not text:
        raise RuntimeError("Gemini returned an empty response")
    payload = _extract_json(text)
    return {
        "summary": str(payload.get("summary", "")),
        "category": str(payload.get("category", "Other")),
        "urgency_score": int(payload.get("urgency_score", 0)),
        "priority": str(payload.get("priority", "Low")),
        "resources": payload.get("resources", []) or [],
    }


def store_report(payload: Dict[str, Any]) -> Dict[str, Any]:
    client = get_supabase_client()
    result = client.table("reports").insert(payload).execute()
    data = result.data or []
    if not data:
        raise RuntimeError("Failed to store report in Supabase")
    return data[0]


def fetch_reports() -> List[Dict[str, Any]]:
    client = get_supabase_client()
    result = client.table("reports").select("*").order("urgency_score", desc=True).execute()
    return result.data or []


def fetch_dashboard() -> Dict[str, int]:
    reports = fetch_reports()
    total_reports = len(reports)
    critical_reports = sum(1 for item in reports if str(item.get("priority", "")).lower() == "critical")
    medical_cases = sum(1 for item in reports if str(item.get("category", "")).lower() == "medical")
    rescue_cases = sum(1 for item in reports if str(item.get("category", "")).lower() == "rescue")
    food_cases = sum(1 for item in reports if str(item.get("category", "")).lower() == "food")
    shelter_cases = sum(1 for item in reports if str(item.get("category", "")).lower() == "shelter")
    return {
        "total_reports": total_reports,
        "critical_reports": critical_reports,
        "medical_cases": medical_cases,
        "rescue_cases": rescue_cases,
        "food_cases": food_cases,
        "shelter_cases": shelter_cases,
    }
