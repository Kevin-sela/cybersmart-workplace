# CyberSmart Workplace frontend

Responsive Next.js learner interface for the CyberSmart Workplace course.

## Run locally

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open http://localhost:3000 for the public course landing page. The learner dashboard is at http://localhost:3000/dashboard. The first lesson's completion state is stored in local browser storage as a prototype; it is not synced to a learner account.

The browser calls frontend-owned paths under `/api` (for example, `/api/session/start` and `/api/learning/catalog`). Next.js rewrites those aliases to the FastAPI routes using the server-only `BACKEND_API_ORIGIN`, which defaults to `http://127.0.0.1:8000`. Set that variable in `.env.local` when the local API uses a different address. Email/password account endpoints and the optional Google sign-in flow use HttpOnly session cookies scoped to the frontend aliases.

## Web push notifications

The dashboard bell subscribes this browser to web push through OneSignal. Create a free OneSignal app, configure its Web Push platform for your site origin, then copy the **App ID** from **Settings → Keys & IDs** into `NEXT_PUBLIC_ONESIGNAL_APP_ID` in `frontend/.env.local` (copy `frontend/.env.example` first). Restart the frontend after changing the value. The App ID is public; never put a OneSignal REST API key in a `NEXT_PUBLIC_` variable. With this setup, send test pushes from the OneSignal dashboard. Backend-triggered pushes would need the REST API key stored only in the backend environment.

The service worker is served from `/OneSignalSDKWorker.js`. Push requires localhost during development or HTTPS on the deployed site, and each visitor must allow notifications in their browser.

The dashboard intentionally labels itself as a course preview. It contains course structure and learning objectives from the supplied project documents, not learner analytics. The backend and database integration will be added separately.
