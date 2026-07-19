from typing import Any, List, Optional
from pydantic import BaseModel, Field


class ReportCreate(BaseModel):
    description: str = Field(..., min_length=1)
    location: str = Field(..., min_length=1)
    image: Optional[str] = None
    audio: Optional[str] = None


class ReportOut(BaseModel):
    id: int
    description: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    summary: str
    ai_summary: Optional[str] = None
    category: str
    urgency_score: int
    priority: str
    resources: List[Any]
    suggested_resources: List[Any] = []
    reasoning: Optional[str] = None
    image_url: Optional[str] = None
    voice_url: Optional[str] = None
    audio_url: Optional[str] = None
    timestamp: Optional[str] = None
    status: Optional[str] = None
    assigned_team: Optional[str] = None
    assigned_team_id: Optional[int] = None
    created_at: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    nearest_landmark: Optional[str] = None
    estimated_accuracy: Optional[float] = None
    weather: Optional[str] = None
    road_accessibility: Optional[str] = None
    suggested_evacuation_routes: List[str] = []
    predicted_impact_radius_km: Optional[int] = None
    affected_population_estimate: Optional[int] = None
    ai_urgency_explanation: Optional[str] = None
    ai_confidence_score: Optional[float] = None
    priority_reasoning: Optional[str] = None
    required_resources: List[Any] = []
    required_vehicles: List[str] = []
    required_medical_teams: List[str] = []
    food_requirement_estimate: Optional[int] = None
    water_requirement_estimate: Optional[int] = None
    temporary_shelter_estimate: Optional[int] = None
    current_status: Optional[str] = None
    dispatch_history: List[Any] = []
    mission_log: List[Any] = []
