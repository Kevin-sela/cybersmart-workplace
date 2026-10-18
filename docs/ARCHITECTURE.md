# Architecture

## High-level structure
The repository keeps backend and frontend together under one project root while maintaining clear separation of responsibilities.

```text
CyberSmart-Workplace/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   └── services/
│   └── tests/
├── frontend/
│   └── src/
│       ├── components/
│       ├── features/
│       ├── hooks/
│       ├── pages/
│       ├── services/
│       └── styles/
├── docs/
│   ├── PRD.md
│   ├── DESIGN.md
│   └── ARCHITECTURE.md
├── report/
└── AGENTS.md
```

## Proposed technology choices
- Frontend: React + TypeScript, responsive web UI.
- Backend: FastAPI with Pydantic request/response schemas.
- Database: PostgreSQL for users, course structure, attempts, progress and survey responses.
- Testing: pytest for API tests and a frontend test runner selected during implementation.
- Deployment: a single web origin where practical, or explicit environment-based API configuration.

These are proposed choices and can be revised to match the team's skills and the lecturer's requirements.

## Main components
- **Frontend:** renders lessons, discussions, tasks, quiz and progress.
- **API layer:** validates requests and applies authentication/authorization.
- **Service layer:** handles course progress, quiz scoring and feedback.
- **Repository/data layer:** reads and writes application records.
- **Database:** stores course content metadata, progress and assessment attempts.
- **Instructor functions:** view aggregated completion and quiz outcomes.

## Main request flow
1. Learner opens a course page in the frontend.
2. Frontend calls the API using the configured API base URL.
3. FastAPI validates the request and invokes the relevant service.
4. The service reads/writes through the repository layer.
5. The API returns a typed response; the frontend shows content or feedback.

## Security and privacy
- Store secrets in environment variables, never in source control.
- Validate and authorize instructor-only endpoints on the server.
- Collect only data needed for course delivery and evaluation.
- Use synthetic data in the prototype and avoid confidential workplace information.
- Apply input validation, safe error responses, HTTPS in deployment and dependency updates.
- Define retention and deletion rules before production use.

## Reliability and low-bandwidth support
- Provide text-first resources and downloadable alternatives.
- Compress media and avoid loading large assets on the landing page.
- Show retry guidance for network failures.
- Keep frontend errors useful without exposing stack traces or secrets.

## Quality gates
- Backend unit/API tests pass.
- Frontend lint/type checks pass.
- Main learner flow is manually tested on desktop and mobile widths.
- Quiz feedback, keyboard navigation and contrast are checked before demonstration.
