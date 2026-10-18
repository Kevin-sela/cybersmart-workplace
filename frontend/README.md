# CyberSmart Workplace frontend

Responsive Next.js learner interface for the CyberSmart Workplace course.

## Run locally

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open http://localhost:3000 for the public course landing page. The learner dashboard is at http://localhost:3000/dashboard. The first lesson's completion state is stored in local browser storage as a prototype; it is not synced to a learner account.

The frontend proxies `/api/v1/*` through `BACKEND_API_ORIGIN`, which defaults to `http://127.0.0.1:8000`. Set the same variable in `.env.local` when the local API uses a different address. Email/password account endpoints and the optional Google sign-in flow use the API's HttpOnly session cookies.

The dashboard intentionally labels itself as a course preview. It contains course structure and learning objectives from the supplied project documents, not learner analytics. The backend and database integration will be added separately.
