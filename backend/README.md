# AI Relief Command Center Backend

This backend is PostgreSQL-only and expects a DATABASE_URL connection string.

AI Relief Command Center is a full-stack emergency operations platform for incident intake, mission coordination, AI-assisted triage, and disaster simulation. It combines a FastAPI backend, a React + TypeScript frontend, and a PostgreSQL-ready data layer designed for deployment on Render, Vercel, and Supabase.

## Architecture

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: FastAPI + SQLAlchemy + Pydantic
- Database: PostgreSQL-ready SQLAlchemy models with Supabase-compatible configuration
- AI: Gemini API with deterministic fallback
- Maps: Leaflet + OpenStreetMap
- Deployment: Vercel for frontend, Render for backend, Supabase for database

## Key capabilities

- Incident reporting with text, image, and audio upload
- AI incident analysis and urgency scoring
- Dashboard KPIs for total incidents, pending work, teams, response time, and mission outcomes
- Team assignment, mission history, notifications, and dispatch workflows
- Interactive map and disaster simulation engine
- JWT authentication with register/login/profile/settings routes
- Production-oriented deployment and verification scaffolding

## Authentication

The backend now exposes auth endpoints for:

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout
- POST /api/auth/refresh

The frontend includes login, register, profile, and settings views.

## Database

The project uses SQLAlchemy models for reports, teams, notifications, history, inventory, and users. The repository is structured to work with Supabase PostgreSQL and includes a database verification script at [verify_database.py](verify_database.py).

## Deployment

- Frontend: Vercel
- Backend: Render
- Database: Supabase PostgreSQL

## Environment variables

Backend and frontend env examples are provided in [.env.example](.env.example) and [frontend-main/.env.example](frontend-main/.env.example).

Required variables include:

- DATABASE_URL
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- GEMINI_API_KEY
- JWT_SECRET
- SECRET_KEY
- ACCESS_TOKEN_EXPIRE_MINUTES
- REFRESH_TOKEN_EXPIRE_DAYS
- UPLOAD_DIR
- FRONTEND_URL
- CORS_ORIGINS
- VITE_API_URL

## Folder structure

```text
app/                  # FastAPI backend logic and services
frontend-main/       # React + TypeScript frontend
tests/               # Backend regression tests
verify_database.py   # Database verification script
render.yaml          # Render deployment file
Dockerfile           # Container build definition
Procfile             # Render/Heroku-style process file
```

## Verification

Run the following locally:

```bash
python -m pytest -q tests/test_auth.py tests/test_report_submission.py tests/test_simulation.py
cd frontend-main && npm run build
python verify_database.py
```

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
