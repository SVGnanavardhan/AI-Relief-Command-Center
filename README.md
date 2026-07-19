# AI Relief Command Center

AI Relief Command Center is a full-stack emergency operations platform built to simulate and support modern disaster response workflows. It combines a FastAPI backend, a React + TypeScript frontend, and AI-assisted incident analysis to help emergency teams intake reports, classify incidents, assign teams, monitor mission progress, and visualize active operations in a polished command-center experience.

This project is designed as a demo-ready emergency operations system for hackathons, stakeholder presentations, and rapid prototyping of crisis coordination workflows.

## Project overview

The platform covers the entire incident lifecycle, from initial report intake to operational resolution:

- Submit incident reports with text, image, and audio support
- Analyze incoming incidents with AI for classification, urgency scoring, and resource recommendations
- Enrich reports with geographic context such as district, state, landmark, and accuracy estimates
- Assign teams to incidents and track response readiness
- Update incident status through lifecycle stages such as reported, assigned, en route, rescue started, and closed
- Present dashboard KPIs for ongoing operations and team availability
- Visualize incidents on an interactive map
- Simulate disaster scenarios for live demonstrations
- Surface rescue notifications, dispatch updates, and activity feed events for coordination

## What the app does

### 1. Incident intake
The application allows users to submit new incident reports through the web interface or backend API. Each report can include:

- description
- location
- optional image upload
- optional audio upload
- automatic AI analysis results

The backend processes the incident and stores it in the database for downstream operations.

### 2. AI-assisted incident analysis
Each submitted incident is analyzed to provide operational context, including:

- summary text
- category classification such as medical, rescue, shelter, food, fire, flood, road, or other
- urgency score
- priority label
- recommended resources
- reasoning explanation
- confidence score

If the AI service is unavailable, the system uses a deterministic fallback so the app still works.

### 3. Operational dashboard
The dashboard presents a live command-center view with:

- total incident counts
- pending incident counts
- AI-reviewed incidents
- assigned teams
- en-route teams
- rescue-in-progress incidents
- resolved and closed incidents
- people rescued and people awaiting rescue
- medical requests, fire emergencies, and flood emergencies
- response time and rescue time metrics
- active, available, and busy teams
- mission success rate and resource usage
- recent incidents and trend data
- notifications and live activity feed

### 4. Team coordination and assignments
The platform supports response team management by allowing users to:

- create teams
- store team attributes such as members, vehicle, equipment, availability, ETA, and capacity
- assign teams to incidents
- generate rescue notifications for assigned operations
- track assignment progress through the incident workflow

### 5. Incident lifecycle tracking
Every incident can move through multiple operational stages. The system stores lifecycle history and exposes status updates so that users can review:

- report creation
- AI review
- assignment
- team notification
- dispatch progress
- rescue activity
- completion and closure

### 6. Interactive map and visualization
The frontend includes an interactive map view that helps operators understand where incidents are concentrated and where resources may be needed. It works alongside the dashboard and incident pages to provide spatial awareness.

### 7. Disaster simulation mode
The app includes a simulation engine that can generate realistic incident scenarios for demo purposes. This allows teams to demonstrate how the platform behaves during a live emergency response simulation, including dispatching, priority escalation, and status progression.

### 8. Notifications and activity feed
The system provides operational notifications for assigned rescue work and tracks activity feed events for situational awareness. These updates help create a more realistic emergency coordination experience.

## Core features by area

### Incident intake and analysis
- Report submission from UI and API
- Image and audio support
- AI-driven categorization and prioritization
- Deterministic fallback when Gemini is unavailable
- Rich report metadata such as location context and confidence

### Command center experience
- Executive dashboard with KPI cards
- Incident search and filtering by priority and category
- Incident detail view with lifecycle progress
- Operations workspace for team assignment
- Interactive map for spatial awareness
- Activity feed and notification panel

### Response coordination
- Team creation and management
- Team assignment to incidents
- Rescue notifications
- Status updates and mission tracking
- Operational metrics for readiness and completion

### Simulation and demo capabilities
- Realistic disaster scenario generation
- Live updates to dashboard and map state
- Demonstration-friendly mission progress visualization

## Technology stack

### Backend
- Python 3.11+
- FastAPI
- SQLAlchemy ORM
- Pydantic models
- SQLite database (default)
- Google Generative AI integration
- Geopy for geocoding

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Leaflet
- Lucide React icons

## Project structure

```text
app/                      # FastAPI backend, CRUD logic, schemas, services, and DB models
  __init__.py
  config.py
  crud.py                 # Report, dashboard, team, notification, and simulation logic
  database.py            # SQLAlchemy models and schema initialization
  main.py                # API routes and application entrypoint
  schemas.py             # Request and response schemas
  schemas_dashboard.py   # Dashboard response schema
  services/              # Gemini, geocoder, storage, and simulation helpers
frontend-main/           # React + TypeScript frontend application
  src/                   # App pages, components, hooks, api, types, and styles
tests/                   # Backend regression tests
uploads/                 # Local upload storage
Dockerfile               # Container build definition
render.yaml              # Render deployment configuration
requirements.txt        # Python dependencies
```

## Backend API overview

The backend exposes the following API routes:

- POST /api/report - Create a new incident report
- GET /api/reports - List all reports
- GET /api/reports/{report_id} - Fetch a single report
- POST /api/reports/{report_id}/assign-team/{team_id} - Assign a team to an incident
- POST /api/reports/{report_id}/status - Update incident status
- GET /api/reports/{report_id}/history - Retrieve incident status history
- GET /api/dashboard - Fetch dashboard KPIs and incident summaries
- GET /api/operations - Fetch operations payload with incidents, teams, inventory, and notifications
- GET /api/teams - List response teams
- POST /api/teams - Create a team
- GET /api/notifications - List rescue notifications
- POST /api/notifications - Create a rescue notification
- POST /api/inventory - Add inventory items

## Frontend pages and experience

The frontend includes several pages for different operational use cases:

- Dashboard - overview of live incidents, mission metrics, alerts, and response status
- Submit Report - intake form for creating new incident reports
- Incident Details - review of incident data, assignment history, status progression, and operational context
- Operations - dispatch and team assignment workspace
- Priority Queue - review of prioritized incidents
- Interactive Map - map-based incident visualization
- Not Found - fallback page for invalid routes

## Project access

The application is designed to be used through its web interface and API endpoints. The backend provides interactive API documentation, and the frontend offers the full emergency operations experience through the browser.

## Environment variables

The application uses the following environment variables:

| Variable | Required | Description |
| --- | --- | --- |
| GEMINI_API_KEY | No | API key for Gemini-based AI analysis. If absent, the app uses a fallback analysis path. |
| CORS_ORIGINS | No | Comma-separated allowed frontend origins. |
| DATABASE_URL | No | Optional database URL. Defaults to sqlite:///./reports.db. |

## Typical user workflow

A typical flow in the application is:

1. A user submits a new incident report from the UI or API.
2. The backend geocodes the location and runs AI analysis.
3. The incident appears in the dashboard with category, priority, and urgency details.
4. A response team is assigned from the operations workspace.
5. Status updates move the incident through the lifecycle.
6. The dashboard and map update to reflect ongoing operations.
7. The simulation mode can be used to demonstrate a realistic emergency response scenario.

## Testing and quality

The project includes automated backend regression tests and a frontend build pipeline to help keep the experience reliable.

## Deployment

The project includes deployment support for:

- Docker via the included Dockerfile
- Render via render.yaml

## Contributing

Contributions are welcome. Please review [CONTRIBUTING.md](CONTRIBUTING.md) for development guidance and workflow expectations.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
