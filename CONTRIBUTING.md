# Contributing

Thanks for helping improve AI Relief Command Center.

## Development setup

1. Create and activate a Python virtual environment.
2. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend-main
   npm install
   ```
4. Run the backend:
   ```bash
   uvicorn app.main:app --reload --port 8001
   ```
5. Run the frontend:
   ```bash
   cd frontend-main
   npm run dev
   ```

## Pull requests

- Keep changes focused and explain the intent clearly.
- Include tests when adding behavior.
- Run the relevant checks before opening a PR.
