# CyberSmart backend

FastAPI + SQLAlchemy API for the CyberSmart Workplace learning app. Routing, services, repositories, schemas, and database models are kept separate. All protected API routes require a valid learner session.

## Local development

Use [uv](https://docs.astral.sh/uv/) to manage Python and dependencies. The project pins Python 3.12 in `.python-version` and supports Python 3.11 through 3.13.

```powershell
cd backend
uv sync --all-groups
Copy-Item .env.example .env
uv run uvicorn app.main:app --reload
```

The default local mode uses SQLite, creates the schema, and seeds the course idempotently at startup. The database file is `backend/cybersmart.db`. The browser app proxies `/api/v1/*` to `http://127.0.0.1:8000`; set `BACKEND_API_ORIGIN` in `frontend/.env.local` to change it.

`uv sync --all-groups` creates the project `.venv` and installs the pinned runtime and development dependencies from `pyproject.toml` and `uv.lock`. Use `uv run` for backend commands so a system Python launcher or shell activation is not required. `requirements.txt` remains available for hosts that install from pip.

## PostgreSQL

Use PostgreSQL 15 or newer as required in the technical design. Set `DATABASE_URL` in `backend/.env` to a private connection string, then run:

```powershell
uv run alembic upgrade head
uv run python -m app.db.seed
```

Never commit `.env` or real learner records. `database/schema.sql` remains the project’s reviewed SQL reference; Alembic is the versioned application migration path.

## API

- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- `GET /api/v1/auth/google/login` and `GET /api/v1/auth/google/callback` for optional Google OpenID Connect sign-in
- `GET /api/v1/auth/google/login` and `/auth/google/callback` for Google OpenID Connect sign-in/sign-up
- `GET/PATCH /api/v1/users/me`
- `GET /api/v1/courses`, `/courses/{slug}`, `/lessons/{slug}`
- Protected learner progress, final quiz, forum channels/posts, and group task endpoints are listed in `/docs` during development.

Registration creates a learner, a private profile, and an enrollment when the seeded course exists. Access and rotating refresh tokens are held in HttpOnly, SameSite cookies. Passwords use Argon2id. Do not use the development JWT secret or insecure cookies in production; production requires a private 32+ character secret and HTTPS cookies.

Google sign-in is enabled after adding `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `backend/.env`. Register the exact value of `GOOGLE_REDIRECT_URI` as an authorized redirect URI in the Google Cloud OAuth client. The local default is `http://localhost:3000/api/v1/auth/google/callback`, which uses the frontend’s same-origin API proxy. Production should use the corresponding HTTPS app URL for this callback and set `FRONTEND_ORIGIN` to that app origin. Google OAuth setup requires a consent screen and OAuth web client in Google Cloud Console.

Inputs use typed Pydantic schemas with bounded lengths, allowlisted fields, normalized names/text, validated email/locale, and control-character checks for user-authored content. Free text is stored as plain text and must be rendered as text (never injected as HTML). SQL access uses SQLAlchemy bound parameters. Authorization checks occur in API dependencies and services.

Google sign-in is enabled when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured. Set `GOOGLE_REDIRECT_URI` to the frontend-origin URL `/api/v1/auth/google/callback`; the Next.js rewrite proxies this route to the API so session cookies stay on the frontend origin. See [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) for hosted setup.

## Seed content

`app/db/seed_data.py` creates synthetic course examples with reserved `.example` domains and no active phishing URLs or demo learner accounts. `database/seed.sql` points to the single repeatable seed implementation. The UCI Phishing Websites dataset informed indicator themes only; see `database/SOURCES.md`.
