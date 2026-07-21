<div align="center">

# 🛡️ AI Relief Command Center

**AI-powered emergency response coordination platform for real-time disaster relief operations**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?logo=supabase)](https://supabase.com)
[![Google Gemini](https://img.shields.io/badge/Gemini%20AI-Powered-4285F4?logo=google)](https://ai.google.dev)

[Live Demo](https://ai-relief-command-center-1.onrender.com) · [Report Bug](https://github.com/SVGnanavardhan/AI-Relief-Command-Center/issues) · [Request Feature](https://github.com/SVGnanavardhan/AI-Relief-Command-Center/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Frontend Pages](#-frontend-pages)
- [Authentication Flow](#-authentication-flow)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

AI Relief Command Center is a full-stack emergency response platform that uses **Google Gemini AI** to automatically triage disaster incidents, prioritize rescue operations, and coordinate response teams in real-time. It provides a modern command-center interface for administrators, operations officers, and rescue teams to collaborate during crisis situations.

The platform accepts incident reports (text, images, voice), processes them through AI for severity assessment, geocodes locations, and presents actionable intelligence through a real-time dashboard with live charts, interactive maps, and team dispatch capabilities.

---

## ✨ Features

### 🤖 AI-Powered Intelligence
- **Gemini AI Triage** — Automatic incident categorization, urgency scoring (0-1), and priority classification (critical/high/medium/low)
- **AI Summary Generation** — Natural language summaries of incident reports with reasoning
- **Resource Recommendations** — AI-suggested resources, vehicles, and medical teams per incident
- **Confidence Scoring** — Model reliability metrics for each AI assessment

### 📊 Real-Time Dashboard
- **Live Stat Cards** — Total incidents, pending, AI-reviewed, teams assigned, rescue in progress, resolved, and more
- **Dynamic Charts** — Urgency trend (area chart), category distribution (pie chart), priority pulse (bar chart)
- **Empty States** — All values start at 0; charts only appear when real data is submitted
- **Activity Feed** — Live updates of dispatch and mission events
- **Admin-Only Controls** — Simulation runner and mission progress bar restricted to administrators

### 🗺️ Interactive Map
- **Leaflet-Based Map** — Geocoded incident markers with priority-colored pins
- **Click-to-Detail** — Click any marker to view full incident details
- **Real-Time Updates** — Map refreshes as new incidents are submitted

### 👥 Team Dispatch & Operations
- **Team Management** — Create, list, and track rescue team availability
- **Incident Assignment** — Assign specific teams to incidents with one click
- **In-App Notifications** — Dispatch confirmations shown as in-app banners (v1 — no email/SMTP)
- **Auto-Assign (Admin)** — AI-assisted automatic team-to-incident matching
- **Role-Gated Controls** — Dispatch buttons visible only to Operations Officers and Admins

### 🔐 Authentication & Authorization
- **Supabase Auth** — Email/password sign-up and sign-in
- **Role-Based Access** — 4 roles: Administrator, Operations Officer, Rescue Team, Citizen
- **Protected Routes** — Dashboard and all app pages require authentication
- **Landing Page Auth** — Animated Sign In / Sign Up tabs on the landing page
- **Session Persistence** — JWT tokens with auto-refresh via Supabase client

### 👤 User Profile
- **Account Details** — Name, email, role, phone, member-since date
- **Role Badge** — Color-coded role indicator
- **Permissions Table** — Visual breakdown of what each role can access
- **3-Tier Data Loading** — API → localStorage cache → Supabase session fallback

### 📝 Incident Reporting
- **Multi-Modal Input** — Text description, image upload, voice recording
- **Auto-Geocoding** — Location text is geocoded to lat/lng coordinates via Geopy
- **AI Processing** — Submitted reports are analyzed by Gemini AI in real-time
- **Priority Queue** — All incidents ranked by AI-computed urgency score

### 🎨 Modern UI/UX
- **Animated Landing Page** — Gradient blob background with glassmorphism auth card
- **Hamburger Navigation** — Slide-over dark panel menu (replaces sidebar)
- **Top Navbar** — Desktop nav links + user badge with role indicator
- **Micro-Animations** — Fade-in, scale-in, hover-lift, stagger delays on cards
- **Responsive Design** — Mobile-first layout, works on all screen sizes
- **Smooth Transitions** — 200ms hover lifts, scale effects, active press feedback

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** `0.115` | REST API framework with async support |
| **Uvicorn** `0.32` | ASGI server |
| **SQLAlchemy** `2.0` | ORM for PostgreSQL |
| **Alembic** `1.18` | Database migrations |
| **PostgreSQL** (Supabase) | Primary database |
| **Google Gemini AI** `0.8` | Incident analysis and triage |
| **Geopy** `2.4` | Location geocoding |
| **Pydantic** `2.9` | Data validation |
| **python-dotenv** | Environment configuration |
| **psycopg2-binary** | PostgreSQL driver |

### Frontend
| Technology | Purpose |
|---|---|
| **React** `18.3` | UI library |
| **TypeScript** `5.5` | Type safety |
| **Vite** `5.4` | Build tool and dev server |
| **React Router** `7.18` | Client-side routing |
| **Tailwind CSS** `3.4` | Utility-first styling |
| **Recharts** `3.9` | Dashboard charts (Area, Pie, Bar) |
| **Leaflet** `1.9` | Interactive maps |
| **Axios** `1.18` | HTTP client with interceptors |
| **Supabase JS** `2.57` | Auth client |
| **Lucide React** | Icon library |

### Infrastructure
| Service | Purpose |
|---|---|
| **Supabase** | Authentication + PostgreSQL database |
| **Render** | Backend (Web Service) + Frontend (Static Site) deployment |
| **GitHub** | Source control and CI/CD |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                     │
│  Landing Page → Dashboard → Operations → Map → Profile  │
│         Supabase Auth Client + Axios Interceptors        │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS (Bearer JWT)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI)                       │
│              REST API + CORS Middleware                   │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Auth     │  │ Reports  │  │ Teams &  │  │ Dash-   │ │
│  │ Module   │  │ + AI     │  │ Dispatch │  │ board   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │              │             │              │      │
└───────┼──────────────┼─────────────┼──────────────┼──────┘
        │              │             │              │
        ▼              ▼             ▼              ▼
┌───────────┐  ┌───────────┐  ┌──────────────────────────┐
│ Supabase  │  │ Gemini AI │  │    PostgreSQL (Supabase)  │
│ Auth API  │  │ API       │  │    15 tables              │
└───────────┘  └───────────┘  └──────────────────────────┘
```

### Connection Flow
1. **User opens app** → Landing page loads (no auth required)
2. **Sign In/Up** → Supabase Auth issues JWT → stored in browser
3. **API calls** → Axios interceptor attaches JWT as `Bearer` token
4. **Backend validates** → Calls Supabase `/auth/v1/user` to verify token
5. **Backend syncs** → Creates/updates user in local PostgreSQL `users` table
6. **Report submission** → Backend sends to Gemini AI → stores result in DB
7. **Dashboard refresh** → Frontend polls `/api/dashboard` → renders charts

---

## 📁 Project Structure

```
AI-Relief-Command-Center/
├── .github/
│   ├── ISSUE_TEMPLATE/          # Issue templates
│   ├── workflows/               # GitHub Actions CI/CD
│   └── PULL_REQUEST_TEMPLATE.md
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app, all API routes, CORS config
│   │   ├── auth.py              # Supabase JWT verification, user sync
│   │   ├── config.py            # Environment config loader
│   │   ├── crud.py              # Database CRUD operations
│   │   ├── database.py          # SQLAlchemy models & engine setup
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── schemas_dashboard.py # Dashboard-specific schemas
│   │   ├── services.py          # Gemini AI integration & geocoding
│   │   ├── services/            # Additional service modules
│   │   └── uploads/             # Uploaded images/voice files
│   ├── alembic/                 # Database migration scripts
│   ├── alembic.ini              # Alembic config
│   ├── tests/                   # pytest test suite
│   ├── Dockerfile               # Docker container config
│   ├── Procfile                 # Render deployment command
│   ├── render.yaml              # Render service config
│   ├── requirements.txt         # Python dependencies
│   ├── startup.py               # Server startup script
│   └── .env.example             # Example environment variables
│
├── frontend/
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts        # Axios instance + Supabase token interceptor
│   │   │   ├── mappers.ts       # API response → TypeScript type mappers
│   │   │   └── reports.ts       # Dashboard, simulation, assignment API calls
│   │   ├── components/
│   │   │   ├── Layout.tsx       # Top navbar + hamburger slide-over menu
│   │   │   ├── ProtectedRoute.tsx # Auth guard (redirects to / if no session)
│   │   │   ├── StatCard.tsx     # Animated metric card with hover-lift
│   │   │   ├── PriorityBadge.tsx # Color-coded priority labels
│   │   │   ├── StatusPill.tsx   # Loading, Error, Empty state components
│   │   │   ├── ToastViewport.tsx # Toast notification system
│   │   │   ├── EmptyStateCard.tsx # Reusable empty state placeholder
│   │   │   └── ResourceBadges.tsx # Resource tag badges
│   │   ├── hooks/
│   │   │   ├── useAuth.ts       # Shared auth state (user, session, role, name)
│   │   │   └── useToasts.ts     # Toast notification hook
│   │   ├── lib/
│   │   │   └── format.ts        # Supabase client init, formatters, category config
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx  # Animated auth page (Sign In / Sign Up)
│   │   │   ├── Dashboard.tsx    # Main command center with charts & stats
│   │   │   ├── SubmitReport.tsx # Incident report submission form
│   │   │   ├── PriorityQueue.tsx # AI-ranked incident queue
│   │   │   ├── InteractiveMap.tsx # Leaflet map with incident markers
│   │   │   ├── Operations.tsx   # Team dispatch & operations board
│   │   │   ├── IncidentDetails.tsx # Single incident deep-dive
│   │   │   ├── Profile.tsx      # User details + permissions table
│   │   │   ├── Settings.tsx     # User settings
│   │   │   └── NotFound.tsx     # 404 page
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript interfaces (Report, Team, DashboardData)
│   │   ├── App.tsx              # Route definitions
│   │   ├── main.tsx             # React entry point
│   │   └── index.css            # Tailwind + custom animations
│   ├── index.html               # HTML entry point
│   ├── vite.config.ts           # Vite configuration
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   ├── tsconfig.json            # TypeScript config
│   └── package.json             # Node dependencies & scripts
│
├── scripts/
│   └── deploy_backend.ps1       # PowerShell deployment script
│
├── docs/                        # Additional documentation
├── LICENSE                      # MIT License
└── README.md                    # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+ and npm
- **PostgreSQL** database (or a [Supabase](https://supabase.com) project)
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/apikey))

### 1. Clone the Repository

```bash
git clone https://github.com/SVGnanavardhan/AI-Relief-Command-Center.git
cd AI-Relief-Command-Center
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your actual values (see Environment Variables section)

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
# Create a .env file with:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
# VITE_API_URL=http://localhost:8000/api

# Start the dev server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### 4. Verify the Setup

1. Open `http://localhost:5173` — you should see the animated landing page
2. Sign up with an email and password
3. After sign-in, you'll be redirected to the dashboard
4. Submit a test incident report to verify AI processing

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| `GEMINI_API_KEY` | Google Gemini AI API key | `AIza...` |
| `GEMINI_MODEL` | Gemini model to use | `gemini-2.0-flash` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ...` |
| `SUPABASE_JWT_SECRET` | JWT signing secret | `your-jwt-secret` |
| `SECRET_KEY` | App secret for sessions | `your-app-secret` |
| `UPLOAD_DIR` | File upload directory | `app/uploads` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:5173` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173,https://your-domain.com` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | `eyJ...` |
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000/api` |

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user (syncs with Supabase) |
| `POST` | `/api/auth/login` | Login with Supabase access token |
| `GET` | `/api/auth/me` | Get current user profile |
| `POST` | `/api/auth/logout` | Logout |
| `POST` | `/api/auth/refresh` | Refresh session token |

### Reports & Incidents
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/report` | Submit incident (text/image/voice → AI analysis) |
| `GET` | `/api/reports` | List all reports |
| `GET` | `/api/reports/{id}` | Get detailed incident report |
| `POST` | `/api/reports/{id}/status` | Update incident status |
| `GET` | `/api/reports/{id}/history` | Get status change history |
| `POST` | `/api/reports/{id}/assign-team/{team_id}` | Assign team to incident |

### Teams & Operations
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/teams` | Create a response team |
| `GET` | `/api/teams` | List all teams |
| `GET` | `/api/operations` | Operations summary (incidents, teams, inventory) |
| `GET` | `/api/notifications` | Get dispatch notifications |
| `POST` | `/api/notifications` | Create notification |

### Dashboard & Simulation
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Dashboard metrics and analytics |
| `POST` | `/api/simulation/run` | Run disaster simulation (Admin only) |
| `GET` | `/api/simulation/status` | Check simulation progress |

### System
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |

---

## 🗄️ Database Schema

The application uses **15 PostgreSQL tables** managed via SQLAlchemy ORM:

| Table | Purpose |
|---|---|
| `users` | User accounts (synced from Supabase Auth) |
| `reports` | Incident reports with AI analysis results |
| `teams` | Rescue/response teams |
| `incident_status_logs` | Status change audit trail |
| `rescue_notifications` | Team dispatch notifications |
| `inventory_items` | Resource inventory |
| `notifications` | General notifications |
| `incident_history` | Incident timeline events |
| `mission_history` | Mission completion records |
| `inventory` | Resource stock tracking |
| `simulation_events` | Crisis simulation data |
| `activity_feed` | Dashboard activity stream |
| `dispatch_history` | Team dispatch records |
| `resources` | Available resource catalog |
| `roles` | Role definitions |

---

## 🖥️ Frontend Pages

| Page | Route | Description |
|---|---|---|
| **Landing Page** | `/` | Animated auth page with Sign In/Sign Up tabs |
| **Dashboard** | `/dashboard` | Command center with live stats, charts, and feed |
| **Submit Report** | `/submit` | Multi-modal incident report form |
| **Priority Queue** | `/queue` | AI-ranked list of incidents by urgency |
| **Interactive Map** | `/map` | Leaflet map with geocoded incident markers |
| **Operations** | `/operations` | Team dispatch board with auto-assign |
| **Incident Details** | `/incident/:id` | Deep-dive into a single incident |
| **Profile** | `/profile` | User details and access permissions |
| **Settings** | `/settings` | User preferences |

---

## 🔐 Authentication Flow

```
User (Browser)          Supabase Auth           Backend (FastAPI)         PostgreSQL
     │                       │                        │                       │
     │── signUp/signIn ─────►│                        │                       │
     │◄── JWT token ─────────│                        │                       │
     │                       │                        │                       │
     │── POST /auth/login ───┼───────────────────────►│                       │
     │   (Bearer JWT)        │                        │── verify token ──────►│
     │                       │◄── validate JWT ───────│                       │
     │                       │── user profile ───────►│                       │
     │                       │                        │── upsert user ───────►│
     │◄── { user, token } ───┼────────────────────────│                       │
     │                       │                        │                       │
     │── GET /api/dashboard ─┼───────────────────────►│── query data ────────►│
     │   (Bearer JWT)        │                        │◄── results ──────────│
     │◄── dashboard data ────┼────────────────────────│                       │
```

### Roles & Permissions

| Permission | Citizen | Rescue Team | Operations Officer | Administrator |
|---|:---:|:---:|:---:|:---:|
| Submit reports | ✅ | ✅ | ✅ | ✅ |
| View dashboard | ✅ | ✅ | ✅ | ✅ |
| View map | ✅ | ✅ | ✅ | ✅ |
| Access priority queue | ❌ | ✅ | ✅ | ✅ |
| Dispatch teams | ❌ | ❌ | ✅ | ✅ |
| Auto-assign & simulation | ❌ | ❌ | ❌ | ✅ |
| System settings | ❌ | ❌ | ❌ | ✅ |

---

## 🌐 Deployment

### Render (Current Setup)

**Backend** — Web Service:
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Root Directory:** `backend`

**Frontend** — Static Site:
- **Build Command:** `cd frontend && npm install && npm run build`
- **Publish Directory:** `frontend/dist`

### Docker

```bash
# Backend
cd backend
docker build -t relief-backend .
docker run -p 8000:8000 --env-file .env relief-backend
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for disaster relief coordination**

Made by [SVGnanavardhan](https://github.com/SVGnanavardhan)

</div>
