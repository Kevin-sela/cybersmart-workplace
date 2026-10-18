# Deployment

The frontend is deployed to Vercel from the `frontend/` directory. The FastAPI API and PostgreSQL database are deployed to Render from this repository's root using `render.yaml`.

## Vercel

1. Import the GitHub repository into Vercel and set **Root Directory** to `frontend`.
2. Add `BACKEND_API_ORIGIN` to the Production and Preview environments. Set it to the Render web service URL, without a trailing slash, such as `https://cybersmart-workplace-api.onrender.com`.
3. Deploy and copy the Vercel production URL.

The browser calls frontend-owned `/api/*` aliases. Next.js rewrites those paths to FastAPI on the server, keeping the backend's route paths and host out of browser requests while retaining same-origin authentication cookies.

## Render

1. Create a Blueprint from the GitHub repository. Render reads `render.yaml` to create the API and its PostgreSQL database.
2. Set `FRONTEND_ORIGIN` to the Vercel production origin, for example `https://cybersmart-workplace.vercel.app`.
3. Set `CORS_ORIGINS` to the same origin.
4. Run the service after entering the required Google OAuth values below.

The start command applies Alembic migrations and seeds the course before starting Uvicorn. Render's PostgreSQL URL is normalized to the installed `psycopg` v3 driver.

The Blueprint uses Render's free web service and free PostgreSQL plan to avoid starting a paid service. Free web services can spin down when idle, and the free PostgreSQL database expires 30 days after creation; upgrade the database before then to preserve learner data. [Render's free plan limits](https://render.com/docs/free)

## Google OAuth

Create a Google OAuth web client and configure its authorized redirect URI as:

```text
https://<your-vercel-domain>/api/identity/google/callback
```

Set these Render environment variables:

- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from the Google OAuth client.
- `GOOGLE_REDIRECT_URI` to the exact callback URI above.
- `FRONTEND_ORIGIN` and `CORS_ORIGINS` to the Vercel production origin.

The callback goes through Vercel's `/api/identity/google/callback` alias to Render. The browser therefore receives the OAuth session and authentication cookies on the Vercel domain. Keep the Google client secret, Render database URL, and JWT secret in provider environment settings only.

## Local setup

In `frontend/.env.local`, set `BACKEND_API_ORIGIN=http://127.0.0.1:8000`. For local Google sign-in, use `http://localhost:3000/api/identity/google/callback` as the authorized redirect URI and set the matching `GOOGLE_REDIRECT_URI` and `FRONTEND_ORIGIN` in `backend/.env`.
