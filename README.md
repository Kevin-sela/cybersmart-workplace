# CyberSmart Workplace

A planned low-bandwidth e-learning application for a short course on **Cybersecurity Awareness for Working Professionals**.

## Current build

The app has a public course landing page, learner dashboard, sign-in/sign-up, learner profile, course progress, quiz submission, discussions with learner-created channels, and a group checklist. The FastAPI backend includes account/session handling, profile updates, course content, progress, quizzes, forum, and group-task APIs. Instructor reporting and LMS integration remain future scope.

For setup, run the API using [`backend/README.md`](backend/README.md) and the web app using [`frontend/README.md`](frontend/README.md). The local backend defaults to SQLite; PostgreSQL 15+ is configured through `DATABASE_URL`.

Deployment instructions for Vercel, Render, PostgreSQL, and Google OAuth are in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Project references

- `docs/PRD.md` — product requirements and scope.
- `docs/DESIGN.md` — UX and visual design principles.
- `docs/ARCHITECTURE.md` — system structure and key flows.
- `docs/TECH_REQUIREMENTS.md` — proposed tools and setup.
- `docs/CyberSmart_TRD_and_Database/database/` — proposed PostgreSQL schema and seed.
