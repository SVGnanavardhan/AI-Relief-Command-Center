# AI Relief Command Center

AI Relief Command Center is a full-stack emergency operations platform for incident intake, AI-assisted triage, dispatch coordination, and disaster simulation.

## Project structure

- Backend: [backend](backend)
- Frontend: [frontend](frontend)
- Docs: [docs](docs)
- Scripts: [scripts](scripts)
- CI/CD: [.github/workflows](.github/workflows)

## Core capabilities

- Incident reporting with text, image, and audio upload support
- AI-assisted analysis and urgency scoring
- Dashboard KPIs, team assignment, dispatch workflows, and notifications
- Authentication and protected API access
- Simulation and operations monitoring

## Local setup

### Backend

1. Create and activate a Python virtual environment.
2. Install the backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

3. Configure environment variables in the repository root `.env` file, including:

- `DATABASE_URL` for PostgreSQL/Supabase
- `SUPABASE_URL` and `SUPABASE_KEY` if using Supabase services
- `GEMINI_API_KEY` for AI analysis

### Frontend

```bash
cd frontend/frontend-src
npm install
npm run build
```

### Verification

```bash
cd backend
python -m pytest -q tests/test_auth.py tests/test_report_submission.py tests/test_simulation.py
python verify_database.py
```

## Deployment

- Backend: Render via [backend/render.yaml](backend/render.yaml)
- Frontend: Vercel via [frontend/frontend-src/vercel.json](frontend/frontend-src/vercel.json)
- Database: PostgreSQL/Supabase-compatible storage

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
