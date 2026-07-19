from typing import Any, Dict, List

from pydantic import BaseModel


class DashboardStat(BaseModel):
    name: str
    value: int


class DashboardTrendPoint(BaseModel):
    time: str
    critical: int
    high: int
    medium: int
    low: int


class DashboardResponse(BaseModel):
    total_reports: int
    pending_incidents: int
    ai_reviewed: int
    teams_assigned: int
    teams_en_route: int
    rescue_in_progress: int
    successfully_resolved: int
    closed_incidents: int
    people_rescued: int
    people_awaiting_rescue: int
    medical_requests: int
    fire_emergencies: int
    flood_emergencies: int
    average_response_time: float
    average_rescue_time: float
    active_rescue_teams: int
    available_teams: int
    busy_teams: int
    critical_reports: int
    critical_incidents: int
    medical_cases: int
    rescue_cases: int
    shelter_requests: int
    food_requests: int
    food_cases: int
    shelter_cases: int
    fire_cases: int
    flood_cases: int
    category_distribution: List[DashboardStat]
    urgency_trend: List[DashboardTrendPoint]
    recent_incidents: List[Dict[str, Any]]
    notifications: List[Dict[str, Any]]
    activity_feed: List[Dict[str, Any]]
    mission_success_rate: float
    completed_today: int
    completed_this_week: int
    average_completion_time: float
    lives_saved: int
    resources_used: int
