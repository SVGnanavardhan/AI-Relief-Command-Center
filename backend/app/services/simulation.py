import random
import threading
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from app.crud import assign_team_to_report, create_report, create_team, update_report_status
from app.database import SessionLocal, Team


@dataclass
class SimulationState:
    status: str = "idle"
    total: int = 0
    completed: int = 0
    progress: float = 0.0
    current: Optional[Dict[str, Any]] = None
    message: str = "No simulation running."
    routes: List[Dict[str, Any]] = field(default_factory=list)


class SimulationManager:
    def __init__(self) -> None:
        self._state = SimulationState()
        self._lock = threading.Lock()
        self._thread: Optional[threading.Thread] = None

    def start(self, count: int = 25) -> Dict[str, Any]:
        normalized = max(20, min(100, int(count or 25)))
        with self._lock:
            if self._thread and self._thread.is_alive():
                return self.snapshot()
            self._state.status = "started"
            self._state.total = normalized
            self._state.completed = 0
            self._state.progress = 0.0
            self._state.current = None
            self._state.message = "Initializing simulated disaster response network..."
            self._state.routes = []
            self._thread = threading.Thread(target=self._run, args=(normalized,), daemon=True)
            self._thread.start()
        return self.snapshot()

    def status(self) -> Dict[str, Any]:
        return self.snapshot()

    def snapshot(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "status": self._state.status,
                "total": self._state.total,
                "completed": self._state.completed,
                "progress": round(self._state.progress, 1),
                "current": self._state.current,
                "message": self._state.message,
                "routes": list(self._state.routes[-8:]),
            }

    def _run(self, count: int) -> None:
        from app.main import analyze_report as main_analyze_report

        db = SessionLocal()
        try:
            self._ensure_teams(db)
            teams = db.query(Team).all()
            scenarios = self._build_scenarios(count)

            for index, scenario in enumerate(scenarios, start=1):
                self._update_state(
                    status="running",
                    current={
                        "title": scenario["title"],
                        "location": scenario["location"],
                        "category": scenario["category"],
                    },
                    message=f"Generating alert {index}/{count}: {scenario['title']}",
                )

                analysis = main_analyze_report(scenario["description"])
                payload = {
                    "description": scenario["description"],
                    "location": scenario["location"],
                    "latitude": scenario["latitude"],
                    "longitude": scenario["longitude"],
                    "summary": str(analysis.get("summary") or "Simulated incident analysis"),
                    "category": str(analysis.get("category") or scenario["category"]).lower(),
                    "urgency_score": int(analysis.get("urgency_score", 70) or 70),
                    "priority": str(analysis.get("priority") or "medium").lower(),
                    "resources": analysis.get("resources", []) or [],
                    "reasoning": str(analysis.get("reasoning") or "Simulated AI reasoning"),
                    "confidence_score": float(analysis.get("confidence_score", 0.8) or 0.8),
                    "image_url": None,
                    "audio_url": None,
                    "transcript": None,
                    "status": "reported",
                }

                report = create_report(db, payload)
                team = self._select_team(teams, scenario["category"])
                if team is not None:
                    assign_team_to_report(db, report["id"], team.id)
                    update_report_status(db, report["id"], "team en route", f"Simulated dispatch for {scenario['title']}")
                    self._append_route(team, scenario, report)
                    update_report_status(db, report["id"], "on scene", f"Response teams engaged at {scenario['location']}")
                else:
                    update_report_status(db, report["id"], "assigned", f"Team assignment queued for {scenario['location']}")

                self._update_state(
                    status="running",
                    completed=index,
                    progress=(index / count) * 100,
                    current={
                        "title": scenario["title"],
                        "location": scenario["location"],
                        "category": scenario["category"],
                    },
                    message=f"Dispatched response for {scenario['title']}",
                )
                time.sleep(0.25)
        finally:
            db.commit()
            db.close()
            self._update_state(
                status="completed",
                completed=count,
                progress=100.0,
                message="Simulation completed. Dashboards and map views have been updated.",
                current=None,
            )

    def _ensure_teams(self, db: Any) -> None:
        existing = db.query(Team).count()
        if existing >= 5:
            return
        payloads = [
            {"name": "Alpha Medical Unit", "members": 8, "vehicle": "Ambulance", "equipment": ["Triage Kit", "Oxygen"], "gps_location": "Chennai", "availability": "available", "status": "ready", "eta_minutes": 8, "capacity": 10},
            {"name": "Bravo Rescue Team", "members": 10, "vehicle": "Rescue Truck", "equipment": ["Cutters", "Life Jacket"], "gps_location": "Mumbai", "availability": "available", "status": "ready", "eta_minutes": 10, "capacity": 12},
            {"name": "Delta Fire Crew", "members": 6, "vehicle": "Fire Tender", "equipment": ["Hydrant Kit", "Thermal Camera"], "gps_location": "Delhi", "availability": "available", "status": "ready", "eta_minutes": 6, "capacity": 8},
            {"name": "Echo Logistics", "members": 7, "vehicle": "Supply Truck", "equipment": ["Shelter Kits", "Water"], "gps_location": "Kolkata", "availability": "available", "status": "ready", "eta_minutes": 12, "capacity": 9},
        ]
        for payload in payloads:
            create_team(db, payload)

    def _build_scenarios(self, count: int) -> List[Dict[str, Any]]:
        templates = [
            {
                "title": "Flash flood evacuation",
                "category": "flood",
                "description": "Severe flash flooding has trapped residents near the riverbank and cut off several access roads.",
                "location": "Kolkata, West Bengal",
                "latitude": 22.5726,
                "longitude": 88.3639,
            },
            {
                "title": "Warehouse fire outbreak",
                "category": "fire",
                "description": "A warehouse fire is spreading quickly toward nearby homes and businesses and requires urgent containment.",
                "location": "Mumbai, Maharashtra",
                "latitude": 19.0760,
                "longitude": 72.8777,
            },
            {
                "title": "Medical triage surge",
                "category": "medical",
                "description": "Multiple patients are waiting for immediate triage after a building collapse and several are in respiratory distress.",
                "location": "Chennai, Tamil Nadu",
                "latitude": 13.0827,
                "longitude": 80.2707,
            },
            {
                "title": "Bridge collapse and access disruption",
                "category": "road",
                "description": "A bridge collapse has blocked emergency access and stranded residents on the wrong side of the route.",
                "location": "Pune, Maharashtra",
                "latitude": 18.5204,
                "longitude": 73.8567,
            },
            {
                "title": "Shelter demand spike",
                "category": "shelter",
                "description": "Hundreds of displaced residents need temporary shelter, water, and blankets after a sudden storm.",
                "location": "Bhubaneswar, Odisha",
                "latitude": 20.2961,
                "longitude": 85.8245,
            },
            {
                "title": "Food distribution gap",
                "category": "food",
                "description": "Community kitchens are running low on food packs and clean water for families sheltering in a school compound.",
                "location": "Hyderabad, Telangana",
                "latitude": 17.3850,
                "longitude": 78.4867,
            },
        ]
        scenarios: List[Dict[str, Any]] = []
        for index in range(count):
            base = templates[index % len(templates)]
            jitter = 0.15 * (index % 5)
            scenario = dict(base)
            scenario["title"] = f"{base['title']} #{index + 1}"
            scenario["latitude"] = round(base["latitude"] + random.uniform(-jitter, jitter), 4)
            scenario["longitude"] = round(base["longitude"] + random.uniform(-jitter, jitter), 4)
            scenario["location"] = f"{base['location']}"
            scenario["description"] = f"{base['description']} Incident #{index + 1} requires coordinated response."
            scenarios.append(scenario)
        return scenarios

    def _select_team(self, teams: List[Team], category: str) -> Optional[Team]:
        category_lower = (category or "").lower()
        if not teams:
            return None
        if category_lower in {"medical", "fire", "flood", "rescue", "road"}:
            for team in teams:
                if "medical" in (team.name or "").lower() or "rescue" in (team.name or "").lower() or "fire" in (team.name or "").lower():
                    return team
        if category_lower in {"shelter", "food"}:
            for team in teams:
                if "logistics" in (team.name or "").lower() or "medical" in (team.name or "").lower():
                    return team
        return teams[0]

    def _append_route(self, team: Team, scenario: Dict[str, Any], report: Dict[str, Any]) -> None:
        with self._lock:
            self._state.routes.append(
                {
                    "id": f"route-{len(self._state.routes) + 1}",
                    "team": team.name,
                    "incident": scenario["title"],
                    "from": {"lat": 13.0827, "lng": 80.2707} if "medical" in (team.name or "").lower() else {"lat": 19.0760, "lng": 72.8777},
                    "to": {"lat": scenario["latitude"], "lng": scenario["longitude"]},
                    "label": f"{team.name} → {scenario['location']}",
                }
            )

    def _update_state(self, **kwargs: Any) -> None:
        with self._lock:
            for key, value in kwargs.items():
                setattr(self._state, key, value)


simulation_manager = SimulationManager()
